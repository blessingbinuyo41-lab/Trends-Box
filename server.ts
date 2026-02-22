import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Local proxy for Netlify Functions to support AI Studio preview
  app.post("/.netlify/functions/generate", async (req, res) => {
    try {
      const { prompt, genType } = req.body;
      const groqKey = process.env.GROQ_API_KEY;
      const tavilyKey = process.env.TAVILY_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (!groqKey || !tavilyKey) {
        return res.status(500).json({ 
          error: "Missing API Keys. Please set GROQ_API_KEY and TAVILY_API_KEY in the Secrets panel." 
        });
      }

      const groq = new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const tvly = tavily({ apiKey: tavilyKey });

      let context = "";
      let sources: any[] = [];
      
      if (prompt.toLowerCase().includes("find the latest news") || prompt.toLowerCase().includes("latest news")) {
        try {
          const currentDate = new Date().toISOString().split('T')[0];
          // Refine search to find the single most trending/recent story with date context
          const searchResult = await tvly.search(`${prompt} single most trending news story as of ${currentDate}`, {
            searchDepth: "advanced",
            maxResults: 3, 
            includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng"]
          });
          context = searchResult.results.map((r, i) => `[Source ${i}] Title: ${r.title}\nContent: ${r.content}`).join("\n\n");
          
          // Extract a cleaner platform name from the URL or title
          sources = searchResult.results.map((r, i) => {
            const url = new URL(r.url);
            let platform = url.hostname.replace('www.', '').split('.')[0];
            
            const platformMap: Record<string, string> = {
              'punchng': 'The Punch',
              'vanguardngr': 'Vanguard',
              'dailypost': 'Daily Post',
              'premiumtimesng': 'Premium Times',
              'guardian': 'The Guardian NG',
              'independent': 'Independent',
              'thenationonlineng': 'The Nation',
              'thisdaylive': 'ThisDay'
            };
            
            return { 
              id: i,
              name: r.title, 
              platform: platformMap[platform] || platform.charAt(0).toUpperCase() + platform.slice(1),
              url: r.url 
            };
          });
        } catch (e) {
          console.error("Local search failed:", e);
        }
      }

      const systemPrompt = `You are an elite Nigerian investigative journalist and senior news editor. 
      Your task is to transform raw news data into a "crafted" editorial piece.

      CRITICAL REQUIREMENT:
      - RECENCY: You MUST prioritize information from today or the last 24 hours. If the context contains multiple dates, focus on the most recent one.
      - FOCUS: You MUST select ONE specific, cohesive news story from the provided context or prompt. 
      - COHESION: The entire article (Title, Excerpt, and Content) must focus strictly on this SINGLE topic. Do not mix multiple unrelated news items.
      
      STYLE GUIDELINES:
      - TITLE: Punchy, specific, and authoritative (e.g., "MTN Bids $6.2B for Full Control of IHS Towers").
      - EXCERPT: A single, elegant, sophisticated sentence capturing the core significance.
      - CONTENT: Professional, human-like delivery with sophisticated vocabulary.
      - SOURCES: Identify which sources from the context (e.g., [Source 0], [Source 1]) are directly relevant to the specific story you generated.
      - FORMAT: Return ONLY a JSON object with fields: title, excerpt, content, and relevantSourceIds (an array of numbers corresponding to the [Source X] IDs). No markdown outside the JSON.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Filter sources to only include those the model found relevant
      let filteredSources = sources;
      if (data.relevantSourceIds && Array.isArray(data.relevantSourceIds)) {
        filteredSources = sources.filter(s => data.relevantSourceIds.includes(s.id));
      }
      // Fallback: if model returned no sources but we have some, keep the first one as a safety net
      if (filteredSources.length === 0 && sources.length > 0) {
        filteredSources = [sources[0]];
      }

      // High-Quality Image Generation using Gemini
      let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(data.title || 'news')}/1200/630`;
      
      if (geminiKey) {
        try {
          const genAI = new GoogleGenAI({ apiKey: geminiKey });
          const imgModel = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: `A high-end editorial news graphic for a story titled: "${data.title}". The image should look like a professional magazine cover or a lead digital journalism header. Incorporate relevant Nigerian corporate or urban elements, clean typography-friendly composition, and a sophisticated color palette. Style: Photorealistic, cinematic lighting, 8k resolution, professional branding.` }]
            },
            config: { imageConfig: { aspectRatio: "16:9" } }
          });
          
          for (const part of imgModel.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (imgErr) {
          console.error("Local Gemini image generation failed:", imgErr);
        }
      }

      res.json({ 
        ...data, 
        sources: filteredSources,
        imageUrl 
      });
    } catch (error: any) {
      console.error("Local function error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes (Add any non-database routes here if needed)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Trends Box Server is running" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // Fallback if dist doesn't exist yet
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

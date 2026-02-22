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
          const searchResult = await tvly.search(prompt, {
            searchDepth: "advanced",
            maxResults: 5,
            includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng"]
          });
          context = searchResult.results.map(r => `Source: ${r.title}\nContent: ${r.content}`).join("\n\n");
          sources = searchResult.results.map(r => ({ name: r.title, url: r.url }));
        } catch (e) {
          console.error("Local search failed:", e);
        }
      }

      const systemPrompt = `You are a professional Nigerian news editor. 
      Generate a ${genType} post based on the provided context or prompt.
      Return ONLY a JSON object with these fields: title, excerpt, content.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(completion.choices[0].message.content || '{}');
      
      // High-Quality Image Generation using Gemini
      let imageUrl = `https://picsum.photos/seed/${encodeURIComponent(data.title || 'news')}/1200/630`;
      
      if (geminiKey) {
        try {
          const genAI = new GoogleGenAI({ apiKey: geminiKey });
          const imgModel = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: `A professional, high-quality news header graphic for: "${data.title}". Style: Modern digital journalism, clean composition, realistic elements, 4k resolution.` }]
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
        sources: sources.length > 0 ? sources : (data.sources || []),
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

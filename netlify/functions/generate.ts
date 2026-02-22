import { OpenAI } from "openai";
import { tavily } from "@tavily/core";
import { GoogleGenAI } from "@google/genai";

export const handler = async (event: any) => {
  console.log("Function triggered with method:", event.httpMethod);
  
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt, genType } = JSON.parse(event.body);
    console.log("Processing prompt for type:", genType);
    
    // API Keys from environment
    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!groqKey || !tavilyKey) {
      console.error("Missing API Keys in environment");
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Missing API Keys. Please ensure GROQ_API_KEY and TAVILY_API_KEY are set in Netlify environment variables." 
        }),
      };
    }

    const groq = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const tvly = tavily({ apiKey: tavilyKey });

    // 1. Search for latest news
    let context = "";
    let sources: any[] = [];
    
    if (prompt.toLowerCase().includes("find the latest news") || prompt.toLowerCase().includes("latest news")) {
      try {
        const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        // Refine search to be extremely aggressive about "today"
        const searchResult = await tvly.search(`${prompt} breaking news published today ${currentDate} Nigeria`, {
          searchDepth: "advanced",
          maxResults: 5, 
          includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng"]
        });
        
        context = `TODAY'S DATE: ${currentDate}\n\n` + searchResult.results.map((r, i) => `[Source ${i}] Title: ${r.title}\nContent: ${r.content}`).join("\n\n");
        
        // Extract a cleaner platform name from the URL or title
        sources = searchResult.results.map((r, i) => {
          const url = new URL(r.url);
          let platform = url.hostname.replace('www.', '').split('.')[0];
          
          // Map common Nigerian news domains to pretty names
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
      } catch (searchErr) {
        console.error("Tavily search failed:", searchErr);
      }
    }

    // 2. Generate Content using Llama 3 on Groq
    const systemPrompt = `You are an elite Nigerian investigative journalist and senior news editor. 
    Your task is to transform raw news data into a "crafted" editorial piece.

    CRITICAL REQUIREMENT:
    - RECENCY: You MUST ONLY use news from the provided "TODAY'S DATE". If all search results are older than 24 hours from that date, you MUST search for a different trending topic from today within the same category. DO NOT generate news from weeks or months ago.
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

    // 3. High-Quality Image Generation using Gemini
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
            console.log("Gemini image generated successfully");
            break;
          }
        }
      } catch (imgErr) {
        console.error("Gemini image generation failed, using fallback:", imgErr);
      }
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ 
        ...data, 
        sources: filteredSources,
        imageUrl 
      }),
    };
  } catch (error: any) {
    console.error("Function execution error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

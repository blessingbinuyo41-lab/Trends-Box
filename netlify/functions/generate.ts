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
        const searchResult = await tvly.search(prompt, {
          searchDepth: "advanced",
          maxResults: 5,
          includeDomains: ["punchng.com", "vanguardngr.com", "dailypost.ng", "premiumtimesng.com", "guardian.ng"]
        });
        
        context = searchResult.results.map(r => `Source: ${r.title}\nContent: ${r.content}`).join("\n\n");
        sources = searchResult.results.map(r => ({ name: r.title, url: r.url }));
      } catch (searchErr) {
        console.error("Tavily search failed:", searchErr);
      }
    }

    // 2. Generate Content using Llama 3 on Groq
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

    // 3. High-Quality Image Generation using Gemini
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
        sources: sources.length > 0 ? sources : (data.sources || []),
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

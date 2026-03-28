import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ summary: "No API Key available in .env configuration to generate a summary." });
    }

    const systemPrompt = "You are a helpful AI assistant. Please summarize the following conversation transcript from a video meeting into 2-3 concise bullet points or sentences.";

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: transcript }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      summary: data.choices[0]?.message?.content || "Could not generate summary."
    });
  } catch (error: unknown) {
    console.error("Groq Summary Error:", error);
    return NextResponse.json({ error: "Failed to summarize request", details: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

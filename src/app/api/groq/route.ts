import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, previousMessages = [], systemPrompt: clientPrompt } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        text: "It looks like my Groq A.P.I key is missing from the environment variables. Please add it to your dot environment file to enable responses!"
      });
    }

    const systemPrompt = clientPrompt || "You are a helpful, conversational AI assistant speaking over a voice call. Keep your responses very brief, natural, and friendly. Do not use markdown format as your text will be read by a text-to-speech engine.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...previousMessages,
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Fast and free model
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      text: data.choices[0]?.message?.content || "I'm sorry, I didn't catch that."
    });
  } catch (error: any) {
    console.error("Groq Endpoint Error:", error);
    return NextResponse.json({ error: "Failed to process request", details: error?.message || String(error) }, { status: 500 });
  }
}

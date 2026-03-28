import { NextResponse } from 'next/server';
import { streamChat } from "@/lib/stream-chat";
import { db } from "@/db";
import { meetings, agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateAvatarUri } from "@/lib/avatar";

export async function POST(req: Request) {
  try {
    const { meetingId, text, previousMessages = [] } = await req.json();

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(eq(meetings.id, meetingId));

    if (!existingMeeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "Groq API Key is missing. Add GROQ_API_KEY to your .env" }, { status: 400 });
    }

    const systemPrompt = `You are a helpful AI assistant answering questions about a recently completed meeting. 
Below is the summary of the meeting:
${existingMeeting.meetings.summary || "No summary available."}

User will ask you questions about the meeting. Please answer based on the summary.`;

    const systemPromptMessage = { role: "system", content: systemPrompt };
    const rawMessages = [systemPromptMessage, ...previousMessages, { role: "user", content: text }];
    
    // Merge consecutive messages of the same role (Llama 3 requires strictly alternating roles)
    const mergedMessages = [];
    for (const msg of rawMessages) {
        if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
            mergedMessages[mergedMessages.length - 1].content += "\n" + msg.content;
        } else {
            mergedMessages.push({ ...msg });
        }
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: mergedMessages,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await groqRes.json();
    const replyText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    const channel = streamChat.channel("messaging", meetingId);
    
    await streamChat.upsertUser({
        id: existingMeeting.agents.id,
        name: existingMeeting.agents.name,
        image: generateAvatarUri({ seed: existingMeeting.agents.name, variant: "butttsNeutral" })
    });

    await channel.sendMessage({
        text: replyText,
        user: {
            id: existingMeeting.agents.id
        }
    });

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Ask AI Chat Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

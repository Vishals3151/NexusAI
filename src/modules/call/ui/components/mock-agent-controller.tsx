"use client";

import { useEffect, useRef, useState } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { generateAvatarUri } from "@/lib/avatar";

export const MockAgentController = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [, setLatestMessage] = useState<string>("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<{ role: string, content: string }[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const call = useCall();
  const trpc = useTRPC();
  const meetingId = call?.id;

  const { data: meeting } = useQuery({
    ...trpc.meetings.getOne.queryOptions({ id: meetingId! }),
    enabled: !!meetingId
  });

  const { mutateAsync: updateMeetingAsync } = useMutation({
    ...trpc.meetings.update.mutationOptions()
  });

  // Handle saving meeting summary and transcript when leaving
  useEffect(() => {
    const handleSaveEvent = async () => {
      const messages = messagesRef.current;
      if (messages.length === 0) {
        window.dispatchEvent(new CustomEvent("mock-meeting-saved"));
        return;
      }
      try {
        let elapsedSeconds = 0;
        const jsonlArray = messages.map(msg => {
          const start_ts = elapsedSeconds;
          elapsedSeconds += 3; // roughly 3 seconds of talk time
          const stop_ts = elapsedSeconds;
          return JSON.stringify({
            text: msg.content,
            speaker_id: msg.role === 'assistant' ? meeting?.agent?.id : meeting?.userId,
            start_ts,
            stop_ts,
            type: "sentence"
          });
        });
        const jsonlString = jsonlArray.join('\n');
        // Base64 encoding standard trick for utf-8
        const encodedData = btoa(unescape(encodeURIComponent(jsonlString)));
        const transcriptUrl = `data:text/plain;charset=utf-8;base64,${encodedData}`;

        const plainText = messages.map(m => `${m.role === 'assistant' ? (meeting?.agent?.name || 'Agent') : 'User'}: ${m.content}`).join('\n');

        const summaryRes = await fetch('/api/groq-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: plainText })
        });
        const summaryData = await summaryRes.json();

        await updateMeetingAsync({
          id: meetingId!,
          summary: summaryData.summary || "No summary generated.",
          transcriptUrl
        });
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        window.dispatchEvent(new CustomEvent("mock-meeting-saved"));
      }
    };

    window.addEventListener("save-mock-meeting", handleSaveEvent);
    return () => window.removeEventListener("save-mock-meeting", handleSaveEvent);
  }, [meetingId, meeting?.agent?.id, meeting?.userId, meeting?.agent?.name, updateMeetingAsync]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition is not supported in this browser.");
      setLatestMessage("Speech Recognition not supported here. Use text input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;

      if (transcript.trim()) {
        console.log("🗣️ User:", transcript);
        await handleSendToGroq(transcript);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart recognition unless the agent is currently speaking
      if (!recognitionRef.current?.isSpeakingFlag) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.debug("Recognition start error", e);
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    recognitionRef.current.isSpeakingFlag = false;

    // Start listening initially
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.debug("Initial recognition start error", e);
    }

    return () => {
      recognition.stop();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendToGroq = async (text: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.isSpeakingFlag = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setIsSpeaking(true);
    setLatestMessage("Thinking...");

    try {
      const customInstructions = meeting?.agent?.instructions;
      const systemPrompt = customInstructions
        ? `${customInstructions}\n\nPlease keep your responses brief, conversational, and completely plain text without Markdown since this text goes directly to a text-to-speech engine.`
        : undefined;

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          previousMessages: messagesRef.current,
          systemPrompt
        })
      });

      if (!response.ok) throw new Error("API error from Groq Route");

      const data = await response.json();

      messagesRef.current = [
        ...messagesRef.current,
        { role: "user", content: text },
        { role: "assistant", content: data.text }
      ];

      console.log("🤖 Agent:", data.text);
      setLatestMessage(data.text);
      speakText(data.text);
    } catch (err) {
      console.error(err);
      setLatestMessage("Sorry, I encountered an error connecting to Groq.");
      speakText("I encountered an error.");
    }
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      finishSpeaking();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Load voices safely
    let voices = window.speechSynthesis.getVoices();
    const setVoiceAndSpeak = () => {
      voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'))) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.0;

      utterance.onend = () => finishSpeaking();
      utterance.onerror = () => finishSpeaking();

      window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak();
      };
    } else {
      setVoiceAndSpeak();
    }
  };

  const finishSpeaking = () => {
    setIsSpeaking(false);
    setTimeout(() => {
      setLatestMessage("");
    }, 6000); // clear message after 6 seconds

    if (recognitionRef.current) {
      recognitionRef.current.isSpeakingFlag = false;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.debug("Restart recognition error", e);
      }
    }
  };

  // Give the Mock Agent a visual presence in the call
  const agentName = meeting?.agent?.name || "Mock Agent";
  const agentImage = meeting?.agent ? generateAvatarUri({ seed: agentName, variant: "butttsNeutral" }) : "/logo.svg";

  return (
    <div className="w-full h-full bg-[#101213] flex flex-col items-center justify-center relative overflow-hidden group">
      {/* Glow effect when speaking */}
      {isSpeaking && <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />}

      <div className={`relative size-32 md:size-48 rounded-full overflow-hidden bg-white/10 border-4 shadow-2xl z-10 transition-colors ${isSpeaking ? 'border-blue-500' : 'border-white/5'}`}>
        {meeting?.agent && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agentImage} alt={agentName} className="object-cover w-full h-full" />
        )}
      </div>

      <div className="mt-6 text-center z-10 flex flex-col items-center">
        <h3 className="text-2xl font-bold text-white tracking-wide">{agentName}</h3>
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-black/40 text-sm text-white/80 border border-white/5">
          {isSpeaking ? (
            <><span className="size-2.5 rounded-full bg-blue-500 animate-pulse" /> Speaking...</>
          ) : isListening ? (
            <><span className="size-2.5 rounded-full bg-green-500 animate-pulse" /> Listening...</>
          ) : (
            <><span className="size-2.5 rounded-full bg-zinc-500" /> Offline</>
          )}
        </div>
      </div>

      {/* Captions removed to prevent covering the agent's video stream */}

      {/* Fallback Text Input - visible when hovering or if needed */}
      <form
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit={(e: any) => {
          e.preventDefault();
          const val = e.target.msg.value;
          if (val) {
            handleSendToGroq(val);
            e.target.reset();
          }
        }}
        className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <input name="msg" type="text" placeholder="Type if mic is locked..." className="px-3 py-1.5 rounded-md bg-black/50 border border-white/20 text-white text-sm outline-none focus:border-blue-500 w-48" autoComplete="off" />
        <button type="submit" className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white text-sm rounded-md transition-colors">Send</button>
      </form>
    </div>
  );
};

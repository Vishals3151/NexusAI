import Link from "next/link";
import Image from "next/image";
import {
  useCall,
  CallControls,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import { MockAgentController } from "./mock-agent-controller";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

interface Props {
  onLeave: () => void;
  meetingName: string;
};

export const CallActive = ({ onLeave, meetingName }: Props) => {
  const call = useCall();
  const trpc = useTRPC();
  
  const { mutateAsync: updateMeetingAsync, mutate: updateMeeting } = useMutation({
    ...trpc.meetings.update.mutationOptions()
  });

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (call?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateMeeting({ id: call.id, status: "active" as any, startedAt: new Date() as any });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.id]);

  useEffect(() => {
    const handleFinalize = async () => {
        if (call?.id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await updateMeetingAsync({ id: call.id, status: "completed" as any, endedAt: new Date() as any });
        }
        onLeave();
    };

    window.addEventListener("mock-meeting-saved", handleFinalize);
    return () => window.removeEventListener("mock-meeting-saved", handleFinalize);
  }, [call?.id, updateMeetingAsync, onLeave]);

  const handleLeave = () => {
    setIsFinishing(true);
    window.dispatchEvent(new CustomEvent("save-mock-meeting"));
  };

  return (
    <div className="flex flex-col justify-between p-4 h-full text-white">
      <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4 z-50 relative">
        <Link href="/" className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
          <Image src="/logo.svg" width={22} height={22} alt="Logo" />
        </Link>
        <h4 className="text-base">
          {meetingName}
        </h4>
      </div>
      
      <div className="flex-1 w-full my-4 relative rounded-2xl overflow-hidden bg-[#101213]/50">
         <div className="absolute inset-0 z-0 flex items-center justify-center">
            <MockAgentController />
         </div>
         {/* User PIP like in the image */}
         <div className="absolute bottom-4 right-4 z-10 w-fit min-w-[200px] h-[150px] rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-[#101213]">
            <SpeakerLayout />
         </div>
      </div>

      <div className="bg-[#101213] rounded-full px-4 z-50 relative flex justify-center">
        {isFinishing ? (
           <div className="flex items-center gap-2 px-4 py-2 text-sm text-white/70">
              <span className="size-4 border-2 border-t-blue-500 border-white/20 rounded-full animate-spin" /> Saving Meeting...
           </div>
        ) : (
           <CallControls onLeave={handleLeave} />
        )}
      </div>
    </div>
  );
};
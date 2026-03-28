"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarIcon, MicIcon, UsersIcon, ClockIcon, ArrowRightIcon, BrainCircuitIcon, BotIcon, FileTextIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";

import { columns } from "@/modules/meetings/ui/components/columns";
import { NewMeetingDialog } from "@/modules/meetings/ui/components/new-meeting-dialog";

export const HomeView = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);

  const { data: stats } = useSuspenseQuery(
    trpc.meetings.getStats.queryOptions()
  );

  const { data: recentMeetings } = useSuspenseQuery(
    trpc.meetings.getMany.queryOptions({
      page: 1,
      pageSize: 5,
    })
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-y-4 pt-4 pb-6 mt-4">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Manage your meetings, AI agents, and transcriptions seamlessly.
          </p>
        </div>
        <Button onClick={() => setIsNewMeetingOpen(true)} className="rounded-full shadow-md gap-x-2" size="lg">
          <MicIcon className="size-5" />
          Start New Meeting
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-6 border flex items-center gap-x-4 hover:shadow-md transition-shadow">
          <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <CalendarIcon className="size-6 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Total Meetings</span>
            <span className="text-3xl font-bold">{stats.totalMeetings}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-6 border flex items-center gap-x-4 hover:shadow-md transition-shadow">
          <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <ClockIcon className="size-6 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Minutes Recorded</span>
            <span className="text-3xl font-bold">{stats.totalDurationMinutes}</span>
          </div>
        </div>

        <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-6 border flex items-center gap-x-4 hover:shadow-md transition-shadow">
          <div className="size-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <UsersIcon className="size-6 text-purple-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Active Agents</span>
            <span className="text-3xl font-bold">{stats.activeAgents}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (Lists & Tables) */}
        <div className="lg:col-span-2 flex flex-col gap-y-6">

          {/* Recent Meetings */}
          <div className="flex flex-col gap-y-4 bg-card rounded-2xl border shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-y-1">
                <h2 className="text-xl font-semibold tracking-tight">Recent Meetings</h2>
                <p className="text-sm text-muted-foreground">Your latest recorded sessions</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-x-2 rounded-full text-muted-foreground hover:text-foreground" onClick={() => router.push("/meetings")}>
                View All <ArrowRightIcon className="size-4" />
              </Button>
            </div>

            {recentMeetings.items.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <DataTable
                  columns={columns}
                  data={recentMeetings.items}
                  onRowClick={(row) => router.push(`/meetings/${row.id}`)}
                />
              </div>
            ) : (
              <div className="mt-2 border rounded-xl bg-muted/30 p-8">
                <EmptyState
                  title="No recent meetings"
                  description="Start your first recording or schedule an upcoming meeting with your AI agents."
                />
              </div>
            )}
          </div>

          {/* Quick Tip */}
          <div className="flex flex-col gap-y-4 bg-card rounded-2xl border shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col gap-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Quick Tip</h2>
              <p className="text-sm text-muted-foreground">Get the most out of NexusAi</p>
            </div>
            <div className="mt-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-x-3 items-start">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mt-0.5 shadow-sm">
                <MicIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">Maximize Agent Context</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                  Give your AI agents detailed custom instructions before starting a meeting. The more context you provide, the better they will interact and summarize your discussion!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Space - About NexusAi Layout */}
        <div className="lg:col-span-1 flex flex-col gap-y-4 bg-card rounded-2xl border shadow-sm p-6 overflow-hidden h-fit">
          <div className="flex items-center gap-x-3 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2.5 rounded-xl">
              <BrainCircuitIcon className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">About NexusAi</h2>
              <p className="text-xs text-muted-foreground">Your intelligent meeting hub</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            NexusAi integrates continuous voice recording with powerful LLMs to turn your everyday meetings into actionable data. Let your autonomous AI agents handle the note-taking so you can focus on the conversation.
          </p>

          <div className="flex flex-col gap-y-5">
            <div className="flex items-start gap-x-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-lg mt-0.5">
                <BotIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Autonomous Agents</span>
                <span className="text-xs text-muted-foreground mt-0.5">Real-time avatars join your call and actively respond.</span>
              </div>
            </div>

            <div className="flex items-start gap-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-lg mt-0.5">
                <FileTextIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Auto Summarization</span>
                <span className="text-xs text-muted-foreground mt-0.5">Transcripts are parsed via GPT-4o into readable notes automatically.</span>
              </div>
            </div>
          </div>

          <Button className="w-full mt-6 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-800" asChild>
            <Link href="/agents" className="gap-x-2">Configure Agents <ArrowRightIcon className="size-4" /></Link>
          </Button>
        </div>
      </div>

      <NewMeetingDialog
        open={isNewMeetingOpen}
        onOpenChange={setIsNewMeetingOpen}
      />
    </div>
  );
};

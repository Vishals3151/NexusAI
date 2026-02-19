"use client";

import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

import {  useSuspenseQuery } from "@tanstack/react-query";

export const AgentsView = () => {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions(),
  );

  return <div>{JSON.stringify(data, null, 2)}</div>;
};

export const AgentViewLoading = () => {
  return <LoadingState title="Loading Agents" description="This may take a few seconds" />;
}

export const AgentViewError = () => {
      return (
          <ErrorState title="An error occurred" description="Unable to load agents. Please try again later." />
      );
}

import {
  AgentsView,
  AgentViewError,
  AgentViewLoading,
} from "@/modules/agents/ui/views/agent-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

const Page = async () => {
  const querCLient = getQueryClient();
  void querCLient.prefetchQuery(trpc.agents.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(querCLient)}>
      {" "}
      <Suspense fallback={<AgentViewLoading />}>
        <ErrorBoundary fallback={<AgentViewError />}>
          <AgentsView />{" "}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;

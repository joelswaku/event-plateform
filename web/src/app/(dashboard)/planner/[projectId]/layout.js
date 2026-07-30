"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import SubscriptionGuard from "@/components/guards/SubscriptionGuard";
import PlannerShell from "@/components/planner/PlannerShell";
import PlannerAICopilot from "@/components/planner/PlannerAICopilot";

function PlannerProjectContent({ children }) {
  const { projectId } = useParams();
  const { currentProject, fetchProject } = usePlannerStore();

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  useEffect(() => {
    if (currentProject?.title) {
      document.title = `${currentProject.title} — Planner`;
    }
  }, [currentProject?.title]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <PlannerShell>{children}</PlannerShell>
      <PlannerAICopilot />
    </div>
  );
}

export default function PlannerProjectLayout({ children }) {
  return (
    <SubscriptionGuard feature="planner" showUpgrade>
      <PlannerProjectContent>{children}</PlannerProjectContent>
    </SubscriptionGuard>
  );
}

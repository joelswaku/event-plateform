"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import PlannerShell from "@/components/planner/PlannerShell";
import PlannerAICopilot from "@/components/planner/PlannerAICopilot";

export default function PlannerProjectLayout({ children }) {
  const { projectId } = useParams();
  const { currentProject, fetchProject } = usePlannerStore();

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId]);

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

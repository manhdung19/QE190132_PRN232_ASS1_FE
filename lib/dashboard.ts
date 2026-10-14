import { apiClient } from "./api-client";

export interface DashboardCounts {
  departments: number;
  projects: number;
  tasks: number;
  tags: number;
}

export async function loadDashboardCounts(): Promise<DashboardCounts> {
  const [departments, projects, tasks, tags] = await Promise.all([
    apiClient.departments.getAll(),
    apiClient.projects.getAll(),
    apiClient.tasks.getAll(),
    apiClient.tags.getAll(),
  ]);
  return {
    departments: departments.length,
    projects: projects.length,
    tasks: tasks.length,
    tags: tags.length,
  };
}

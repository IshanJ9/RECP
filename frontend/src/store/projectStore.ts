import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  founderName: string;
  founder?: string;
  budget: string;
  duration: string;
  proposalLimit: string;
  investmentLimit: string;
  description: string;
  category: string;
  address: string;
  isActive?: boolean;
}

interface ProjectState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  getProjectById: (id) => get().projects.find(p => p.id === id),
}));

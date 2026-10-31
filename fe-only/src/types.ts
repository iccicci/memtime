export interface Page {
  limit: number;
  offset: number;
}

export interface Client {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  clientId: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  parent: number;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: number;
  taskId: number;
  userId: string;
  comment: string;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryInput {
  taskId: number;
  comment: string;
  start: string;
  end: string;
}

export interface ApiError {
  error: string;
}

export type TreeLevel =
  | { level: "client" }
  | { level: "project"; clientId: number }
  | { level: "task"; projectId: number };

export function isLevel(value: TreeLevel, type: "client"): value is { level: "client" };
export function isLevel(value: TreeLevel, type: "project"): value is { level: "project"; clientId: number };
export function isLevel(value: TreeLevel, type: "task"): value is { level: "task"; projectId: number };
export function isLevel(value: TreeLevel, type: TreeLevel["level"]): boolean {
  return value.level === type;
}

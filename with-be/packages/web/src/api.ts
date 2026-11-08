import { logger } from "memtime-shared";

import type { ApiError, Client, Page, Project, Task, TimeEntry, TimeEntryInput } from "./types";

interface ApiOptions {
  body?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface ApiFetchResult<T = unknown> {
  body: T;
  code: number;
  rawBody: string;
  status: string;
}

export class Api {
  private readonly baseUrl = "/api/v1";

  private setServerBusy: (serverBusy: boolean) => void;

  constructor(setServerBusy: (serverBusy: boolean) => void) {
    this.setServerBusy = setServerBusy;
  }

  private pageQuery(page: Page): string {
    return `limit=${page.limit}&offset=${page.offset}`;
  }

  private async fetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<ApiFetchResult<T>> {
    const { body, method } = { body: undefined, method: "GET" as const, ...options };

    const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
      body,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      method
    });

    const httpRawBody = await response.text();
    const busy = response.status === 429;
    let parsed: T = null as T;

    this.setServerBusy(busy);

    if(! busy && httpRawBody !== "") {
      try {
        parsed = JSON.parse(httpRawBody) as T;
      } catch(error) {
        logger.error(error);
      }
    }

    return {
      body:    parsed,
      code:    response.status,
      rawBody: httpRawBody,
      status:  `${response.status} ${response.statusText}`
    };
  }

  public getClients(page: Page): Promise<ApiFetchResult<Client[] | ApiError>> {
    return this.fetch(`/clients?${this.pageQuery(page)}`);
  }

  public getClient(id: number): Promise<ApiFetchResult<Client | ApiError>> {
    return this.fetch(`/clients/${id}`);
  }

  public getClientProjects(clientId: number, page: Page): Promise<ApiFetchResult<Project[] | ApiError>> {
    return this.fetch(`/clients/${clientId}/projects?${this.pageQuery(page)}`);
  }

  public getProject(id: number): Promise<ApiFetchResult<Project | ApiError>> {
    return this.fetch(`/projects/${id}`);
  }

  public getProjectTasks(projectId: number, page: Page): Promise<ApiFetchResult<Task[] | ApiError>> {
    return this.fetch(`/projects/${projectId}/tasks?${this.pageQuery(page)}`);
  }

  public getTask(id: number): Promise<ApiFetchResult<Task | ApiError>> {
    return this.fetch(`/tasks/${id}`);
  }

  public getTimeEntries(page: Page): Promise<ApiFetchResult<TimeEntry[] | ApiError>> {
    return this.fetch(`/time-entries?${this.pageQuery(page)}`);
  }

  public getTimeEntry(id: number): Promise<ApiFetchResult<TimeEntry | ApiError>> {
    return this.fetch(`/time-entries/${id}`);
  }

  public createTimeEntry(input: TimeEntryInput): Promise<ApiFetchResult<TimeEntry | ApiError>> {
    return this.fetch("/time-entries", { body: JSON.stringify(input), method: "POST" });
  }

  public updateTimeEntry(id: number, input: TimeEntryInput): Promise<ApiFetchResult<TimeEntry | ApiError>> {
    return this.fetch(`/time-entries/${id}`, { body: JSON.stringify(input), method: "PUT" });
  }
}

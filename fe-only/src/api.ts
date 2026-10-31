import type { ApiError, Client, Page, Project, Task, TimeEntry, TimeEntryInput } from "./types";

interface ApiOptions {
  apiKey?: string;
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
  private static readonly storageKey = "memtime.apiKey";
  private static readonly rateLimit = 15;
  private static readonly rateWindowMs = 60_000;

  private readonly baseUrl = "https://interview-api.memtime-demo.deno.net/api/v1";
  private readonly requestTimestamps: number[] = [];

  private apiKey = sessionStorage.getItem(Api.storageKey) ?? "";
  private setServerBusy: (serverBusy: boolean) => void;

  constructor(setServerBusy: (serverBusy: boolean) => void) {
    this.setServerBusy = setServerBusy;
  }

  private pageQuery(page: Page): string {
    return `limit=${page.limit}&offset=${page.offset}`;
  }

  private pruneRequestTimestamps(now: number): void {
    const cutoff = now - Api.rateWindowMs;

    while(this.requestTimestamps.length > 0 && this.requestTimestamps[0] <= cutoff) this.requestTimestamps.shift();
  }

  private async fetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<ApiFetchResult<T>> {
    const now = Date.now();

    this.pruneRequestTimestamps(now);

    if(this.requestTimestamps.length >= Api.rateLimit) {
      this.setServerBusy(true);

      return {
        body:    null as T,
        code:    429,
        rawBody: "Too many requests, please try again later.",
        status:  "429 "
      };
    }

    this.requestTimestamps.push(now);

    const { apiKey, body, method } = { apiKey: this.apiKey, body: undefined, method: "GET" as const, ...options };

    const response = await globalThis.fetch(`${this.baseUrl}${path}`, {
      body,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {})
      },
      method
    });

    const httpRawBody = await response.text();
    let parsed: T;
    try {
      parsed = (httpRawBody === "" ? null : JSON.parse(httpRawBody)) as T;
    } catch{
      parsed = null as T;
    }

    this.setServerBusy(response.status === 429);

    return {
      body:    parsed,
      code:    response.status,
      rawBody: httpRawBody,
      status:  `${response.status} ${response.statusText}`
    };
  }

  public async login(apiKey: string): Promise<boolean> {
    const result = await this.fetch("/clients?limit=1", { apiKey });

    if(result.code !== 200) return false;

    this.apiKey = apiKey;
    sessionStorage.setItem(Api.storageKey, apiKey);

    return true;
  }

  public logout(): void {
    this.apiKey = "";
    sessionStorage.removeItem(Api.storageKey);
  }

  public isLoggedIn(): boolean {
    return this.apiKey !== "";
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

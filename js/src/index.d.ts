export const VERSION: string;
export const DEFAULT_BASE_URL: string;

export interface ClientOptions {
  /** Defaults to https://hangingcontext.com */
  baseUrl?: string;
  /** Custom fetch, for tests or proxies. */
  fetch?: typeof fetch;
}

export interface AskOptions extends ClientOptions {
  /** Only search this topic slug. */
  topic?: string;
  /** Look back this many days (1 to 30). */
  days?: number;
  /** Maximum results (1 to 20). */
  limit?: number;
}

export interface StorySummary {
  slug: string;
  url: string;
  json: string;
  markdown: string;
  headline: string;
  dek: string;
  published_at: string;
  trust: string;
  source_count: number;
  cited_manifest_ids: string[];
  [key: string]: unknown;
}

export interface Topic {
  id: string;
  title: string;
  url: string;
  json: string;
  description: string;
  beats?: { id: string; title: string }[];
  [key: string]: unknown;
}

export interface AskAnswer {
  query: string;
  no_match: boolean;
  results: {
    url: string;
    name: string;
    datePublished: string;
    description: string;
    manifest_ids: string[];
    [key: string]: unknown;
  }[];
  stories?: StorySummary[];
  [key: string]: unknown;
}

export interface Latest {
  edition: string;
  generated_at: string;
  stories: StorySummary[];
  newsrooms?: Topic[];
  [key: string]: unknown;
}

export interface TopicStories {
  id: string;
  title: string;
  story_count: number;
  stories: StorySummary[];
  [key: string]: unknown;
}

export interface Story extends StorySummary {
  key_facts?: unknown[];
  [key: string]: unknown;
}

export class HangingContextError extends Error {
  /** HTTP status, or 0 for a network failure or bad input. */
  status: number;
  /** Short error code from the JSON error body, such as "empty_question". */
  code: string;
  nextStep: string;
  /** Seconds to wait before retrying, for HTTP 429. */
  retryAfter?: number;
  /** The parsed JSON error body, or the raw text if it was not JSON. */
  body: unknown;
}

export function ask(question: string, opts?: AskOptions): Promise<AskAnswer>;
export function latest(opts?: ClientOptions & { topic?: undefined }): Promise<Latest>;
export function latest(opts: ClientOptions & { topic: string }): Promise<TopicStories>;
export function story(date: string, slug: string, opts?: ClientOptions & { format?: "json" }): Promise<Story>;
export function story(date: string, slug: string, opts: ClientOptions & { format: "md" }): Promise<string>;
export function topics(opts?: ClientOptions): Promise<Topic[]>;

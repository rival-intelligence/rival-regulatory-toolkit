import {
  getRecentFixtureFilings,
  listFixtureAuthorities,
  retrieveFixtureSource,
  searchFixtureSources,
  traceFixtureCitation,
} from './fixture-search.js';
import type {
  AuthoritiesResponse,
  GetRecentFilingsInput,
  ListAuthoritiesInput,
  RecentFilingsResponse,
  RivalRegulatoryClientOptions,
  SearchRegulatoryCorpusInput,
  SearchResponse,
  SourceTextResponse,
  TraceCitationInput,
  CitationTraceResponse,
  ApiErrorBody,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.tryrival.ai';

export class RivalApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'RivalApiError';
    this.status = status;
    this.body = body;
  }
}

export class RivalRegulatoryClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fixtures?: RivalRegulatoryClientOptions['fixtures'];

  constructor(options: RivalRegulatoryClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.RIVAL_API_KEY;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.RIVAL_API_BASE_URL ?? DEFAULT_BASE_URL);
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.fixtures = options.fixtures;

    if (!this.fetchImpl && !this.fixtures) {
      throw new Error('No fetch implementation available. Use Node 20+ or pass a fetch implementation.');
    }
  }

  async searchRegulatoryCorpus(input: SearchRegulatoryCorpusInput): Promise<SearchResponse> {
    if (this.fixtures) {
      return searchFixtureSources(this.fixtures, input);
    }

    const url = this.url('/api/v1/search');
    setOptionalParam(url, 'q', input.query);
    setOptionalParam(url, 'authority', input.authority);
    setOptionalParam(url, 'jurisdiction', input.jurisdiction);
    setOptionalParam(url, 'source_type', input.sourceType);
    setOptionalParam(url, 'limit', input.limit?.toString());
    setOptionalParam(url, 'cursor', input.cursor);
    return this.request<SearchResponse>(url);
  }

  async retrieveSourceText(input: { sourceId: string }): Promise<SourceTextResponse> {
    if (this.fixtures) {
      return retrieveFixtureSource(this.fixtures, input.sourceId);
    }

    return this.request<SourceTextResponse>(this.url(`/api/v1/sources/${encodeURIComponent(input.sourceId)}`));
  }

  async traceCitation(input: TraceCitationInput): Promise<CitationTraceResponse> {
    if (this.fixtures) {
      return traceFixtureCitation(this.fixtures, input);
    }

    const url = this.url('/api/v1/citations/trace');
    setOptionalParam(url, 'citation', input.citation);
    setOptionalParam(url, 'jurisdiction', input.jurisdiction);
    return this.request<CitationTraceResponse>(url);
  }

  async listAuthorities(input: ListAuthoritiesInput = {}): Promise<AuthoritiesResponse> {
    if (this.fixtures) {
      return listFixtureAuthorities(this.fixtures, input);
    }

    const url = this.url('/api/v1/authorities');
    setOptionalParam(url, 'jurisdiction', input.jurisdiction);
    setOptionalParam(url, 'domain', input.domain);
    return this.request<AuthoritiesResponse>(url);
  }

  async getRecentFilings(input: GetRecentFilingsInput = {}): Promise<RecentFilingsResponse> {
    if (this.fixtures) {
      return getRecentFixtureFilings(this.fixtures, input);
    }

    const url = this.url('/api/v1/filings/recent');
    setOptionalParam(url, 'authority', input.authority);
    setOptionalParam(url, 'jurisdiction', input.jurisdiction);
    setOptionalParam(url, 'source_type', input.sourceType);
    setOptionalParam(url, 'date_from', input.dateFrom);
    setOptionalParam(url, 'date_to', input.dateTo);
    setOptionalParam(url, 'limit', input.limit?.toString());
    return this.request<RecentFilingsResponse>(url);
  }

  private url(path: string): URL {
    return new URL(path, `${this.baseUrl}/`);
  }

  private async request<T>(url: URL): Promise<T> {
    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    if (this.apiKey) {
      headers.authorization = `Bearer ${this.apiKey}`;
    }

    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let body: ApiErrorBody | undefined;
      try {
        body = (await response.json()) as ApiErrorBody;
      } catch {
        body = undefined;
      }
      throw new RivalApiError(response.status, body?.message ?? body?.error ?? response.statusText, body);
    }

    return (await response.json()) as T;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function setOptionalParam(url: URL, key: string, value: string | undefined): void {
  if (value !== undefined && value !== '') {
    url.searchParams.set(key, value);
  }
}

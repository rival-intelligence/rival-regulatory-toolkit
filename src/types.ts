export type SourceType =
  | 'fr'
  | 'cfr'
  | 'tac'
  | 'sibr'
  | 'government_source'
  | 'source_document'
  | 'dod_contracting';

export type MatchType = 'exact_citation' | 'keyword' | 'semantic' | 'hybrid';

export interface RegulatoryAuthority {
  slug: string;
  name: string;
  jurisdiction: string;
  issuingAuthority?: string;
  sourceFamilies: string[];
  domains: string[];
  latestDate?: string | null;
  sourceCount?: number;
  metadata?: Record<string, unknown>;
}

export interface RegulatorySource {
  id: string;
  citation: string;
  title: string;
  sourceType: SourceType | string;
  url: string;
  jurisdiction: string;
  authority: string;
  authoritySlug?: string;
  regulatoryDomain?: string;
  sourceFamily?: string;
  publicationDate?: string | null;
  effectiveDate?: string | null;
  versionLabel?: string | null;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchExcerpt {
  chunkId?: string;
  sourceId: string;
  citation: string;
  text: string;
  score?: number;
}

export interface SearchResult {
  source: RegulatorySource;
  excerpts: SearchExcerpt[];
  score: number;
  matchType: MatchType;
}

export interface SearchRegulatoryCorpusInput {
  query: string;
  authority?: string;
  jurisdiction?: string;
  sourceType?: string;
  limit?: number;
  cursor?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  generatedAt: string;
  nextCursor?: string | null;
}

export interface RetrieveSourceTextInput {
  sourceId: string;
}

export interface SourceTextResponse {
  source: RegulatorySource;
  content: string;
  generatedAt: string;
}

export interface TraceCitationInput {
  citation: string;
  jurisdiction?: string;
}

export interface CitationTraceStep {
  label: string;
  sourceId?: string;
  citation?: string;
  status: 'matched' | 'related' | 'not_found';
  detail?: string;
}

export interface CitationTraceResponse {
  citation: string;
  normalizedCitation: string;
  matches: RegulatorySource[];
  relatedSources: RegulatorySource[];
  trace: CitationTraceStep[];
  generatedAt: string;
}

export interface ListAuthoritiesInput {
  jurisdiction?: string;
  domain?: string;
}

export interface AuthoritiesResponse {
  authorities: RegulatoryAuthority[];
  generatedAt: string;
}

export interface GetRecentFilingsInput {
  authority?: string;
  jurisdiction?: string;
  sourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface RecentFiling {
  source: RegulatorySource;
  summary?: string;
}

export interface RecentFilingsResponse {
  filings: RecentFiling[];
  generatedAt: string;
}

export interface RivalRegulatoryClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  fixtures?: RegulatorySource[];
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

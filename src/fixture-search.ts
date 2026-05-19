import type {
  AuthoritiesResponse,
  CitationTraceResponse,
  GetRecentFilingsInput,
  ListAuthoritiesInput,
  RecentFilingsResponse,
  RegulatoryAuthority,
  RegulatorySource,
  SearchRegulatoryCorpusInput,
  SearchResponse,
  SearchResult,
  SourceTextResponse,
  TraceCitationInput,
} from './types.js';

const TOKEN_RE = /[a-z0-9.]+/gi;

function now(): string {
  return new Date().toISOString();
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/§/g, '').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalize(value).match(TOKEN_RE) ?? [];
}

function sourceText(source: RegulatorySource): string {
  return [
    source.citation,
    source.title,
    source.authority,
    source.jurisdiction,
    source.regulatoryDomain,
    source.sourceFamily,
    source.content,
  ]
    .filter(Boolean)
    .join('\n');
}

function excerptFor(source: RegulatorySource, query: string): string {
  const content = source.content ?? `${source.citation} - ${source.title}`;
  const normalizedContent = normalize(content);
  const terms = tokenize(query).filter((term) => term.length > 2);
  const firstHit = terms
    .map((term) => normalizedContent.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, (firstHit ?? 0) - 160);
  return content.slice(start, start + 520).trim();
}

function scoreSource(source: RegulatorySource, query: string): { score: number; exact: boolean } {
  const normalizedQuery = normalize(query);
  const normalizedCitation = normalize(source.citation);
  const exact = normalizedCitation === normalizedQuery || normalizedCitation.includes(normalizedQuery);
  const text = normalize(sourceText(source));
  const terms = tokenize(query).filter((term) => term.length > 2);
  const hits = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  const base = exact ? 10 : 0;
  const score = base + hits / Math.max(terms.length, 1);
  return { score, exact };
}

function filterSources(sources: RegulatorySource[], input: SearchRegulatoryCorpusInput): RegulatorySource[] {
  return sources.filter((source) => {
    if (input.authority && source.authoritySlug !== input.authority && source.authority !== input.authority) {
      return false;
    }
    if (input.jurisdiction && source.jurisdiction !== input.jurisdiction) {
      return false;
    }
    if (input.sourceType && source.sourceType !== input.sourceType) {
      return false;
    }
    return true;
  });
}

export function searchFixtureSources(
  sources: RegulatorySource[],
  input: SearchRegulatoryCorpusInput,
): SearchResponse {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const scored = filterSources(sources, input)
    .map((source) => ({ source, ...scoreSource(source, input.query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const results: SearchResult[] = scored.map((item) => ({
    source: item.source,
    excerpts: [
      {
        sourceId: item.source.id,
        citation: item.source.citation,
        text: excerptFor(item.source, input.query),
        score: item.score,
      },
    ],
    score: item.score,
    matchType: item.exact ? 'exact_citation' : 'keyword',
  }));

  return {
    query: input.query,
    results,
    generatedAt: now(),
    nextCursor: null,
  };
}

export function retrieveFixtureSource(sources: RegulatorySource[], sourceId: string): SourceTextResponse {
  const source = sources.find((item) => item.id === sourceId || normalize(item.citation) === normalize(sourceId));
  if (!source) {
    throw new Error(`Source not found in fixture corpus: ${sourceId}`);
  }

  return {
    source,
    content: source.content ?? '',
    generatedAt: now(),
  };
}

export function traceFixtureCitation(
  sources: RegulatorySource[],
  input: TraceCitationInput,
): CitationTraceResponse {
  const normalizedCitation = normalize(input.citation);
  const matches = sources.filter((source) => normalize(source.citation) === normalizedCitation);
  const relatedSources = matches.length > 0
    ? []
    : sources
        .map((source) => ({ source, ...scoreSource(source, input.citation) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => item.source);

  return {
    citation: input.citation,
    normalizedCitation,
    matches,
    relatedSources,
    trace: [
      {
        label: 'Normalize citation',
        citation: input.citation,
        status: 'matched',
        detail: normalizedCitation,
      },
      {
        label: matches.length > 0 ? 'Direct source match' : 'Direct source match',
        sourceId: matches[0]?.id,
        citation: matches[0]?.citation,
        status: matches.length > 0 ? 'matched' : 'not_found',
      },
    ],
    generatedAt: now(),
  };
}

export function listFixtureAuthorities(
  sources: RegulatorySource[],
  input: ListAuthoritiesInput = {},
): AuthoritiesResponse {
  const grouped = new Map<string, RegulatoryAuthority>();

  for (const source of sources) {
    if (input.jurisdiction && source.jurisdiction !== input.jurisdiction) {
      continue;
    }
    if (input.domain && source.regulatoryDomain !== input.domain) {
      continue;
    }

    const slug = source.authoritySlug ?? source.authority.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = grouped.get(slug);
    if (existing) {
      existing.sourceCount = (existing.sourceCount ?? 0) + 1;
      if (source.sourceFamily && !existing.sourceFamilies.includes(source.sourceFamily)) {
        existing.sourceFamilies.push(source.sourceFamily);
      }
      if (source.regulatoryDomain && !existing.domains.includes(source.regulatoryDomain)) {
        existing.domains.push(source.regulatoryDomain);
      }
      existing.latestDate = maxDate(existing.latestDate, source.publicationDate ?? source.effectiveDate ?? null);
      continue;
    }

    grouped.set(slug, {
      slug,
      name: source.authority,
      jurisdiction: source.jurisdiction,
      issuingAuthority: source.authority,
      sourceFamilies: source.sourceFamily ? [source.sourceFamily] : [],
      domains: source.regulatoryDomain ? [source.regulatoryDomain] : [],
      latestDate: source.publicationDate ?? source.effectiveDate ?? null,
      sourceCount: 1,
    });
  }

  return {
    authorities: [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)),
    generatedAt: now(),
  };
}

function maxDate(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

export function getRecentFixtureFilings(
  sources: RegulatorySource[],
  input: GetRecentFilingsInput = {},
): RecentFilingsResponse {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const filings = sources
    .filter((source) => source.sourceType === 'fr' || source.sourceFamily === 'federal_register')
    .filter((source) => {
      if (input.authority && source.authoritySlug !== input.authority && source.authority !== input.authority) {
        return false;
      }
      if (input.jurisdiction && source.jurisdiction !== input.jurisdiction) {
        return false;
      }
      if (input.sourceType && source.sourceType !== input.sourceType) {
        return false;
      }
      const date = source.publicationDate ?? source.effectiveDate;
      if (input.dateFrom && date && date < input.dateFrom) {
        return false;
      }
      if (input.dateTo && date && date > input.dateTo) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (b.publicationDate ?? '').localeCompare(a.publicationDate ?? ''))
    .slice(0, limit)
    .map((source) => ({
      source,
      summary: source.metadata?.summary as string | undefined,
    }));

  return {
    filings,
    generatedAt: now(),
  };
}

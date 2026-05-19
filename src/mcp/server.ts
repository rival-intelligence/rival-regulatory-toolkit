#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output, stderr } from 'node:process';
import { createClientFromRuntime } from '../runtime.js';
import type {
  GetRecentFilingsInput,
  ListAuthoritiesInput,
  SearchRegulatoryCorpusInput,
  TraceCitationInput,
} from '../types.js';

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

const client = createClientFromRuntime();

const tools = [
  {
    name: 'search_regulatory_corpus',
    description: 'Search Rival regulatory source material and return source-grounded excerpts.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Natural language query or citation.' },
        authority: { type: 'string', description: 'Optional authority slug, such as phmsa or epa.' },
        jurisdiction: { type: 'string', description: 'Optional jurisdiction filter, such as federal or texas.' },
        sourceType: { type: 'string', description: 'Optional source type filter, such as cfr, fr, tac, or sibr.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
      },
    },
  },
  {
    name: 'retrieve_source_text',
    description: 'Retrieve full text and metadata for a known Rival source id or citation.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['sourceId'],
      properties: {
        sourceId: { type: 'string', description: 'Rival source id or exact citation.' },
      },
    },
  },
  {
    name: 'trace_citation',
    description: 'Trace a citation to matching and related regulatory source records.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['citation'],
      properties: {
        citation: { type: 'string', description: 'Citation to trace, such as 49 CFR 195.573.' },
        jurisdiction: { type: 'string', description: 'Optional jurisdiction filter.' },
      },
    },
  },
  {
    name: 'list_authorities',
    description: 'List regulatory authorities available to the corpus.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        jurisdiction: { type: 'string' },
        domain: { type: 'string' },
      },
    },
  },
  {
    name: 'get_recent_filings',
    description: 'Return recent filings from indexed source material.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        authority: { type: 'string' },
        jurisdiction: { type: 'string' },
        sourceType: { type: 'string' },
        dateFrom: { type: 'string', format: 'date' },
        dateTo: { type: 'string', format: 'date' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  switch (name) {
    case 'search_regulatory_corpus':
      return client.searchRegulatoryCorpus({
        ...(args as unknown as SearchRegulatoryCorpusInput),
        query: stringArg(args, 'query'),
      });
    case 'retrieve_source_text': {
      const sourceId = stringArg(args, 'sourceId');
      return client.retrieveSourceText({ sourceId });
    }
    case 'trace_citation':
      return client.traceCitation({
        ...(args as unknown as TraceCitationInput),
        citation: stringArg(args, 'citation'),
      });
    case 'list_authorities':
      return client.listAuthorities(args as unknown as ListAuthoritiesInput);
    case 'get_recent_filings':
      return client.getRecentFilings(args as unknown as GetRecentFilingsInput);
    default:
      throw new McpError(-32601, `Unknown tool: ${name}`);
  }
}

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new McpError(-32602, `Missing required string argument: ${key}`);
  }
  return value;
}

class McpError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.data = data;
  }
}

async function handleRequest(message: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
  if (message.id === undefined) {
    return undefined;
  }

  try {
    switch (message.method) {
      case 'initialize':
        return result(message.id, {
          protocolVersion: requestedProtocolVersion(message),
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'rival-regulatory-toolkit',
            version: '0.1.0',
          },
        });
      case 'ping':
        return result(message.id, {});
      case 'tools/list':
        return result(message.id, { tools });
      case 'tools/call': {
        const params = message.params ?? {};
        const name = stringArg(params, 'name');
        const args = objectArg(params, 'arguments');
        const toolResult = await callTool(name, args);
        return result(message.id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult),
            },
          ],
        });
      }
      default:
        throw new McpError(-32601, `Method not found: ${message.method ?? '<missing>'}`);
    }
  } catch (error) {
    return failure(message.id, error);
  }
}

function requestedProtocolVersion(message: JsonRpcRequest): string {
  const version = message.params?.protocolVersion;
  return typeof version === 'string' ? version : '2025-06-18';
}

function objectArg(args: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = args[key];
  if (value === undefined) {
    return {};
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new McpError(-32602, `Expected object argument: ${key}`);
  }
  return value as Record<string, unknown>;
}

function result(id: JsonRpcId, value: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: value,
  };
}

function failure(id: JsonRpcId, error: unknown): JsonRpcResponse {
  if (error instanceof McpError) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32603,
      message,
    },
  };
}

function send(response: JsonRpcResponse): void {
  output.write(`${JSON.stringify(response)}\n`);
}

async function serve(): Promise<void> {
  const rl = createInterface({ input });
  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as JsonRpcRequest | JsonRpcRequest[];
      const messages = Array.isArray(parsed) ? parsed : [parsed];
      const responses = await Promise.all(messages.map((message) => handleRequest(message)));
      const filtered = responses.filter((response): response is JsonRpcResponse => response !== undefined);
      if (Array.isArray(parsed)) {
        if (filtered.length > 0) {
          output.write(`${JSON.stringify(filtered)}\n`);
        }
      } else if (filtered[0]) {
        send(filtered[0]);
      }
    } catch (error) {
      stderr.write(`rival-regulatory-mcp: failed to process message: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
}

serve().catch((error: unknown) => {
  stderr.write(`rival-regulatory-mcp: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

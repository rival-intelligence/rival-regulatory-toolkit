#!/usr/bin/env node
import { createClientFromRuntime } from '../runtime.js';

interface ParsedArgs {
  command?: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  if (!parsed.command || parsed.flags.help || parsed.flags.h) {
    printHelp();
    return;
  }

  if (parsed.command === 'mcp') {
    await import('../mcp/server.js');
    return;
  }

  const client = createClientFromRuntime({
    fixture: Boolean(parsed.flags.fixture),
    fixturePath: stringFlag(parsed, 'fixture-path'),
    apiKey: stringFlag(parsed, 'api-key'),
    baseUrl: stringFlag(parsed, 'base-url'),
  });

  switch (parsed.command) {
    case 'search': {
      const query = requiredPositional(parsed, 0, 'query');
      const response = await client.searchRegulatoryCorpus({
        query,
        authority: stringFlag(parsed, 'authority'),
        jurisdiction: stringFlag(parsed, 'jurisdiction'),
        sourceType: stringFlag(parsed, 'source-type'),
        limit: numberFlag(parsed, 'limit'),
      });
      printJson(response);
      break;
    }
    case 'source': {
      const sourceId = requiredPositional(parsed, 0, 'source_id');
      printJson(await client.retrieveSourceText({ sourceId }));
      break;
    }
    case 'trace': {
      const citation = requiredPositional(parsed, 0, 'citation');
      printJson(await client.traceCitation({ citation, jurisdiction: stringFlag(parsed, 'jurisdiction') }));
      break;
    }
    case 'authorities': {
      printJson(await client.listAuthorities({
        jurisdiction: stringFlag(parsed, 'jurisdiction'),
        domain: stringFlag(parsed, 'domain'),
      }));
      break;
    }
    case 'recent': {
      printJson(await client.getRecentFilings({
        authority: stringFlag(parsed, 'authority'),
        jurisdiction: stringFlag(parsed, 'jurisdiction'),
        sourceType: stringFlag(parsed, 'source-type'),
        dateFrom: stringFlag(parsed, 'date-from'),
        dateTo: stringFlag(parsed, 'date-to'),
        limit: numberFlag(parsed, 'limit'),
      }));
      break;
    }
    default:
      throw new Error(`Unknown command: ${parsed.command}`);
  }
}

function parseArgs(args: string[]): ParsedArgs {
  const [command, ...rest] = args;
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg.startsWith('--')) {
      const [key, inlineValue] = arg.slice(2).split('=', 2);
      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
      } else if (rest[i + 1] && !rest[i + 1].startsWith('-')) {
        flags[key] = rest[i + 1];
        i += 1;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true;
    } else {
      positionals.push(arg);
    }
  }

  return { command, positionals, flags };
}

function requiredPositional(parsed: ParsedArgs, index: number, name: string): string {
  const value = parsed.positionals[index];
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function stringFlag(parsed: ParsedArgs, key: string): string | undefined {
  const value = parsed.flags[key];
  return typeof value === 'string' ? value : undefined;
}

function numberFlag(parsed: ParsedArgs, key: string): number | undefined {
  const value = stringFlag(parsed, key);
  if (!value) {
    return undefined;
  }
  const parsedNumber = Number(value);
  if (!Number.isFinite(parsedNumber)) {
    throw new Error(`Invalid numeric flag --${key}: ${value}`);
  }
  return parsedNumber;
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp(): void {
  process.stdout.write(`Rival Regulatory Toolkit

Usage:
  rival-regulatory search <query> [--limit 5] [--fixture]
  rival-regulatory source <source_id> [--fixture]
  rival-regulatory trace <citation> [--fixture]
  rival-regulatory authorities [--fixture]
  rival-regulatory recent [--authority phmsa] [--limit 10]
  rival-regulatory mcp

Global flags:
  --api-key <key>          Rival API key. Defaults to RIVAL_API_KEY.
  --base-url <url>         Rival API base URL. Defaults to RIVAL_API_BASE_URL or https://api.tryrival.ai.
  --fixture                Use fixtures/sample-corpus.jsonl instead of the API.
  --fixture-path <path>    Override fixture corpus path.
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`rival-regulatory: ${message}\n`);
  process.exitCode = 1;
});

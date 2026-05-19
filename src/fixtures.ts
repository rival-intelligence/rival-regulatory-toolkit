import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RegulatorySource } from './types.js';

export function defaultFixturePath(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/sample-corpus.jsonl');
}

export function loadFixtureSources(path = process.env.RIVAL_FIXTURE_PATH ?? defaultFixturePath()): RegulatorySource[] {
  const raw = readFileSync(path, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RegulatorySource);
}

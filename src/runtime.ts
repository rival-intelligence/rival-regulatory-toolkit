import { RivalRegulatoryClient } from './client.js';
import { loadFixtureSources } from './fixtures.js';

export interface RuntimeOptions {
  apiKey?: string;
  baseUrl?: string;
  fixture?: boolean;
  fixturePath?: string;
}

export function createClientFromRuntime(options: RuntimeOptions = {}): RivalRegulatoryClient {
  const fixture =
    options.fixture ||
    process.env.RIVAL_FIXTURE_MODE === 'true' ||
    process.env.RIVAL_FIXTURE_MODE === '1';

  return new RivalRegulatoryClient({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    fixtures: fixture ? loadFixtureSources(options.fixturePath) : undefined,
  });
}

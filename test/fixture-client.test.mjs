import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RivalRegulatoryClient, loadFixtureSources } from '../dist/index.js';

const fixtures = loadFixtureSources('fixtures/sample-corpus.jsonl');

test('fixture search returns exact citation matches', async () => {
  const client = new RivalRegulatoryClient({ fixtures });
  const response = await client.searchRegulatoryCorpus({
    query: '49 CFR 195.573',
    limit: 3,
  });

  assert.equal(response.results[0].source.id, 'cfr-49-195-573');
  assert.equal(response.results[0].matchType, 'exact_citation');
});

test('fixture citation trace resolves citations', async () => {
  const client = new RivalRegulatoryClient({ fixtures });
  const response = await client.traceCitation({ citation: '16 TAC § 3.8' });

  assert.equal(response.matches[0].id, 'tac-16-3-8');
});

test('fixture authorities group sources', async () => {
  const client = new RivalRegulatoryClient({ fixtures });
  const response = await client.listAuthorities();

  assert.ok(response.authorities.some((authority) => authority.slug === 'phmsa'));
});

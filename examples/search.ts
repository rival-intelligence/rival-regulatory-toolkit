import { RivalRegulatoryClient } from '@rival-intelligence/regulatory-toolkit';

const client = new RivalRegulatoryClient({
  apiKey: process.env.RIVAL_API_KEY,
});

const response = await client.searchRegulatoryCorpus({
  query: '49 CFR 195.573 corrosion control',
  authority: 'phmsa',
  limit: 3,
});

console.log(JSON.stringify(response, null, 2));

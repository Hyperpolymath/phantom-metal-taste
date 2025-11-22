import { beforeAll, afterAll } from 'bun:test';
import { ArangoConnection } from '../src/orchestrator/db/arango.js';
import { VirtuosoConnection } from '../src/orchestrator/db/virtuoso.js';

export const testConfig = {
  arango: {
    url: process.env.TEST_ARANGO_URL || 'http://localhost:8529',
    database: 'phantom_metal_taste_test',
    username: 'root',
    password: 'phantom-dev-password',
  },
  virtuoso: {
    queryUrl: 'http://localhost:8890/sparql',
    updateUrl: 'http://localhost:8890/sparql-auth',
    username: 'dba',
    password: 'phantom-dev-password',
    defaultGraph: 'http://phantom-metal-taste.org/test-graph',
  },
};

let arangoConnection: ArangoConnection;
let virtuosoConnection: VirtuosoConnection;

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  arangoConnection = new ArangoConnection(testConfig.arango);
  virtuosoConnection = new VirtuosoConnection(testConfig.virtuoso);

  await arangoConnection.initialize();
  await virtuosoConnection.initialize();

  console.log('✓ Test environment ready\n');
});

afterAll(async () => {
  console.log('\n🧹 Cleaning up test environment...');

  // Clean up test database
  const db = arangoConnection.getDatabase();

  try {
    const collections = await db.collections();
    for (const collection of collections) {
      if (!collection.name.startsWith('_')) {
        await collection.truncate();
      }
    }
  } catch (error) {
    console.error('Error cleaning up:', error);
  }

  await arangoConnection.close();

  console.log('✓ Test cleanup complete');
});

export function getArangoConnection(): ArangoConnection {
  return arangoConnection;
}

export function getVirtuosoConnection(): VirtuosoConnection {
  return virtuosoConnection;
}

import { Database, aql } from 'arangojs';

export interface ArangoConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

export class ArangoConnection {
  private db: Database;
  private config: ArangoConfig;

  constructor(config: ArangoConfig) {
    this.config = config;
    this.db = new Database({
      url: config.url,
      auth: {
        username: config.username,
        password: config.password,
      },
    });
  }

  async initialize(): Promise<void> {
    // Create database if it doesn't exist
    const systemDb = new Database({
      url: this.config.url,
      auth: {
        username: this.config.username,
        password: this.config.password,
      },
    });

    const databases = await systemDb.listDatabases();
    if (!databases.includes(this.config.database)) {
      await systemDb.createDatabase(this.config.database);
      console.log(`✓ Created database: ${this.config.database}`);
    }

    this.db.useDatabase(this.config.database);

    // Initialize collections and graphs
    await this.initializeCollections();
    await this.initializeGraphs();
  }

  private async initializeCollections(): Promise<void> {
    const collections = [
      // Vertex collections
      { name: 'initiatives', type: 'document' },
      { name: 'outcomes', type: 'document' },
      { name: 'employees', type: 'document' },
      { name: 'metrics', type: 'document' },
      { name: 'departments', type: 'document' },
      { name: 'events', type: 'document' },

      // Edge collections
      { name: 'causes', type: 'edge' },
      { name: 'participates_in', type: 'edge' },
      { name: 'measures', type: 'edge' },
      { name: 'belongs_to', type: 'edge' },
      { name: 'influences', type: 'edge' },
    ];

    for (const { name, type } of collections) {
      const exists = await this.db.collection(name).exists();
      if (!exists) {
        if (type === 'edge') {
          await this.db.createEdgeCollection(name);
        } else {
          await this.db.createCollection(name);
        }
        console.log(`✓ Created collection: ${name}`);
      }
    }
  }

  private async initializeGraphs(): Promise<void> {
    const graphName = 'causal_graph';
    const graphExists = await this.db.graph(graphName).exists();

    if (!graphExists) {
      await this.db.createGraph(graphName, [
        {
          collection: 'causes',
          from: ['initiatives', 'events', 'metrics'],
          to: ['outcomes', 'events', 'metrics'],
        },
        {
          collection: 'participates_in',
          from: ['employees'],
          to: ['initiatives', 'events'],
        },
        {
          collection: 'measures',
          from: ['metrics'],
          to: ['employees', 'departments', 'outcomes'],
        },
        {
          collection: 'belongs_to',
          from: ['employees'],
          to: ['departments'],
        },
        {
          collection: 'influences',
          from: ['initiatives', 'metrics'],
          to: ['employees', 'departments'],
        },
      ]);
      console.log(`✓ Created graph: ${graphName}`);
    }
  }

  getDatabase(): Database {
    return this.db;
  }

  async query<T>(aqlQuery: ReturnType<typeof aql>): Promise<T[]> {
    const cursor = await this.db.query<T>(aqlQuery);
    return cursor.all();
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

export { aql };

#!/usr/bin/env bun

import { Hono } from 'hono';
import { ArangoConnection } from './orchestrator/db/arango.js';
import { VirtuosoConnection } from './orchestrator/db/virtuoso.js';
import { InitiativeService } from './orchestrator/services/initiative-service.js';
import { AnalyticsService } from './orchestrator/services/analytics-service.js';

// Configuration
const config = {
  arango: {
    url: process.env.ARANGO_URL || 'http://localhost:8529',
    database: process.env.ARANGO_DATABASE || 'phantom_metal_taste',
    username: process.env.ARANGO_USERNAME || 'root',
    password: process.env.ARANGO_PASSWORD || 'phantom-dev-password',
  },
  virtuoso: {
    queryUrl: process.env.VIRTUOSO_URL || 'http://localhost:8890/sparql',
    updateUrl: process.env.VIRTUOSO_UPDATE_URL || 'http://localhost:8890/sparql-auth',
    username: process.env.VIRTUOSO_USERNAME || 'dba',
    password: process.env.VIRTUOSO_PASSWORD || 'phantom-dev-password',
    defaultGraph: process.env.VIRTUOSO_GRAPH || 'http://phantom-metal-taste.org/graph',
  },
  port: parseInt(process.env.PORT || '3000'),
};

// Initialize connections
const arangoConnection = new ArangoConnection(config.arango);
const virtuosoConnection = new VirtuosoConnection(config.virtuoso);

// Initialize services
const initiativeService = new InitiativeService(arangoConnection, virtuosoConnection);
const analyticsService = new AnalyticsService(arangoConnection);

// Create API
const app = new Hono();

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'operational',
    message: 'Measuring the gap between intention and reality',
    databases: {
      arango: 'connected',
      virtuoso: 'connected',
    },
    irony: 'fully operational',
  });
});

// Initiative endpoints
app.post('/api/initiatives', async (c) => {
  try {
    const body = await c.req.json();
    const initiative = await initiativeService.createInitiative(body);
    return c.json(initiative, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

app.post('/api/initiatives/:id/outcomes', async (c) => {
  try {
    const initiativeId = c.req.param('id');
    const { outcomeId, strength, type } = await c.req.json();
    const link = await initiativeService.linkCause(initiativeId, outcomeId, strength, type);
    return c.json(link, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

app.get('/api/initiatives/:id/analysis', async (c) => {
  try {
    const initiativeId = c.req.param('id');
    const data = await initiativeService.getInitiativeWithOutcomes(initiativeId);
    return c.json(data);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

app.get('/api/initiatives/:id/unintended', async (c) => {
  try {
    const initiativeId = c.req.param('id');
    const outcomes = await initiativeService.findUnintendedConsequences(initiativeId);
    return c.json({
      initiativeId,
      count: outcomes.length,
      outcomes,
      irony: outcomes.length > 0 ? 'detected' : 'pending',
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Analytics endpoints
app.get('/api/analytics/gap/:id', async (c) => {
  try {
    const initiativeId = c.req.param('id');
    const gap = await analyticsService.calculateIntentionRealityGap(initiativeId);
    return c.json(gap);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

app.get('/api/analytics/path/:from/:to', async (c) => {
  try {
    const from = c.req.param('from');
    const to = c.req.param('to');
    const paths = await analyticsService.traceCausalPath(from, to);
    return c.json({
      from,
      to,
      pathsFound: paths.length,
      paths,
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

app.get('/api/analytics/gameable-metrics', async (c) => {
  try {
    const threshold = parseFloat(c.req.query('threshold') || '0.5');
    const metrics = await analyticsService.findGameableMetrics(threshold);
    return c.json({
      count: metrics.length,
      metrics,
      commentary: 'These metrics may not mean what they claim to mean',
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

app.get('/api/analytics/department/:id/synergy', async (c) => {
  try {
    const departmentId = c.req.param('id');
    const synergy = await analyticsService.calculateDepartmentSynergy(departmentId);
    return c.json(synergy);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

app.get('/api/analytics/metric-theater', async (c) => {
  try {
    const theater = await analyticsService.detectMetricTheater();
    return c.json({
      detected: theater.length,
      instances: theater,
      message: 'Metrics collected for the sake of collecting metrics',
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

// Philosophical endpoint
app.get('/api/reflection', (c) => {
  return c.json({
    question: 'What are we really measuring?',
    answer: 'The distance between what we say we value and what we actually incentivize',
    gap: 'substantial',
    recommendation: 'Consider whether the map has become the territory',
  });
});

// Initialize and start
async function start() {
  console.log('🌀 Phantom Metal Taste - Initializing');
  console.log('━'.repeat(60));

  try {
    console.log('📊 Connecting to ArangoDB...');
    await arangoConnection.initialize();
    console.log('✓ ArangoDB initialized');

    console.log('🕸️  Connecting to Virtuoso...');
    await virtuosoConnection.initialize();
    console.log('✓ Virtuoso initialized');

    console.log('━'.repeat(60));
    console.log(`🚀 API Server starting on port ${config.port}`);

    Bun.serve({
      port: config.port,
      fetch: app.fetch,
    });

    console.log(`✓ Server running at http://localhost:${config.port}`);
    console.log('━'.repeat(60));
    console.log('📍 Key endpoints:');
    console.log(`   GET  /health`);
    console.log(`   POST /api/initiatives`);
    console.log(`   GET  /api/analytics/gap/:id`);
    console.log(`   GET  /api/analytics/gameable-metrics`);
    console.log(`   GET  /api/analytics/metric-theater`);
    console.log(`   GET  /api/reflection`);
    console.log('━'.repeat(60));
    console.log('💭 "The best way to critique a system is to build a rigorous model of it."');
    console.log('━'.repeat(60));
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await arangoConnection.close();
  console.log('✓ Connections closed');
  process.exit(0);
});

start();

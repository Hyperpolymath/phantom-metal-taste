import { describe, it, expect, beforeEach } from 'bun:test';
import { InitiativeService } from '../../src/orchestrator/services/initiative-service.js';
import { getArangoConnection, getVirtuosoConnection } from '../setup.js';

describe('InitiativeService', () => {
  let service: InitiativeService;
  let db: any;

  beforeEach(async () => {
    const arango = getArangoConnection();
    const virtuoso = getVirtuosoConnection();
    db = arango.getDatabase();
    service = new InitiativeService(arango, virtuoso);

    // Clean up
    const collections = ['initiatives', 'outcomes', 'causes'];
    for (const collName of collections) {
      const coll = db.collection(collName);
      await coll.truncate();
    }
  });

  it('should create an initiative', async () => {
    const initiative = await service.createInitiative({
      name: 'Test Initiative',
      description: 'A test initiative',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Engineering',
      intendedOutcome: 'Improve efficiency',
      status: 'active',
      participants: [],
    });

    expect(initiative).toBeDefined();
    expect(initiative._key).toBeDefined();
    expect(initiative.name).toBe('Test Initiative');
    expect(initiative.status).toBe('active');
  });

  it('should validate initiative data with Zod', async () => {
    const invalidInitiative = {
      name: 'Test',
      description: 'Test',
      startDate: 'invalid-date', // Invalid date format
      department: 'Eng',
      intendedOutcome: 'Something',
      status: 'invalid-status', // Invalid status
    } as any;

    await expect(service.createInitiative(invalidInitiative)).rejects.toThrow();
  });

  it('should link initiative to outcome with causal relationship', async () => {
    // Create initiative
    const initiative = await service.createInitiative({
      name: 'Wellness Program',
      description: 'Employee wellness initiative',
      startDate: '2024-01-01T00:00:00Z',
      department: 'HR',
      intendedOutcome: 'Improve wellness',
      status: 'active',
      participants: [],
    });

    // Create outcome manually
    const outcomeColl = db.collection('outcomes');
    const outcome = await outcomeColl.save({
      description: 'Increased stress',
      timestamp: '2024-02-01T00:00:00Z',
      type: 'unintended',
      severity: 8,
      measuredBy: [],
      affectedEmployees: [],
    });

    // Link them
    const link = await service.linkCause(initiative._key!, outcome._key, 0.9, 'direct');

    expect(link).toBeDefined();
    expect(link._from).toBe(`initiatives/${initiative._key}`);
    expect(link._to).toBe(`outcomes/${outcome._key}`);
    expect(link.strength).toBe(0.9);
    expect(link.type).toBe('direct');
  });

  it('should retrieve initiative with outcomes', async () => {
    // Create initiative
    const initiative = await service.createInitiative({
      name: 'Test Initiative',
      description: 'Testing retrieval',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Test',
      intendedOutcome: 'Success',
      status: 'active',
      participants: [],
    });

    // Create outcomes
    const outcomeColl = db.collection('outcomes');
    const intended = await outcomeColl.save({
      description: 'Intended outcome',
      timestamp: '2024-02-01T00:00:00Z',
      type: 'intended',
      severity: 5,
      measuredBy: [],
      affectedEmployees: [],
    });

    const unintended = await outcomeColl.save({
      description: 'Unintended outcome',
      timestamp: '2024-02-15T00:00:00Z',
      type: 'unintended',
      severity: 7,
      measuredBy: [],
      affectedEmployees: [],
    });

    // Link them
    await service.linkCause(initiative._key!, intended._key, 0.6, 'direct');
    await service.linkCause(initiative._key!, unintended._key, 0.8, 'direct');

    // Retrieve
    const result = await service.getInitiativeWithOutcomes(initiative._key!);

    expect(result).toBeDefined();
    expect(result.initiative.name).toBe('Test Initiative');
    expect(result.intended.length).toBe(1);
    expect(result.actual.length).toBe(1);
    expect(result.gap).toBeGreaterThan(0);
  });

  it('should find unintended consequences', async () => {
    // Create initiative
    const initiative = await service.createInitiative({
      name: 'Productivity Initiative',
      description: 'Increase productivity',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Engineering',
      intendedOutcome: 'More output',
      status: 'active',
      participants: [],
    });

    // Create unintended outcomes
    const outcomeColl = db.collection('outcomes');
    const unintended1 = await outcomeColl.save({
      description: 'Burnout increased',
      timestamp: '2024-02-01T00:00:00Z',
      type: 'unintended',
      severity: 8,
      measuredBy: [],
      affectedEmployees: [],
    });

    const unintended2 = await outcomeColl.save({
      description: 'Quality decreased',
      timestamp: '2024-02-15T00:00:00Z',
      type: 'unintended',
      severity: 7,
      measuredBy: [],
      affectedEmployees: [],
    });

    // Link them
    await service.linkCause(initiative._key!, unintended1._key, 0.9, 'direct');
    await service.linkCause(initiative._key!, unintended2._key, 0.85, 'indirect');

    // Find unintended
    const unintended = await service.findUnintendedConsequences(initiative._key!);

    expect(unintended.length).toBe(2);
    expect(unintended.every(o => o.type === 'unintended')).toBe(true);
  });
});

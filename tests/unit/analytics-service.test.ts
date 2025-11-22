import { describe, it, expect, beforeEach } from 'bun:test';
import { AnalyticsService } from '../../src/orchestrator/services/analytics-service.js';
import { getArangoConnection } from '../setup.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let db: any;

  beforeEach(async () => {
    const arango = getArangoConnection();
    db = arango.getDatabase();
    service = new AnalyticsService(arango);

    // Clean up before each test
    const collections = ['initiatives', 'outcomes', 'metrics', 'employees', 'departments', 'causes'];
    for (const collName of collections) {
      const coll = db.collection(collName);
      await coll.truncate();
    }
  });

  it('should calculate intention-reality gap', async () => {
    // Insert test initiative
    const initColl = db.collection('initiatives');
    const init = await initColl.save({
      name: 'Test Initiative',
      description: 'Testing gap calculation',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Engineering',
      intendedOutcome: 'Improve productivity',
      status: 'active',
    });

    // Insert outcomes
    const outcomeColl = db.collection('outcomes');
    const intended = await outcomeColl.save({
      description: 'Improved productivity',
      timestamp: '2024-02-01T00:00:00Z',
      type: 'intended',
      severity: 5,
      measuredBy: [],
      affectedEmployees: [],
    });

    const unintended1 = await outcomeColl.save({
      description: 'Increased burnout',
      timestamp: '2024-02-15T00:00:00Z',
      type: 'unintended',
      severity: 8,
      measuredBy: [],
      affectedEmployees: [],
    });

    const unintended2 = await outcomeColl.save({
      description: 'Decreased collaboration',
      timestamp: '2024-03-01T00:00:00Z',
      type: 'emergent',
      severity: 7,
      measuredBy: [],
      affectedEmployees: [],
    });

    // Link them
    const causesColl = db.collection('causes');
    await causesColl.save({
      _from: init._id,
      _to: intended._id,
      strength: 0.5,
      type: 'direct',
      evidence: [],
      discoveredAt: new Date().toISOString(),
    });

    await causesColl.save({
      _from: init._id,
      _to: unintended1._id,
      strength: 0.9,
      type: 'direct',
      evidence: [],
      discoveredAt: new Date().toISOString(),
    });

    await causesColl.save({
      _from: init._id,
      _to: unintended2._id,
      strength: 0.8,
      type: 'indirect',
      evidence: [],
      discoveredAt: new Date().toISOString(),
    });

    // Calculate gap
    const gap = await service.calculateIntentionRealityGap(init._key);

    expect(gap).toBeDefined();
    expect(gap.initiativeName).toBe('Test Initiative');
    expect(gap.unintendedConsequences.length).toBe(2);
    expect(gap.gapScore).toBeGreaterThan(0);
    expect(gap.analysis).toContain('unintended outcomes');
  });

  it('should detect gameable metrics', async () => {
    const metricsColl = db.collection('metrics');

    // Insert metrics with large gaps
    await metricsColl.save({
      name: 'Wellness Score',
      description: 'Employee wellness',
      type: 'wellness',
      value: 50,
      target: 90,
      timestamp: '2024-01-01T00:00:00Z',
    });

    await metricsColl.save({
      name: 'Engagement',
      description: 'Employee engagement',
      type: 'engagement',
      value: 95,
      target: 90,
      timestamp: '2024-01-01T00:00:00Z',
    });

    const results = await service.findGameableMetrics(0.3);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].gap).toBeGreaterThan(0.3);
    expect(results[0].suspicionLevel).toBeDefined();
  });

  it('should detect metric theater', async () => {
    const metricsColl = db.collection('metrics');

    // Insert metrics with no causal links
    await metricsColl.save({
      name: 'Orphan Metric',
      description: 'A metric collected but never used',
      type: 'custom',
      value: 75,
      timestamp: '2024-01-01T00:00:00Z',
    });

    await metricsColl.save({
      name: 'Another Orphan',
      description: 'Also never linked to anything',
      type: 'custom',
      value: 80,
      timestamp: '2024-01-01T00:00:00Z',
    });

    const theater = await service.detectMetricTheater();

    expect(theater.length).toBe(2);
    expect(theater[0].theaterScore).toBe(100);
    expect(theater[0].message).toContain('no causal link');
  });

  it('should calculate department synergy', async () => {
    const deptColl = db.collection('departments');
    const empColl = db.collection('employees');
    const initColl = db.collection('initiatives');

    // Create department
    const dept = await deptColl.save({
      name: 'Engineering',
      description: 'Software engineering',
      employeeCount: 2,
    });

    // Create employees
    await empColl.save({
      employeeId: 'E001',
      name: 'Alice',
      email: 'alice@test.com',
      department: 'Engineering',
      role: 'Engineer',
      hireDate: '2020-01-01T00:00:00Z',
      wellnessScore: 80,
      engagementLevel: 75,
    });

    await empColl.save({
      employeeId: 'E002',
      name: 'Bob',
      email: 'bob@test.com',
      department: 'Engineering',
      role: 'Engineer',
      hireDate: '2021-01-01T00:00:00Z',
      wellnessScore: 70,
      engagementLevel: 65,
    });

    // Create initiatives
    await initColl.save({
      name: 'Project A',
      description: 'A completed project',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Engineering',
      intendedOutcome: 'Success',
      status: 'completed',
    });

    await initColl.save({
      name: 'Project B',
      description: 'An abandoned project',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Engineering',
      intendedOutcome: 'Success',
      status: 'abandoned',
    });

    const synergy = await service.calculateDepartmentSynergy(dept._key);

    expect(synergy).toBeDefined();
    expect(synergy.department.name).toBe('Engineering');
    expect(synergy.employeeCount).toBe(2);
    expect(synergy.avgWellness).toBe(75);
    expect(synergy.avgEngagement).toBe(70);
    expect(synergy.synergyScore).toBeGreaterThan(0);
    expect(synergy.ironyLevel).toBe('MAXIMUM');
  });

  it('should trace causal paths', async () => {
    const initColl = db.collection('initiatives');
    const outcomeColl = db.collection('outcomes');
    const causesColl = db.collection('causes');

    // Create a chain: Initiative -> Outcome1 -> Outcome2
    const init = await initColl.save({
      name: 'Start',
      description: 'Starting point',
      startDate: '2024-01-01T00:00:00Z',
      department: 'Test',
      intendedOutcome: 'Something',
      status: 'active',
    });

    const outcome1 = await outcomeColl.save({
      description: 'First outcome',
      timestamp: '2024-02-01T00:00:00Z',
      type: 'intended',
      severity: 5,
      measuredBy: [],
      affectedEmployees: [],
    });

    const outcome2 = await outcomeColl.save({
      description: 'Second outcome',
      timestamp: '2024-03-01T00:00:00Z',
      type: 'unintended',
      severity: 7,
      measuredBy: [],
      affectedEmployees: [],
    });

    // Create path
    await causesColl.save({
      _from: init._id,
      _to: outcome1._id,
      strength: 0.8,
      type: 'direct',
      evidence: [],
      discoveredAt: new Date().toISOString(),
    });

    await causesColl.save({
      _from: outcome1._id,
      _to: outcome2._id,
      strength: 0.7,
      type: 'indirect',
      evidence: [],
      discoveredAt: new Date().toISOString(),
    });

    const paths = await service.traceCausalPath(init._id, outcome2._id, 5);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].from).toBe(init._id);
    expect(paths[0].to).toBe(outcome2._id);
    expect(paths[0].length).toBeGreaterThan(1);
    expect(paths[0].totalStrength).toBeGreaterThan(0);
  });
});

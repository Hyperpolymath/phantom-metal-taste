#!/usr/bin/env bun

import { ArangoConnection } from '../../src/orchestrator/db/arango.js';
import { VirtuosoConnection } from '../../src/orchestrator/db/virtuoso.js';
import type { Initiative, Employee, Department, Outcome, Metric } from '../../src/orchestrator/models/types.js';

const config = {
  arango: {
    url: 'http://localhost:8529',
    database: 'phantom_metal_taste',
    username: 'root',
    password: 'phantom-dev-password',
  },
  virtuoso: {
    queryUrl: 'http://localhost:8890/sparql',
    updateUrl: 'http://localhost:8890/sparql-auth',
    username: 'dba',
    password: 'phantom-dev-password',
    defaultGraph: 'http://phantom-metal-taste.org/graph',
  },
};

async function loadSynapCorData() {
  console.log('🏢 Loading SynapCor case study data...\n');

  const arango = new ArangoConnection(config.arango);
  const virtuoso = new VirtuosoConnection(config.virtuoso);

  await arango.initialize();
  await virtuoso.initialize();

  const db = arango.getDatabase();

  // Load departments
  console.log('📁 Loading departments...');
  const departments: Omit<Department, '_key' | '_id'>[] = [
    {
      name: 'Engineering',
      description: 'Software engineering and infrastructure',
      headOfDepartment: 'David Chen',
      employeeCount: 35,
      budget: 4200000,
      synergyIndex: 73,
    },
    {
      name: 'Product',
      description: 'Product management and design',
      headOfDepartment: 'Sarah Martinez',
      employeeCount: 15,
      budget: 1800000,
      synergyIndex: 81,
    },
    {
      name: 'HR',
      description: 'People Operations',
      headOfDepartment: 'Michael Thompson',
      employeeCount: 5,
      budget: 600000,
      synergyIndex: 97, // They designed the system!
    },
    {
      name: 'Finance',
      description: 'Finance and accounting',
      headOfDepartment: 'Robert Kim',
      employeeCount: 4,
      budget: 500000,
      synergyIndex: 44, // They questioned the ROI
    },
  ];

  const deptCollection = db.collection('departments');
  const deptResults = await Promise.all(
    departments.map(dept => deptCollection.save(dept))
  );
  console.log(`✓ Loaded ${deptResults.length} departments\n`);

  // Load sample employees
  console.log('👥 Loading employees...');
  const employees: Omit<Employee, '_key' | '_id'>[] = [
    {
      employeeId: 'EMP001',
      name: 'Alex Rivera',
      email: 'alex.rivera@synapcor.com',
      department: 'Engineering',
      role: 'Platform Engineer',
      hireDate: '2020-03-15T00:00:00Z',
      wellnessScore: 94,
      engagementLevel: 97,
      synergized: true,
      metadata: { reality: 'Burned out, interviewing elsewhere' },
    },
    {
      employeeId: 'EMP002',
      name: 'Marcus Thompson',
      email: 'marcus.thompson@synapcor.com',
      department: 'Engineering',
      role: 'Senior Engineer',
      hireDate: '2018-07-22T00:00:00Z',
      wellnessScore: 52,
      engagementLevel: 48,
      synergized: false,
      metadata: { reality: 'Shipped 3 major features in Q1, mentored 4 juniors' },
    },
    {
      employeeId: 'EMP003',
      name: 'Jessica Wu',
      email: 'jessica.wu@synapcor.com',
      department: 'Product',
      role: 'Product Designer',
      hireDate: '2021-01-10T00:00:00Z',
      wellnessScore: 91,
      engagementLevel: 93,
      synergized: true,
      metadata: { reality: 'Genuinely enjoys it, unaware she\'s an outlier' },
    },
    {
      employeeId: 'EMP004',
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@synapcor.com',
      department: 'Product',
      role: 'Product Manager',
      hireDate: '2019-09-05T00:00:00Z',
      wellnessScore: 47,
      engagementLevel: 51,
      synergized: false,
      metadata: { reality: 'Managing family crisis, excellent work in fewer hours' },
    },
    {
      employeeId: 'EMP005',
      name: 'Michael Thompson',
      email: 'michael.thompson@synapcor.com',
      department: 'HR',
      role: 'VP People Ops',
      hireDate: '2016-04-12T00:00:00Z',
      wellnessScore: 98,
      engagementLevel: 99,
      synergized: true,
      metadata: { reality: 'Created the system, benefits from it' },
    },
    {
      employeeId: 'EMP006',
      name: 'Robert Kim',
      email: 'robert.kim@synapcor.com',
      department: 'Finance',
      role: 'CFO',
      hireDate: '2017-02-20T00:00:00Z',
      wellnessScore: 61,
      engagementLevel: 58,
      synergized: false,
      metadata: { reality: 'Questioned the ROI, penalized by metrics' },
    },
  ];

  const empCollection = db.collection('employees');
  const empResults = await Promise.all(
    employees.map(emp => empCollection.save(emp))
  );
  console.log(`✓ Loaded ${empResults.length} sample employees\n`);

  // Load initiatives
  console.log('🎯 Loading initiatives...');
  const initiatives: Omit<Initiative, '_key' | '_id'>[] = [
    {
      name: 'Wellness Wednesday',
      description: 'Mandatory meditation sessions every Wednesday afternoon',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      department: 'HR',
      intendedOutcome: 'Improve employee wellness through mindfulness',
      budget: 50000,
      participants: ['EMP001', 'EMP002', 'EMP003', 'EMP004'],
      status: 'active',
    },
    {
      name: 'Radical Transparency Dashboard',
      description: 'Real-time public display of all employee metrics',
      startDate: '2024-02-01T00:00:00Z',
      department: 'HR',
      intendedOutcome: 'Foster accountability through transparency',
      budget: 120000,
      participants: [],
      status: 'active',
    },
    {
      name: 'Synergy Champions Program',
      description: 'Recognition program for high-engagement employees',
      startDate: '2024-03-01T00:00:00Z',
      department: 'HR',
      intendedOutcome: 'Recognize and incentivize high performers',
      budget: 75000,
      participants: ['EMP001', 'EMP003', 'EMP005'],
      status: 'active',
    },
  ];

  const initCollection = db.collection('initiatives');
  const initResults = await Promise.all(
    initiatives.map(init => initCollection.save(init))
  );
  console.log(`✓ Loaded ${initResults.length} initiatives\n`);

  // Load outcomes
  console.log('📊 Loading outcomes...');
  const outcomes: Omit<Outcome, '_key' | '_id'>[] = [
    {
      description: 'Improved employee wellness',
      timestamp: '2024-03-01T00:00:00Z',
      type: 'intended',
      severity: 3,
      measuredBy: [],
      affectedEmployees: [],
    },
    {
      description: '23% decrease in Wednesday afternoon productivity',
      timestamp: '2024-02-15T00:00:00Z',
      type: 'unintended',
      severity: 6,
      measuredBy: [],
      affectedEmployees: ['EMP001', 'EMP002', 'EMP003', 'EMP004'],
    },
    {
      description: 'Creation of "meditation theater" behavior',
      timestamp: '2024-02-20T00:00:00Z',
      type: 'unintended',
      severity: 7,
      measuredBy: [],
      affectedEmployees: ['EMP001', 'EMP002'],
    },
    {
      description: '47% report increased stress about performing relaxation',
      timestamp: '2024-03-10T00:00:00Z',
      type: 'unintended',
      severity: 8,
      measuredBy: [],
      affectedEmployees: [],
    },
    {
      description: 'Emergence of black market for meditation attendance credits',
      timestamp: '2024-04-01T00:00:00Z',
      type: 'emergent',
      severity: 9,
      measuredBy: [],
      affectedEmployees: [],
      metadata: { irony: 'maximum' },
    },
    {
      description: 'Increased accountability',
      timestamp: '2024-03-15T00:00:00Z',
      type: 'intended',
      severity: 5,
      measuredBy: [],
      affectedEmployees: [],
    },
    {
      description: 'Employees gaming metrics with late-night empty commits',
      timestamp: '2024-03-20T00:00:00Z',
      type: 'unintended',
      severity: 8,
      measuredBy: [],
      affectedEmployees: ['EMP001'],
    },
    {
      description: '31% decrease in genuine collaboration',
      timestamp: '2024-04-05T00:00:00Z',
      type: 'unintended',
      severity: 9,
      measuredBy: [],
      affectedEmployees: [],
    },
    {
      description: 'Three employees quit citing surveillance culture',
      timestamp: '2024-04-20T00:00:00Z',
      type: 'emergent',
      severity: 10,
      measuredBy: [],
      affectedEmployees: [],
    },
  ];

  const outcomeCollection = db.collection('outcomes');
  const outcomeResults = await Promise.all(
    outcomes.map(outcome => outcomeCollection.save(outcome))
  );
  console.log(`✓ Loaded ${outcomeResults.length} outcomes\n`);

  // Create causal links
  console.log('🔗 Creating causal relationships...');
  const causesCollection = db.collection('causes');

  // Link Wellness Wednesday to its outcomes
  await causesCollection.save({
    _from: initResults[0]._id,
    _to: outcomeResults[0]._id,
    strength: 0.3,
    type: 'direct',
    evidence: ['Survey data'],
    discoveredAt: new Date().toISOString(),
  });

  await causesCollection.save({
    _from: initResults[0]._id,
    _to: outcomeResults[1]._id,
    strength: 0.9,
    type: 'direct',
    evidence: ['Productivity metrics', 'Time tracking'],
    discoveredAt: new Date().toISOString(),
  });

  await causesCollection.save({
    _from: initResults[0]._id,
    _to: outcomeResults[2]._id,
    strength: 0.8,
    type: 'indirect',
    evidence: ['Behavioral observation', 'Anonymous feedback'],
    discoveredAt: new Date().toISOString(),
  });

  // Link Transparency Dashboard to its outcomes
  await causesCollection.save({
    _from: initResults[1]._id,
    _to: outcomeResults[5]._id,
    strength: 0.4,
    type: 'direct',
    evidence: ['Dashboard usage stats'],
    discoveredAt: new Date().toISOString(),
  });

  await causesCollection.save({
    _from: initResults[1]._id,
    _to: outcomeResults[6]._id,
    strength: 0.95,
    type: 'direct',
    evidence: ['Git logs', 'Automated activity patterns'],
    discoveredAt: new Date().toISOString(),
  });

  await causesCollection.save({
    _from: initResults[1]._id,
    _to: outcomeResults[7]._id,
    strength: 0.85,
    type: 'direct',
    evidence: ['Collaboration tool analytics', 'Survey responses'],
    discoveredAt: new Date().toISOString(),
  });

  await causesCollection.save({
    _from: initResults[1]._id,
    _to: outcomeResults[8]._id,
    strength: 0.75,
    type: 'indirect',
    evidence: ['Exit interviews'],
    discoveredAt: new Date().toISOString(),
  });

  console.log('✓ Created causal links\n');

  // Load some sample metrics
  console.log('📈 Loading metrics...');
  const metrics: Omit<Metric, '_key' | '_id'>[] = [
    {
      name: 'Average Wellness Score',
      description: 'Company-wide average wellness',
      type: 'wellness',
      value: 73.4,
      timestamp: '2024-04-01T00:00:00Z',
      target: 85.0,
      actualVsTarget: -11.6,
    },
    {
      name: 'Engineering Synergy Index',
      description: 'Department synergy score',
      type: 'synergy',
      value: 73.0,
      timestamp: '2024-04-01T00:00:00Z',
      target: 80.0,
      actualVsTarget: -7.0,
    },
    {
      name: 'Meditation Attendance',
      description: 'Wednesday meditation participation rate',
      type: 'engagement',
      value: 94.2,
      timestamp: '2024-04-01T00:00:00Z',
      target: 90.0,
      actualVsTarget: 4.2,
      metadata: { reality: 'High attendance, low actual meditation' },
    },
  ];

  const metricsCollection = db.collection('metrics');
  await Promise.all(metrics.map(m => metricsCollection.save(m)));
  console.log(`✓ Loaded ${metrics.length} metrics\n`);

  console.log('━'.repeat(60));
  console.log('✅ SynapCor case study data loaded successfully!');
  console.log('━'.repeat(60));
  console.log('\n📍 Try these endpoints:');
  console.log('   GET  http://localhost:3000/api/analytics/gameable-metrics');
  console.log('   GET  http://localhost:3000/api/analytics/metric-theater');
  console.log('   GET  http://localhost:3000/api/initiatives/[id]/unintended');
  console.log('   GET  http://localhost:3000/api/reflection\n');

  await arango.close();
  process.exit(0);
}

loadSynapCorData().catch(console.error);

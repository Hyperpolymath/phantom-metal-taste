import { z } from 'zod';

// Core domain models

export const InitiativeSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  department: z.string(),
  intendedOutcome: z.string(),
  budget: z.number().optional(),
  participants: z.array(z.string()).default([]),
  status: z.enum(['planned', 'active', 'completed', 'abandoned']),
  metadata: z.record(z.unknown()).optional(),
});

export type Initiative = z.infer<typeof InitiativeSchema>;

export const OutcomeSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  description: z.string(),
  timestamp: z.string().datetime(),
  type: z.enum(['intended', 'unintended', 'emergent']),
  severity: z.number().min(0).max(10),
  measuredBy: z.array(z.string()).default([]),
  affectedEmployees: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type Outcome = z.infer<typeof OutcomeSchema>;

export const EmployeeSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  employeeId: z.string(),
  name: z.string(),
  email: z.string().email(),
  department: z.string(),
  role: z.string(),
  hireDate: z.string().datetime(),
  wellnessScore: z.number().min(0).max(100).optional(),
  engagementLevel: z.number().min(0).max(100).optional(),
  synergized: z.boolean().default(false), // SynapCor-specific irony
  metadata: z.record(z.unknown()).optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const MetricSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['wellness', 'productivity', 'engagement', 'synergy', 'custom']),
  value: z.number(),
  timestamp: z.string().datetime(),
  unit: z.string().optional(),
  target: z.number().optional(),
  actualVsTarget: z.number().optional(), // The gap
  collectedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Metric = z.infer<typeof MetricSchema>;

export const DepartmentSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  headOfDepartment: z.string().optional(),
  employeeCount: z.number().default(0),
  budget: z.number().optional(),
  synergyIndex: z.number().min(0).max(100).optional(), // More irony
  metadata: z.record(z.unknown()).optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

// Edge/Relationship models

export const CausalLinkSchema = z.object({
  _key: z.string().optional(),
  _id: z.string().optional(),
  _from: z.string(),
  _to: z.string(),
  strength: z.number().min(0).max(1), // Confidence in causal relationship
  type: z.enum(['direct', 'indirect', 'spurious']),
  evidence: z.array(z.string()).default([]),
  discoveredAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type CausalLink = z.infer<typeof CausalLinkSchema>;

// Analysis results

export const IntentionRealityGapSchema = z.object({
  initiativeId: z.string(),
  initiativeName: z.string(),
  intendedOutcome: z.string(),
  actualOutcomes: z.array(OutcomeSchema),
  gapScore: z.number().min(0).max(100), // How far off from intention
  unintendedConsequences: z.array(OutcomeSchema),
  analysis: z.string(),
  recommendations: z.array(z.string()).optional(),
});

export type IntentionRealityGap = z.infer<typeof IntentionRealityGapSchema>;

export const CausalPathSchema = z.object({
  from: z.string(),
  to: z.string(),
  path: z.array(z.object({
    node: z.string(),
    type: z.string(),
    label: z.string().optional(),
  })),
  totalStrength: z.number(),
  length: z.number(),
});

export type CausalPath = z.infer<typeof CausalPathSchema>;

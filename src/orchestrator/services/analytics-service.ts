import { ArangoConnection, aql } from '../db/arango.js';
import { IntentionRealityGap, CausalPath } from '../models/types.js';

export class AnalyticsService {
  constructor(private arango: ArangoConnection) {}

  /**
   * Calculate the "phantom metal taste" - the gap between what was intended
   * and what actually happened. This is the core metric of organizational delusion.
   */
  async calculateIntentionRealityGap(initiativeId: string): Promise<IntentionRealityGap> {
    const query = aql`
      LET initiative = DOCUMENT('initiatives', ${initiativeId})

      LET intended = (
        FOR v IN 1..1 OUTBOUND initiative causes
          FILTER v.type == 'intended'
          RETURN v
      )

      LET actual = (
        FOR v IN 1..2 OUTBOUND initiative causes
          FILTER v.type IN ['unintended', 'emergent']
          RETURN v
      )

      LET metrics = (
        FOR v IN 1..1 OUTBOUND initiative measures
          RETURN v
      )

      LET avgMetricGap = LENGTH(metrics) > 0 ? AVG(
        FOR m IN metrics
          FILTER m.target != null AND m.value != null
          RETURN ABS(m.value - m.target) / m.target
      ) : 0

      LET gapScore = (
        LENGTH(actual) * 10 + // More unintended outcomes = bigger gap
        avgMetricGap * 50 +    // Metric misses
        (LENGTH(intended) == 0 ? 25 : 0) // No intended outcomes measured = suspicious
      )

      RETURN {
        initiativeId: initiative._key,
        initiativeName: initiative.name,
        intendedOutcome: initiative.intendedOutcome,
        actualOutcomes: actual,
        gapScore: MIN([gapScore, 100]),
        unintendedConsequences: actual,
        analysis: CONCAT(
          'Initiative "', initiative.name, '" shows ',
          gapScore > 75 ? 'severe' : (gapScore > 50 ? 'significant' : 'moderate'),
          ' divergence from stated intentions. ',
          LENGTH(actual), ' unintended outcomes detected.'
        )
      }
    `;

    const results = await this.arango.query<IntentionRealityGap>(query);
    return results[0] || null;
  }

  /**
   * Find causal paths between an initiative and an outcome.
   * Reveals the hidden connections that make outcomes "surprising".
   */
  async traceCausalPath(fromId: string, toId: string, maxDepth: number = 5): Promise<CausalPath[]> {
    const query = aql`
      FOR v, e, p IN 1..${maxDepth} OUTBOUND DOCUMENT(${fromId}) causes
        FILTER v._id == ${toId}
        RETURN {
          from: ${fromId},
          to: ${toId},
          path: (
            FOR node IN p.vertices
              RETURN {
                node: node._id,
                type: SPLIT(node._id, '/')[0],
                label: node.name || node.description
              }
          ),
          totalStrength: PRODUCT(
            FOR edge IN p.edges
              RETURN edge.strength || 0.5
          ),
          length: LENGTH(p.vertices)
        }
    `;

    return this.arango.query<CausalPath>(query);
  }

  /**
   * Find the most "gameable" metrics - those with the largest gap
   * between what they measure and what they purport to measure.
   */
  async findGameableMetrics(threshold: number = 0.5): Promise<any[]> {
    const query = aql`
      FOR metric IN metrics
        FILTER metric.target != null AND metric.value != null
        LET gap = ABS(metric.value - metric.target) / metric.target
        FILTER gap > ${threshold}

        LET measuredEntities = (
          FOR v IN 1..1 OUTBOUND metric measures
            RETURN v
        )

        SORT gap DESC
        RETURN {
          metric: metric,
          gap: gap,
          gapPercentage: gap * 100,
          measuredEntities: measuredEntities,
          suspicionLevel: gap > 0.9 ? 'EXTREME' : (gap > 0.7 ? 'HIGH' : 'MODERATE')
        }
    `;

    return this.arango.query(query);
  }

  /**
   * Calculate departmental "synergy" (irony fully intended).
   * Measures how much departments claim vs. what they produce.
   */
  async calculateDepartmentSynergy(departmentId: string): Promise<any> {
    const query = aql`
      LET dept = DOCUMENT('departments', ${departmentId})

      LET employees = (
        FOR emp IN employees
          FILTER emp.department == dept.name
          RETURN emp
      )

      LET initiatives = (
        FOR init IN initiatives
          FILTER init.department == dept.name
          RETURN init
      )

      LET avgWellness = AVG(
        FOR emp IN employees
          FILTER emp.wellnessScore != null
          RETURN emp.wellnessScore
      )

      LET avgEngagement = AVG(
        FOR emp IN employees
          FILTER emp.engagementLevel != null
          RETURN emp.engagementLevel
      )

      LET completedInitiatives = LENGTH(
        FOR init IN initiatives
          FILTER init.status == 'completed'
          RETURN 1
      )

      LET abandonedInitiatives = LENGTH(
        FOR init IN initiatives
          FILTER init.status == 'abandoned'
          RETURN 1
      )

      LET synergyScore = (
        avgWellness * 0.3 +
        avgEngagement * 0.3 +
        (completedInitiatives / (completedInitiatives + abandonedInitiatives + 1)) * 40
      )

      RETURN {
        department: dept,
        employeeCount: LENGTH(employees),
        avgWellness: avgWellness,
        avgEngagement: avgEngagement,
        initiativeSuccessRate: completedInitiatives / (completedInitiatives + abandonedInitiatives + 1),
        synergyScore: synergyScore,
        synergyGrade: synergyScore > 80 ? 'SYNERGIZED' : (synergyScore > 60 ? 'ALIGNED' : 'SILOED'),
        ironyLevel: 'MAXIMUM'
      }
    `;

    const results = await this.arango.query(query);
    return results[0] || null;
  }

  /**
   * Detect "metric theater" - metrics that are collected but never acted upon.
   */
  async detectMetricTheater(): Promise<any[]> {
    const query = aql`
      FOR metric IN metrics
        LET linkedInitiatives = (
          FOR v, e IN 1..2 ANY metric GRAPH 'causal_graph'
            FILTER v._id LIKE 'initiatives/%'
            RETURN v
        )

        FILTER LENGTH(linkedInitiatives) == 0

        RETURN {
          metric: metric,
          message: CONCAT(
            'Metric "', metric.name, '" has been collected but shows no causal link to any initiative. ',
            'Possible metric theater detected.'
          ),
          theaterScore: 100
        }
    `;

    return this.arango.query(query);
  }
}

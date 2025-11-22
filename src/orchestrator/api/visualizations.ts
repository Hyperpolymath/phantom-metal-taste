/**
 * Visualization data preparation module
 * Transforms database results into formats suitable for visualization
 */

import { ArangoConnection, aql } from '../db/arango.js';

export interface GraphNode {
  id: string;
  label: string;
  type: 'initiative' | 'outcome' | 'employee' | 'department' | 'metric';
  properties: Record<string, any>;
  size?: number;
  color?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  weight: number;
  type: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
  label?: string;
}

export class VisualizationService {
  constructor(private arango: ArangoConnection) {}

  /**
   * Generate causal graph data for visualization
   */
  async getCausalGraphData(initiativeId?: string): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }> {
    const db = this.arango.getDatabase();

    let query;
    if (initiativeId) {
      // Graph for specific initiative
      query = aql`
        LET start = DOCUMENT('initiatives', ${initiativeId})

        LET vertices = (
          FOR v, e, p IN 1..3 ANY start GRAPH 'causal_graph'
            RETURN DISTINCT v
        )

        LET edges = (
          FOR v, e, p IN 1..3 ANY start GRAPH 'causal_graph'
            RETURN DISTINCT e
        )

        RETURN {
          vertices: APPEND([start], vertices),
          edges: edges
        }
      `;
    } else {
      // Full graph (limit to prevent overwhelming)
      query = aql`
        LET initiatives = (FOR i IN initiatives LIMIT 10 RETURN i)

        LET vertices = UNION(
          (FOR i IN initiatives RETURN i),
          (FOR v, e IN 1..2 OUTBOUND initiatives[*] GRAPH 'causal_graph' RETURN v)
        )

        LET edges = (
          FOR v, e IN 1..2 OUTBOUND initiatives[*] GRAPH 'causal_graph'
            RETURN e
        )

        RETURN {
          vertices: vertices,
          edges: edges
        }
      `;
    }

    const results = await this.arango.query<any>(query);
    const data = results[0];

    // Transform to visualization format
    const nodes: GraphNode[] = data.vertices.map((v: any) => {
      const collection = v._id.split('/')[0];
      const nodeType = this.mapCollectionToType(collection);

      return {
        id: v._id,
        label: v.name || v.description?.substring(0, 30) || v._key,
        type: nodeType,
        properties: v,
        size: this.calculateNodeSize(v, nodeType),
        color: this.getNodeColor(nodeType),
      };
    });

    const edges: GraphEdge[] = data.edges
      .filter((e: any) => e._from && e._to)
      .map((e: any) => ({
        source: e._from,
        target: e._to,
        label: e.type || '',
        weight: e.strength || 0.5,
        type: e.type || 'unknown',
      }));

    return { nodes, edges };
  }

  /**
   * Generate time series data for metrics over time
   */
  async getMetricTimeSeries(
    metricType?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, TimeSeriesPoint[]>> {
    const query = aql`
      FOR metric IN metrics
        FILTER ${metricType} == null OR metric.type == ${metricType}
        FILTER ${startDate} == null OR metric.timestamp >= ${startDate}
        FILTER ${endDate} == null OR metric.timestamp <= ${endDate}
        SORT metric.timestamp ASC
        RETURN metric
    `;

    const metrics = await this.arango.query<any>(query);

    // Group by metric name
    const grouped: Record<string, TimeSeriesPoint[]> = {};

    for (const metric of metrics) {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }

      grouped[metric.name].push({
        timestamp: metric.timestamp,
        value: metric.value,
        label: metric.name,
        metadata: {
          target: metric.target,
          gap: metric.actualVsTarget,
        },
      });
    }

    return grouped;
  }

  /**
   * Generate heatmap of department synergy scores
   */
  async getDepartmentSynergyHeatmap(): Promise<HeatmapCell[]> {
    const query = aql`
      FOR dept IN departments
        LET employees = (
          FOR emp IN employees
            FILTER emp.department == dept.name
            RETURN emp
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

        RETURN {
          department: dept.name,
          wellness: avgWellness || 0,
          engagement: avgEngagement || 0,
          synergy: dept.synergyIndex || 0
        }
    `;

    const results = await this.arango.query<any>(query);

    const cells: HeatmapCell[] = [];

    for (const dept of results) {
      cells.push({
        row: dept.department,
        column: 'Wellness',
        value: dept.wellness,
        label: `${dept.wellness.toFixed(1)}`,
      });

      cells.push({
        row: dept.department,
        column: 'Engagement',
        value: dept.engagement,
        label: `${dept.engagement.toFixed(1)}`,
      });

      cells.push({
        row: dept.department,
        column: 'Synergy',
        value: dept.synergy,
        label: `${dept.synergy.toFixed(1)}`,
      });
    }

    return cells;
  }

  /**
   * Generate sankey diagram data showing flow from initiatives to outcomes
   */
  async getInitiativeOutcomeFlow(): Promise<{
    nodes: Array<{ id: string; name: string; type: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  }> {
    const query = aql`
      LET initiatives = (FOR i IN initiatives RETURN i)
      LET outcomes = (FOR o IN outcomes RETURN o)

      LET links = (
        FOR cause IN causes
          FILTER cause._from LIKE 'initiatives/%'
          FILTER cause._to LIKE 'outcomes/%'
          RETURN cause
      )

      RETURN {
        initiatives: initiatives,
        outcomes: outcomes,
        links: links
      }
    `;

    const results = await this.arango.query<any>(query);
    const data = results[0];

    const nodes: Array<{ id: string; name: string; type: string }> = [];
    const nodeIndexMap: Map<string, number> = new Map();

    // Add initiative nodes
    data.initiatives.forEach((init: any, idx: number) => {
      nodes.push({
        id: init._id,
        name: init.name,
        type: 'initiative',
      });
      nodeIndexMap.set(init._id, idx);
    });

    // Add outcome nodes
    const initCount = data.initiatives.length;
    data.outcomes.forEach((outcome: any, idx: number) => {
      nodes.push({
        id: outcome._id,
        name: outcome.description.substring(0, 40),
        type: outcome.type,
      });
      nodeIndexMap.set(outcome._id, initCount + idx);
    });

    // Create links
    const links = data.links
      .filter((link: any) => {
        return nodeIndexMap.has(link._from) && nodeIndexMap.has(link._to);
      })
      .map((link: any) => ({
        source: nodeIndexMap.get(link._from)!,
        target: nodeIndexMap.get(link._to)!,
        value: link.strength * 10, // Scale for visibility
      }));

    return { nodes, links };
  }

  /**
   * Generate scatter plot data for intention vs reality
   */
  async getIntentionRealityScatter(): Promise<
    Array<{
      x: number;
      y: number;
      label: string;
      size: number;
      color: string;
    }>
  > {
    const query = aql`
      FOR init IN initiatives
        LET intendedCount = LENGTH(
          FOR v, e IN 1..1 OUTBOUND init causes
            FILTER v.type == 'intended'
            RETURN 1
        )

        LET unintendedCount = LENGTH(
          FOR v, e IN 1..2 OUTBOUND init causes
            FILTER v.type IN ['unintended', 'emergent']
            RETURN 1
        )

        FILTER intendedCount > 0 OR unintendedCount > 0

        RETURN {
          name: init.name,
          intended: intendedCount,
          unintended: unintendedCount,
          status: init.status
        }
    `;

    const results = await this.arango.query<any>(query);

    return results.map((item) => ({
      x: item.intended,
      y: item.unintended,
      label: item.name,
      size: item.intended + item.unintended,
      color: this.getStatusColor(item.status),
    }));
  }

  // Helper methods

  private mapCollectionToType(collection: string): GraphNode['type'] {
    const mapping: Record<string, GraphNode['type']> = {
      initiatives: 'initiative',
      outcomes: 'outcome',
      employees: 'employee',
      departments: 'department',
      metrics: 'metric',
    };
    return mapping[collection] || 'outcome';
  }

  private calculateNodeSize(node: any, type: string): number {
    if (type === 'outcome') {
      return (node.severity || 5) * 2;
    }
    return 10;
  }

  private getNodeColor(type: GraphNode['type']): string {
    const colors: Record<GraphNode['type'], string> = {
      initiative: '#4A90E2',
      outcome: '#E24A4A',
      employee: '#50C878',
      department: '#F5A623',
      metric: '#9013FE',
    };
    return colors[type];
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      planned: '#95A5A6',
      active: '#3498DB',
      completed: '#2ECC71',
      abandoned: '#E74C3C',
    };
    return colors[status] || '#95A5A6';
  }
}

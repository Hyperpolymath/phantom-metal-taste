import { ArangoConnection, aql } from '../db/arango.js';
import { VirtuosoConnection } from '../db/virtuoso.js';
import { Initiative, InitiativeSchema, Outcome, CausalLink } from '../models/types.js';

export class InitiativeService {
  constructor(
    private arango: ArangoConnection,
    private virtuoso: VirtuosoConnection
  ) {}

  async createInitiative(initiative: Omit<Initiative, '_key' | '_id'>): Promise<Initiative> {
    const validated = InitiativeSchema.parse(initiative);
    const db = this.arango.getDatabase();
    const collection = db.collection('initiatives');

    // Store in ArangoDB
    const result = await collection.save(validated);
    const created = { ...validated, _key: result._key, _id: result._id };

    // Sync to Virtuoso semantic layer
    await this.syncToVirtuoso(created);

    return created;
  }

  private async syncToVirtuoso(initiative: Initiative): Promise<void> {
    const iri = `<http://phantom-metal-taste.org/initiative/${initiative._key}>`;
    const triples = `
      ${iri} a pmt:Initiative ;
        rdfs:label "${initiative.name}" ;
        dc:description "${initiative.description.replace(/"/g, '\\"')}" ;
        pmt:startDate "${initiative.startDate}"^^xsd:dateTime ;
        pmt:status "${initiative.status}" ;
        pmt:intends "${initiative.intendedOutcome.replace(/"/g, '\\"')}" .
    `;

    await this.virtuoso.insert(triples);
  }

  async linkCause(
    initiativeId: string,
    outcomeId: string,
    strength: number,
    type: 'direct' | 'indirect' | 'spurious'
  ): Promise<CausalLink> {
    const db = this.arango.getDatabase();
    const collection = db.collection('causes');

    const link: CausalLink = {
      _from: `initiatives/${initiativeId}`,
      _to: `outcomes/${outcomeId}`,
      strength,
      type,
      evidence: [],
      discoveredAt: new Date().toISOString(),
    };

    const result = await collection.save(link);

    // Also record in semantic layer
    await this.virtuoso.insert(`
      <http://phantom-metal-taste.org/initiative/${initiativeId}>
        pmt:causes
        <http://phantom-metal-taste.org/outcome/${outcomeId}> .
    `);

    return { ...link, _key: result._key, _id: result._id };
  }

  async getInitiativeWithOutcomes(initiativeId: string): Promise<{
    initiative: Initiative;
    intended: Outcome[];
    actual: Outcome[];
    gap: number;
  }> {
    const query = aql`
      LET initiative = DOCUMENT('initiatives', ${initiativeId})
      LET outcomes = (
        FOR v, e IN 1..1 OUTBOUND initiative causes
          RETURN {
            outcome: v,
            link: e
          }
      )
      LET intended = (
        FOR o IN outcomes
          FILTER o.outcome.type == 'intended'
          RETURN o.outcome
      )
      LET actual = (
        FOR o IN outcomes
          FILTER o.outcome.type != 'intended'
          RETURN o.outcome
      )
      RETURN {
        initiative: initiative,
        intended: intended,
        actual: actual,
        gap: LENGTH(actual) > 0 ? AVG(
          FOR a IN actual
            RETURN a.severity
        ) : 0
      }
    `;

    const results = await this.arango.query<any>(query);
    return results[0] || null;
  }

  async findUnintendedConsequences(initiativeId: string): Promise<Outcome[]> {
    const query = aql`
      FOR v, e, p IN 1..3 OUTBOUND DOCUMENT('initiatives', ${initiativeId}) causes
        FILTER v._id LIKE 'outcomes/%'
        FILTER v.type == 'unintended'
        RETURN DISTINCT v
    `;

    return this.arango.query<Outcome>(query);
  }

  async querySemanticRelationships(initiativeName: string): Promise<any[]> {
    const sparql = `
      PREFIX pmt: <http://phantom-metal-taste.org/ontology#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

      SELECT ?initiative ?outcome ?gap
      WHERE {
        ?initiative a pmt:Initiative ;
          rdfs:label ?label ;
          pmt:intends ?intended ;
          pmt:causes ?outcome .

        FILTER(CONTAINS(LCASE(?label), LCASE("${initiativeName}")))

        OPTIONAL {
          ?initiative pmt:intentionRealityGap ?gap .
        }
      }
    `;

    return this.virtuoso.query(sparql);
  }
}

import ParsingClient from 'sparql-http-client/ParsingClient.js';
import SimpleClient from 'sparql-http-client/SimpleClient.js';

export interface VirtuosoConfig {
  queryUrl: string;
  updateUrl: string;
  username: string;
  password: string;
  defaultGraph: string;
}

export class VirtuosoConnection {
  private client: ParsingClient;
  private updateClient: SimpleClient;
  private config: VirtuosoConfig;

  constructor(config: VirtuosoConfig) {
    this.config = config;

    // Client for SELECT queries
    this.client = new ParsingClient({
      endpointUrl: config.queryUrl,
      headers: {
        Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
      },
    });

    // Client for UPDATE/INSERT queries
    this.updateClient = new SimpleClient({
      endpointUrl: config.updateUrl,
      headers: {
        Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
      },
    });
  }

  async initialize(): Promise<void> {
    // Initialize base ontology
    await this.loadBaseOntology();
    console.log('✓ Initialized Virtuoso connection and base ontology');
  }

  private async loadBaseOntology(): Promise<void> {
    const baseOntology = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX owl: <http://www.w3.org/2002/07/owl#>
      PREFIX pmt: <http://phantom-metal-taste.org/ontology#>
      PREFIX foaf: <http://xmlns.com/foaf/0.1/>
      PREFIX dc: <http://purl.org/dc/elements/1.1/>

      INSERT DATA {
        GRAPH <${this.config.defaultGraph}> {
          # Core Classes
          pmt:Initiative rdf:type owl:Class ;
            rdfs:label "Corporate Initiative" ;
            rdfs:comment "A deliberate organizational action or program" .

          pmt:Outcome rdf:type owl:Class ;
            rdfs:label "Outcome" ;
            rdfs:comment "The actual result or consequence of an action" .

          pmt:Employee rdf:type owl:Class ;
            rdfs:subClassOf foaf:Person ;
            rdfs:label "Employee" ;
            rdfs:comment "A person employed by the organization" .

          pmt:Metric rdf:type owl:Class ;
            rdfs:label "Metric" ;
            rdfs:comment "A quantifiable measurement of some aspect" .

          pmt:Department rdf:type owl:Class ;
            rdfs:label "Department" ;
            rdfs:comment "An organizational unit or division" .

          # Object Properties
          pmt:causes rdf:type owl:ObjectProperty ;
            rdfs:domain pmt:Initiative ;
            rdfs:range pmt:Outcome ;
            rdfs:label "causes" ;
            rdfs:comment "Indicates a causal relationship" .

          pmt:intends rdf:type owl:ObjectProperty ;
            rdfs:domain pmt:Initiative ;
            rdfs:range pmt:Outcome ;
            rdfs:label "intends" ;
            rdfs:comment "The intended outcome (may differ from actual)" .

          pmt:measures rdf:type owl:ObjectProperty ;
            rdfs:domain pmt:Metric ;
            rdfs:label "measures" ;
            rdfs:comment "What the metric purports to measure" .

          pmt:participatesIn rdf:type owl:ObjectProperty ;
            rdfs:domain pmt:Employee ;
            rdfs:range pmt:Initiative ;
            rdfs:label "participates in" .

          pmt:belongsTo rdf:type owl:ObjectProperty ;
            rdfs:domain pmt:Employee ;
            rdfs:range pmt:Department ;
            rdfs:label "belongs to" .

          # Data Properties
          pmt:intentionRealityGap rdf:type owl:DatatypeProperty ;
            rdfs:domain pmt:Initiative ;
            rdfs:range rdfs:Literal ;
            rdfs:label "intention-reality gap" ;
            rdfs:comment "Quantified difference between intent and outcome" .

          pmt:wellnessScore rdf:type owl:DatatypeProperty ;
            rdfs:domain pmt:Employee ;
            rdfs:range rdfs:Literal ;
            rdfs:label "wellness score" ;
            rdfs:comment "Quantified wellness metric (irony intended)" .

          pmt:engagementLevel rdf:type owl:DatatypeProperty ;
            rdfs:domain pmt:Employee ;
            rdfs:range rdfs:Literal ;
            rdfs:label "engagement level" .
        }
      }
    `;

    await this.update(baseOntology);
  }

  async query(sparqlQuery: string): Promise<any[]> {
    const stream = await this.client.query.select(sparqlQuery);
    const results: any[] = [];

    for await (const row of stream) {
      results.push(row);
    }

    return results;
  }

  async update(sparqlUpdate: string): Promise<void> {
    await this.updateClient.query.update(sparqlUpdate);
  }

  async insert(triples: string): Promise<void> {
    const insertQuery = `
      PREFIX pmt: <http://phantom-metal-taste.org/ontology#>
      INSERT DATA {
        GRAPH <${this.config.defaultGraph}> {
          ${triples}
        }
      }
    `;
    await this.update(insertQuery);
  }

  async constructGraph(constructQuery: string): Promise<any> {
    const stream = await this.client.query.construct(constructQuery);
    const quads: any[] = [];

    for await (const quad of stream) {
      quads.push(quad);
    }

    return quads;
  }
}

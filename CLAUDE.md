# Working with Claude on Phantom Metal Taste

This document provides context and guidelines for AI-assisted development on the Phantom Metal Taste project.

## Project Context

**Phantom Metal Taste** is a multi-model database architecture that explores the gap between corporate intentions and actual outcomes. The project has a distinct philosophical undertone—it's both a technical implementation and a critique of organizational measurement systems.

### Core Philosophy

When working on this project, understand that:

1. **The irony is intentional**: This project measures things that arguably shouldn't be measured in the way corporations measure them
2. **Technical rigor matters**: Despite the critical stance, the implementation should be exemplary
3. **Documentation is commentary**: The documentation style balances technical precision with philosophical observation

## Technical Stack

```
┌─────────────────────────────────────────┐
│     TypeScript/Bun (Orchestration)      │
├─────────────────────────────────────────┤
│  Rust/WASM  │  Julia (Statistical)      │
├─────────────┼───────────────────────────┤
│  ArangoDB   │  Virtuoso (Semantic Web)  │
└─────────────┴───────────────────────────┘
```

### Key Technologies

- **ArangoDB**: Graph database for modeling causal relationships
- **Virtuoso**: RDF/SPARQL triple store for semantic reasoning
- **TypeScript/Bun**: Fast runtime for orchestration layer
- **Rust/WebAssembly**: High-performance core algorithms
- **Julia**: Statistical analysis and data science workloads

## Code Organization

```
phantom-metal-taste/
├── src/
│   ├── orchestrator/    # TypeScript coordination layer
│   ├── core/            # Rust/WASM modules
│   ├── analytics/       # Julia statistical modules
│   └── ontologies/      # Semantic web ontologies
├── case-studies/
│   └── synapcor/        # Reference implementation
├── docs/
│   ├── architecture/    # TOGAF documentation
│   ├── diagrams/        # UML, DFD, ERD
│   └── ontologies/      # ODM specifications
└── tests/
```

## Development Guidelines

### 1. Multi-Model Consistency

When modifying data structures, ensure consistency across:
- ArangoDB graph schemas
- Virtuoso RDF ontologies
- TypeScript interfaces
- Rust structs

### 2. Semantic Precision

This project uses formal ontologies. When adding new concepts:
- Define them in the appropriate OWL/RDF ontology first
- Ensure proper subsumption relationships
- Document inference rules clearly
- Use standard vocabularies (FOAF, Dublin Core, etc.) where applicable

### 3. Code Style

**TypeScript:**
- Use Bun-specific APIs where performance matters
- Prefer functional patterns for data transformations
- Type everything; avoid `any`

**Rust:**
- Target `wasm32-unknown-unknown`
- Keep allocations minimal (runs in browser)
- Document all public APIs with examples

**Julia:**
- Use type annotations for performance-critical paths
- Leverage multiple dispatch appropriately
- Include benchmark comparisons in comments

### 4. Testing Philosophy

Tests should:
- Validate the model, not just the implementation
- Include edge cases that reveal modeling assumptions
- Use the SynapCor case study as integration test data

### 5. Documentation Tone

Maintain the project's distinctive voice:
- Be technically precise
- Acknowledge the inherent contradictions
- Use philosophical quotes sparingly but meaningfully
- Let the irony emerge from juxtaposition, not explanation

## Common Tasks

### Adding a New Organizational Metric

1. Define the ontological concept in `src/ontologies/`
2. Create the graph schema in ArangoDB
3. Implement measurement logic in appropriate language
4. Add to the SynapCor case study
5. Update documentation with commentary on what's being measured

### Modifying the Graph Schema

1. Update ArangoDB collection definitions
2. Modify Virtuoso RDF mappings
3. Update TypeScript interfaces
4. Regenerate Rust bindings
5. Run migration scripts (never drop data)

### Performance Optimization

Priority order:
1. Rust/WASM for computational bottlenecks
2. Julia for statistical heavy lifting
3. Database query optimization
4. TypeScript optimization (last resort)

## Integration Points

### Database Connections

- **ArangoDB**: Uses Foxx microservices for custom logic
- **Virtuoso**: SPARQL endpoint accessible via HTTP
- Both require Docker containers running locally

### WASM Modules

Rust code compiles to WASM and loads via:
```typescript
import { analyze } from './core/wasm/analyzer.wasm';
```

Build WASM modules with:
```bash
cd src/core && cargo build --target wasm32-unknown-unknown --release
```

### Julia Integration

Julia modules called via Bun subprocess:
```typescript
const result = await julia('src/analytics/impact.jl', args);
```

## Important Context

### The SynapCor Case Study

SynapCor is a fictional company with a data-driven "wellness" program called the Synergy Matrix. It serves as:
- Reference implementation
- Integration test fixture
- Documentation through narrative
- Cautionary tale

When adding features, consider: "How would SynapCor misuse this?"

### Architectural Decisions

Key choices documented in `docs/architecture/`:
- Why multi-model? (Different paradigms reveal different truths)
- Why semantic web? (Formal logic for informal systems)
- Why graph databases? (Causality is relational)

Review these before proposing architectural changes.

## Testing & Validation

### Running Tests

```bash
# Full test suite
bun test

# Rust unit tests
cd src/core && cargo test

# Julia tests
julia --project=src/analytics -e 'using Pkg; Pkg.test()'

# Integration tests (requires databases)
docker-compose up -d
bun test:integration
```

### Validation Checklist

Before committing:
- [ ] All tests pass
- [ ] Types checked (`bun run typecheck`)
- [ ] WASM modules rebuilt if Rust changed
- [ ] Ontologies validate against OWL DL
- [ ] Documentation reflects changes
- [ ] SynapCor case study still works

## Deployment

This is an experimental project. Deployment is:
- Docker Compose for local development
- Kubernetes manifests in `k8s/` (theoretical)
- No production environment (what would that even mean?)

## Common Pitfalls

1. **Forgetting the graph**: Changes to TypeScript types often need graph schema updates
2. **Ontology drift**: RDF and code can diverge; validate regularly
3. **WASM memory**: Limited heap in browser context
4. **Julia startup time**: Cache compiled modules for development
5. **Semantic query performance**: SPARQL can be slow; use ArangoDB for hot paths

## Questions to Ask

When uncertain about design decisions:

- Does this capture what's actually happening or what's supposed to happen?
- How would this metric be gamed?
- What does this measurement obscure?
- Is the added complexity worth the analytical insight?

## Resources

- [ArangoDB AQL Documentation](https://www.arangodb.com/docs/stable/aql/)
- [Virtuoso SPARQL Reference](http://docs.openlinksw.com/virtuoso/)
- [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [TOGAF Framework](https://www.opengroup.org/togaf)

## Getting Help

For technical questions:
- Check `docs/architecture/` for design rationale
- Review the SynapCor implementation
- Search issues for similar challenges

For philosophical questions:
- That's part of the journey

---

*"The best way to understand a system is to build a model of it. The best way to critique a system is to build a rigorous model of it."*

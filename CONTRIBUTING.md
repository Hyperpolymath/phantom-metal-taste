# Contributing to Phantom Metal Taste

Thank you for your interest in contributing to this project. Given the nature of this system - a rigorous critique of measurement theater wrapped in enterprise-grade architecture - contributions should maintain both technical excellence and philosophical coherence.

## Code of Conduct

Be respectful, thoughtful, and open to critique. This project is itself a critique, so meta-critique is expected and welcome.

## How to Contribute

### Reporting Issues

When reporting bugs or suggesting features:

1. **Be specific**: Include reproduction steps, expected vs. actual behavior
2. **Provide context**: What were you trying to measure? What gap did you discover?
3. **Question assumptions**: Does this bug reveal a flaw in the model itself?

### Code Contributions

#### Before You Start

1. Read `CLAUDE.md` for development guidelines
2. Review `docs/architecture/ARCHITECTURE.md`
3. Understand the SynapCor case study
4. Ask yourself: "Am I adding value or adding metric theater?"

#### Development Process

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/phantom-metal-taste.git
   cd phantom-metal-taste
   git checkout -b feature/your-feature-name
   ```

2. **Set up your environment**
   ```bash
   bun install
   docker-compose up -d
   bun run dev
   ```

3. **Make your changes**
   - Follow existing code style
   - Maintain the ironic but rigorous tone in comments and docs
   - Add tests for new functionality
   - Update relevant documentation

4. **Test thoroughly**
   ```bash
   bun test
   bun run typecheck
   cd src/core && cargo test
   cd src/analytics && julia --project=. -e 'using Pkg; Pkg.test()'
   ```

5. **Commit with meaningful messages**
   ```bash
   git commit -m "Add gaming detection for time-series metrics

   Implements statistical variance analysis to detect suspiciously
   consistent metric patterns that suggest gaming behavior.

   Includes:
   - Coefficient of variation analysis
   - End-of-period spike detection
   - Tests with known gaming patterns"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

#### TypeScript

- Use functional patterns where appropriate
- Type everything; avoid `any`
- Prefer `const` over `let`
- Use Zod for runtime validation
- Comment the "why," not the "what"

```typescript
// Good
const gapScore = calculateGap(intended, actual);
// The gap represents organizational self-deception

// Avoid
const gap = calculateGap(i, a); // calculate gap
```

#### Rust

- Follow Rust conventions
- Document public APIs
- Keep WASM binary size small
- Add benchmarks for performance-critical code

```rust
/// Calculate geometric mean of edge strengths.
///
/// Uses geometric mean because a causal chain is only as strong
/// as its weakest link - a principle borrowed from reliability theory.
pub fn calculate_path_strength(strengths: &[f64]) -> f64 {
    // implementation
}
```

#### Julia

- Use type annotations for performance-critical paths
- Leverage multiple dispatch appropriately
- Include docstrings
- Add examples in docstrings

```julia
"""
    detect_metric_gaming(values::Vector{Float64})

Detect gaming patterns in metric time series.

# Examples
```jldoctest
julia> values = [50.0, 51.0, 95.0, 96.0, 95.0];  # Suspicious jump
julia> result = detect_metric_gaming(values);
julia> result["gaming_probability"] > 0.5
true
```
"""
function detect_metric_gaming(values::Vector{Float64})
    # implementation
end
```

### Testing Requirements

All contributions must include tests:

1. **Unit tests** for individual functions
2. **Integration tests** for service interactions
3. **Edge cases** that reveal modeling assumptions

Example test philosophy:
```typescript
it('should detect metric theater when metrics are never used', async () => {
  // This test validates our model, not just our implementation.
  // If metrics are collected but never linked to decisions,
  // we should detect that as "theater."
  //
  // The test itself is a statement about what we believe
  // constitutes meaningful measurement.
});
```

### Documentation Standards

When adding features, update:

1. **API documentation** - what the endpoint does
2. **Architecture docs** - if it changes system design
3. **CLAUDE.md** - if it affects AI-assisted development
4. **Case study** - add examples using SynapCor if relevant

Maintain the project's voice:
- Technical precision with philosophical awareness
- Acknowledge contradictions
- Let irony emerge from juxtaposition, not explanation

### What We're Looking For

**High-value contributions:**
- Improved statistical methods for gaming detection
- Better causal inference algorithms
- Novel visualizations that reveal hidden patterns
- Case studies from other domains
- Performance optimizations
- Bug fixes with reproduction cases

**Lower-priority:**
- Cosmetic changes
- Adding complexity without clear benefit
- Metrics for the sake of metrics (meta-theater)

### The Contribution Paradox

This project measures organizational metric theater. By contributing metrics to measure contributors (PRs merged, lines changed, issues closed), we risk becoming what we critique.

Therefore:
- We don't track contributor metrics
- Quality over quantity
- Thoughtful objections are valued as much as code
- It's okay to propose that something should be removed

## Review Process

1. **Technical review**: Does it work? Is it tested?
2. **Architectural review**: Does it fit the system design?
3. **Philosophical review**: Does it maintain conceptual coherence?

All three must pass.

## Community

- **Discussions**: Use GitHub Discussions for questions, ideas, proposals
- **Issues**: For bugs and concrete feature requests
- **PRs**: For code contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you're unsure whether a contribution fits, open an issue and ask. We'd rather discuss early than reject late.

## Final Note

The best contributions to this project are those that help reveal truth while acknowledging the limits of measurement. If your PR makes the system more rigorous, more honest, or more useful for understanding the gap between intentions and outcomes, we want it.

If it just adds more metrics... well, that's very on-brand actually. But let's be intentional about it.

---

*"The best way to improve a system that critiques systems is to critique it rigorously."*

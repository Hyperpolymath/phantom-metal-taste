# SynapCor Case Study

## Overview

SynapCor is a fictional mid-sized technology company that has implemented a comprehensive data-driven "employee wellness and engagement" program called the **Synergy Matrix™**.

This case study serves as:
1. A reference implementation for Phantom Metal Taste
2. An integration test fixture
3. A demonstration of the gap between institutional intent and lived reality
4. A cautionary tale about measurement theater

## Company Background

**SynapCor Technologies, Inc.**
- Founded: 2015
- Employees: 487
- Industry: Enterprise SaaS
- Headquarters: Austin, TX
- Annual Revenue: $73M
- Recent Initiatives: "Synergize 2024" wellness program

## The Synergy Matrix™

In Q1 2024, SynapCor's leadership launched the Synergy Matrix, a comprehensive program to:

**Stated Objectives:**
- "Holistically optimize employee wellness and engagement"
- "Create a data-driven culture of accountability and growth"
- "Align individual goals with organizational outcomes"
- "Measure what matters"

**Implementation:**
- Daily wellness check-ins via Slack bot
- Bi-weekly "synergy sessions" (mandatory)
- Continuous productivity monitoring
- Quarterly "alignment assessments"
- Real-time engagement scoring
- Gamified wellness challenges

## Key Metrics Collected

### Wellness Score (0-100)
Composite metric combining:
- Self-reported mood (40%)
- Slack activity patterns (20%)
- Meeting attendance (15%)
- Wellness challenge participation (25%)

### Engagement Level (0-100)
Derived from:
- Code commits (for engineers)
- Slack messages sent
- Meeting participation
- "Voluntary" after-hours activity

### Synergy Index (Department-level, 0-100)
Calculated as:
- Department wellness average (33%)
- Cross-team collaboration (33%)
- Initiative completion rate (34%)

## Notable Initiatives and Outcomes

### Initiative 1: "Wellness Wednesday"
**Intended Outcome:** Improve employee wellness through mandatory meditation sessions

**Actual Outcomes:**
- 23% decrease in Wednesday afternoon productivity
- Creation of "meditation theater" behavior
- 47% of employees reported increased stress about "performing relaxation"
- Emergence of black market for "attended meditation" credits

**Intention-Reality Gap Score:** 78/100

### Initiative 2: "Radical Transparency Dashboard"
**Intended Outcome:** Foster accountability through real-time public metrics

**Actual Outcomes:**
- Employees began gaming metrics (late-night empty commits, automated Slack messages)
- 31% decrease in genuine collaboration (focus shifted to individual scores)
- Formation of informal "metric optimization working groups"
- Three employees quit, citing "surveillance culture"
- Dashboard viewing became a competitive sport

**Intention-Reality Gap Score:** 91/100

### Initiative 3: "Synergy Champions Program"
**Intended Outcome:** Recognize and reward high-engagement employees

**Actual Outcomes:**
- Created two-tier culture ("Synergized" vs. "Siloed")
- Champions spent more time promoting program than working
- Non-champions felt demoralized
- Actual productivity of champions: -12% vs. baseline

**Intention-Reality Gap Score:** 83/100

## Organizational Structure

```
CEO: Jennifer Harmon
├── VP Engineering: David Chen (Dept: Engineering, Synergy: 73)
│   ├── Platform Team (12 engineers, Synergy: 68)
│   ├── Product Team (15 engineers, Synergy: 71)
│   └── Infrastructure (8 engineers, Synergy: 79) [Highest scores - all remote]
├── VP Product: Sarah Martinez (Dept: Product, Synergy: 81)
│   ├── Design (6 designers, Synergy: 84)
│   └── Product Management (9 PMs, Synergy: 77)
├── VP People Ops: Michael Thompson (Dept: HR, Synergy: 97) [Designers of the system]
│   └── People Team (5 people, Synergy: 95)
└── CFO: Robert Kim (Dept: Finance, Synergy: 44) [Notably low - why?]
    └── Finance Team (4 people, Synergy: 47)
```

**Observation:** The department that created the Synergy Matrix has the highest synergy score. Finance, which questioned the program's ROI, has the lowest. Causation or correlation?

## Notable Employees

### The Synergized
- **Alex Rivera** (Platform Engineer): Wellness: 94, Engagement: 97
  - Reality: Burned out, interviewing elsewhere
  - Mastered the art of "visible work"

- **Jessica Wu** (Product Designer): Wellness: 91, Engagement: 93
  - Reality: Genuinely enjoys meditation, naturally collaborative
  - Unaware she's an outlier

### The Siloed
- **Marcus Thompson** (Senior Engineer): Wellness: 52, Engagement: 48
  - Reality: Shipped 3 major features in Q1, mentored 4 juniors
  - Works heads-down, doesn't perform engagement

- **Lisa Rodriguez** (PM): Wellness: 47, Engagement: 51
  - Reality: Managing family crisis, doing excellent work in fewer hours
  - Part-time hours penalized by always-on metrics

## Data Model

This case study populates Phantom Metal Taste with:
- 487 employee records
- 12 department entries
- 23 initiatives (Synergy Matrix and sub-programs)
- 147 recorded outcomes (intended and unintended)
- 3,847 metric measurements over 6 months
- 891 causal links (discovered through analysis)

## Key Insights Revealed by Analysis

1. **Metric Gaming is Rational**: When 30% of review scores depend on metrics, optimizing metrics becomes more valuable than optimizing work

2. **Unintended Consequences Outnumber Intended**: For every stated goal achieved, 2.3 unintended consequences emerged

3. **The Hawthorne Effect is Real**: Being measured changes behavior more than the intervention itself

4. **Synergy Theater**: High synergy scores correlate with *lower* actual productivity (r = -0.43)

5. **The Finance Anomaly**: The only department that questioned the program has low scores but high performance

## Using This Case Study

Load the SynapCor data:
```bash
bun run case-studies/synapcor/load-data.ts
```

Run analysis:
```bash
curl http://localhost:3000/api/analytics/gameable-metrics
curl http://localhost:3000/api/analytics/metric-theater
curl http://localhost:3000/api/analytics/department/engineering/synergy
```

Explore causal paths:
```bash
# Trace from "Wellness Wednesday" to employee burnout
curl http://localhost:3000/api/analytics/path/initiatives/wellness-wednesday/outcomes/increased-burnout
```

## Philosophical Questions

- If a metric is gamed, does it still measure anything?
- When does wellness monitoring become wellness theater?
- Can you measure engagement without destroying it?
- What's the difference between accountability and surveillance?

## References

None. This is fiction. Any resemblance to real companies is coincidental.

(But if it feels familiar, that might be the point.)

---

*"We measured everything. We understood nothing."* — Anonymous SynapCor Employee

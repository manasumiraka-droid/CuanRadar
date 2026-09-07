# ADR 0001 — Provider and control strategy for Public Beta

- Status: Accepted for beta
- Date: 2026-09-07

## Context

CuanRadar needs fresh reward discovery without running search and AI for every user request. AI output is untrusted candidate data and provider prices/availability can change.

## Decision

- Quick Scan is database/cache-only.
- Brave Search is the primary Deep Scan search provider; Serper is a bounded fallback/manual second check.
- `deepseek-v4-flash` is the beta extraction model in non-thinking structured-output mode.
- Reward math and CuanScore remain deterministic code.
- Shared cache, deterministic pre-filtering, schema validation, deduplication, human approval, and server-side budget controls are mandatory.
- Provider identifiers, request contracts, prices, and terms are reverified before staging/production rollout.

## Consequences

This reduces variable cost and prevents unreviewed AI data from becoming public. It adds an editor workflow, evaluation dataset, operational controls, and provider smoke tests to the Public Beta critical path.


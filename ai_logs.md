# AI Development Log

## Original Request

The project brief asked for a complete responsive helpdesk application called QueuePilot. The important requirements were a backend-controlled SLA queue, persistent storage, realistic seed data, search, combined filters, assignment, pagination, ticket details, status changes, and an explainable `Why first?` feature.

The request also required the application to be genuinely runnable rather than a static mockup, with tests for the queue ordering behavior and verification of the frontend, backend, and database working together.

## Development Steps

### Repository inspection

The workspace initially contained only a placeholder README, so there was no existing stack or design system to reuse.

### Foundation

A Node.js project was created with React, Vite, Express, and SQLite. The database schema includes agents, tickets, and activity history. Runtime database files and generated build output are excluded through `.gitignore`.

### Queue implementation

The reusable `compareTickets` function was implemented first. It compares overdue state, priority, SLA deadline, and creation time. Tests cover overdue dominance, lower-priority overdue tickets beating non-overdue critical tickets, priority ordering, deadline ordering, and creation-time tie-breaking.

### API and data

REST endpoints were added for ticket listing, ticket details, ticket creation, updates, dashboard statistics, and agents. The list endpoint performs filtering, sorting, and pagination on the backend. Seed data demonstrates critical overdue tickets, due-soon tickets, routine requests, unassigned work, repeated customers, and resolved history.

### Frontend

The React dashboard was connected to the live API. It includes interactive dashboard metrics, search, status and priority filters, assignment filters, overdue and due-soon toggles, pagination, a ticket detail drawer, activity history, assignment/status/priority updates, a create-ticket form, and responsive layouts.

### Archive issue and fix

The resolved archive initially appeared empty from the UI even though `GET /api/tickets?status=Resolved` returned records. The problem was traced to the generic frontend shortcut state update. The handler was changed to explicitly preserve the selected `Resolved` status while clearing unrelated filters. The fix was validated against the API and pushed in commit `a7ee588`.

## Validation

The following checks were run during development:

```bash
npm test
npm run build
```

The queue tests passed, the production bundle built successfully, and the live API smoke tests confirmed pagination, active-queue exclusion of resolved tickets, and resolved archive results.

## Current Result

QueuePilot is a runnable local full-stack helpdesk application with a persistent SQLite database, backend-owned queue ordering, responsive UI, seeded demonstration data, and documentation for setup and behavior.

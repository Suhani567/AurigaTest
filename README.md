# QueuePilot

QueuePilot is a responsive full-stack helpdesk application designed to help a small IT team work the most important ticket first. The central feature is a backend-driven Smart Queue that ranks tickets by SLA risk instead of relying on a manually assigned sort order.

## What It Includes

- Persistent SQLite database with realistic seeded helpdesk tickets
- Express REST API and React/Vite frontend
- Automatic SLA deadline and overdue calculations using current server time
- Queue ordering by overdue state, priority, SLA deadline, and ticket age
- Server-side search, filtering, and pagination
- Status changes, priority changes, assignment, resolution, and ticket creation
- Ticket activity history and a responsive detail drawer
- Expandable “Why first?” explanations for every queue item
- Dashboard shortcuts for open, overdue, due-soon, assigned, and resolved tickets
- Loading, empty, error, and mutation feedback states

## Technology

- React 19
- Vite
- Node.js
- Express
- SQLite through `better-sqlite3`
- Node’s built-in test runner

## Running Locally

Install dependencies:

```bash
npm install
```

Start the frontend and API in development mode:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on port `3001` and creates `data/queuepilot.db` automatically on first start.

For a production-style run:

```bash
npm run build
npm start
```

Then open [http://localhost:3001](http://localhost:3001).

## Queue Ordering

The backend excludes resolved tickets from the active queue and applies these deterministic rules:

1. Overdue tickets come before non-overdue tickets.
2. Within the same overdue state, higher priority comes first: Critical, High, Medium, Low.
3. Within the same priority, the closest SLA deadline comes first.
4. If the deadline is equal, the oldest ticket comes first.

SLA targets are:

| Priority | SLA target |
| --- | ---: |
| Critical | 1 hour |
| High | 2 hours |
| Medium | 8 hours |
| Low | 24 hours |

The reusable comparator is exported as `compareTickets` from [server.js](server.js). Overdue status is calculated from the ticket deadline and the current time, so the queue changes naturally as time passes.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/tickets` | Filtered, sorted, paginated active or resolved tickets |
| GET | `/api/tickets/:id` | Ticket details and activity history |
| POST | `/api/tickets` | Create a ticket |
| PATCH | `/api/tickets/:id` | Update status, priority, or assignee |
| GET | `/api/dashboard/stats` | Dashboard counts |
| GET | `/api/agents` | Available helpdesk agents |

`GET /api/tickets` accepts `page`, `limit`, `search`, `status`, `priority`, `assignee`, `overdue`, and `dueSoon` query parameters. Filtering, ordering, and pagination happen on the server before the response is returned.

## Validation

```bash
npm test
npm run build
```

The queue tests cover overdue dominance, priority ordering, deadline ordering, and creation-time tie-breaking. The application was also smoke-tested against the running API to verify pagination and active-queue exclusion of resolved tickets.

## Implementation Notes

- The database is seeded with 18 realistic tickets, including critical overdue tickets, due-soon tickets, low-priority requests, unassigned tickets, resolved tickets, and repeated customers.
- The API defaults to 20 results per page and supports limits from 1 to 100. The dashboard requests 8 results per page so pagination is easy to demonstrate with the seeded data.
- Ticket creation, reading, updates, assignment, resolution, search, filtering, and pagination are implemented. A delete endpoint is not currently included because the interface does not expose destructive ticket deletion.
- Invalid ticket IDs return `404`, invalid status or priority values return `400`, and create requests validate required customer, issue, description, and priority fields.
- The dashboard refreshes queue and SLA information every minute. The server recalculates overdue and due-soon state from the current time on every request.
- The `screenshots/` directory is currently empty; screenshots can be captured from the running app at `http://localhost:5173`.

## Demo Flow

1. Start the app with `npm run dev`.
2. Open the Smart Queue and inspect the overdue ticket at the top.
3. Expand `Why first?` to show the ranking explanation.
4. Use the Overdue, Due soon, priority, status, assignee, and search controls together.
5. Open a ticket to change its status, priority, or assignment and observe the queue update.
6. Use `+ New ticket` to create a ticket with a calculated SLA deadline.
7. Use the dashboard cards as shortcuts to filtered queue views.

## Project Structure

```text
server.js       Express API, SQLite schema, seed data, SLA logic
queue.test.js   Queue ordering tests
src/main.jsx    React dashboard, queue, filters, detail drawer, create form
src/styles.css  Responsive visual system and mobile layouts
data/           Local SQLite database created at runtime
```
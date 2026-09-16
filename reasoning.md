# QueuePilot Reasoning

## Problem Understanding

The main challenge is not displaying tickets; it is deciding which ticket should be handled first. The queue must account for SLA risk, urgency, and age while remaining deterministic and explainable to a helpdesk agent.

## Architecture

The repository started without an existing application stack, so QueuePilot uses a compact local full-stack architecture:

- React and Vite provide the responsive dashboard.
- Express provides the REST API.
- SQLite through `better-sqlite3` provides persistent local storage.
- The Node test runner validates the queue comparator.

This approach keeps the application easy to install and demonstrate while still separating UI, API, database, and queue responsibilities.

## Queue Ordering Decision

The backend excludes resolved tickets from the default active queue. It then compares tickets using these rules:

1. Overdue tickets always come first.
2. Higher priority comes first: Critical, High, Medium, then Low.
3. Tickets with the nearest SLA deadline come first.
4. Older tickets win a final tie.

The comparator is exported as `compareTickets(a, b, currentTime)` from `server.js`. Passing the current time into the function keeps it independently testable and avoids hardcoded urgency labels.

SLA targets are one hour for Critical, two hours for High, eight hours for Medium, and 24 hours for Low. The API recalculates overdue and due-soon state on every request, while the dashboard refreshes once per minute.

## Backend Decisions

Filtering and pagination happen on the server. This avoids downloading a large ticket collection into React and ensures that search, status, priority, assignment, overdue, due-soon, and archive filters work together consistently.

The database contains agents, tickets, and activity history. Indexes cover status, priority, assignee, creation time, and SLA deadline. Seed data includes urgent incidents, routine requests, unassigned tickets, repeated customers, and resolved tickets for an interview-ready demonstration.

## Frontend Decisions

The UI is designed as an operational dashboard rather than a marketing page:

- Dashboard cards act as useful filter shortcuts.
- The first ticket receives a restrained urgency treatment.
- The `Why first?` panel explains the ranking decision.
- The detail drawer keeps the queue visible while allowing updates.
- Mobile styles collapse the sidebar, controls, and ticket rows for narrow screens.
- Loading, error, empty, and mutation states make the app usable during real API activity.

## Resolved Archive Fix

The resolved archive API already returned resolved tickets, but the frontend shortcut used a generic filter reset that could overwrite the selected status. The shortcut state update was made explicit so selecting `Resolved archive` sets `status: 'Resolved'` while clearing unrelated active-queue filters. The resolved status is also available in the status selector.

## Tradeoffs

SQLite is suitable for a local placement-round demonstration but would normally be replaced with PostgreSQL for a multi-instance production deployment. Authentication, permissions, file attachments, and destructive deletion are outside the current implementation scope.

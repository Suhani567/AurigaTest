# AI Development Log

## The Original Prompt

The following is the detailed prompt used to request the application.

### Problem Statement

The helpdesk is drowning.

Priya runs a two-person IT helpdesk and the queue never stops. Some tickets are emergencies, such as a laptop failing before a client demo; others are routine requests, such as asking for a larger monitor. Each ticket has a priority and an agreed response time. Priya wants to always pick the most pressing ticket next, with anything past its promised time jumping to the front.

She needs quick answers to questions such as:

- What is overdue?
- What is assigned to me?
- Can I find this customer's ticket?

The list is large, so it must support pagination. The application should make sure the right ticket is always on top. The ordering rule is the heart of the system, and the implementation should work for any helpdesk, not only Priya's.

### Objective

Build a polished full-stack helpdesk application called **QueuePilot**. It must be a complete, working, responsive application rather than a static frontend or mockup.

The requested capabilities were:

- Working React frontend
- Working backend and REST API
- Persistent database
- CRUD operations
- Automatic ticket prioritization
- Server-side pagination
- Combined filtering
- Ticket assignment
- Customer and ticket search
- Responsive UI
- Loading, error, and empty states
- Realistic seeded data suitable for an interview demonstration

### Queue Ordering Requirements

The queue ordering algorithm is the central feature. It must be deterministic and reusable as a backend function or service that can be tested independently.

Tickets must be ordered by:

1. Overdue status: tickets past their promised response time always come before non-overdue tickets.
2. Urgency or priority: among tickets with the same overdue state, higher priority comes first.
3. Time remaining or SLA deadline: tickets with less time remaining come before tickets with more time remaining.
4. Created time: older tickets win as the final tie-breaker.

The minimum priorities are Critical, High, Medium, and Low. Suggested SLA targets are one hour for Critical, two hours for High, eight hours for Medium, and 24 hours for Low.

The system must calculate overdue state from `createdAt + SLA duration < current time`. It must not simply sort by a manually assigned priority field. Every queue item should explain its position, for example:

- `OVERDUE - Critical - 42 min late`
- `Due in 18 min - High`

The top ticket should visually communicate why it is currently first.

### Core Features

The dashboard should show:

- Total open tickets
- Overdue tickets
- Due-soon tickets
- Tickets assigned to the current agent
- Tickets resolved today
- The main Smart Queue ordered by the backend algorithm

Each queue item should show its ticket ID, customer, issue title, short description, priority, status, assignee, creation time, SLA deadline, time remaining or overdue duration, and a clear urgency indicator.

Ticket statuses should include Open, In Progress, Waiting, and Resolved.

The system should support Priya and Arjun as helpdesk agents, along with unassigned tickets. Users should be able to assign, reassign, and filter by current agent, Priya, Arjun, or unassigned.

Filters should work together for status, priority, assignee, overdue, and due soon. Search should support customer name, ticket ID, and issue title. Pagination should be real server-side pagination with a default page size of 20, current page, total count, previous and next controls, and page numbers where appropriate.

### Ticket Details and Why First

Selecting a ticket should open a detail view containing the full description, customer information, priority, status, assignee, creation time, SLA deadline, current SLA state, and activity history.

Users should be able to change status, priority, and assignment, and resolve a ticket. Every update should persist and immediately affect the queue.

Every queue item should include an expandable **Why First?** explanation. Examples include:

> Why first?
> - Overdue
> - Critical priority
> - 32 minutes past SLA
> - This ticket is currently ranked #1.

For a non-overdue ticket, the explanation might say:

> Why first?
> - High priority
> - SLA expires in 24 minutes
> - Earlier deadline than 14 other open tickets

### Technical and Backend Requirements

The preferred stack was React, Vite, Tailwind CSS, optional React Router, Node.js, Express, SQLite with Prisma, and REST APIs. If an existing repository already had a stack, it should be inspected and reused where practical.

The requested API surface included:

- `GET /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PATCH /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `GET /api/dashboard/stats`

`GET /api/tickets` should support `page`, `limit`, `search`, `status`, `priority`, `assignee`, `overdue`, and `dueSoon`. Filtering, sorting, and pagination must happen on the backend rather than by downloading a large collection into React.

The database should include ticket fields such as `id`, `ticketNumber`, `customerName`, `customerEmail`, `title`, `description`, `priority`, `status`, `assigneeId`, `createdAt`, `updatedAt`, `slaDeadline`, and `resolvedAt`. It should include an agent or user model, useful indexes, and at least 30-50 realistic tickets with varied priorities, statuses, assignees, deadlines, overdue states, customers, and repeated customers.

The seed data should include a critical overdue ticket, a high ticket due soon, a low-priority non-overdue request, an unassigned ticket, a resolved ticket, and multiple tickets for one customer. Example issues included a laptop that would not boot before a client demo, a VPN disconnect during a customer call, a larger monitor request, production dashboard access, a password reset, stopped email sync, an unavailable printer, and a software installation request.

### UI, Responsiveness, and Quality

The application should look like a polished modern SaaS product: clean, professional, minimal, information-dense, well-spaced, accessible, and responsive. The layout should adapt from a desktop sidebar and dashboard to tablet layouts and stacked mobile cards. It should work at 1440px, 1024px, 768px, and 390px without horizontal overflow.

Overdue tickets should be immediately noticeable, due-soon tickets should be clear, and normal tickets should remain calm. The design should avoid excessive gradients, oversized hero sections, and decorative elements that reduce usability.

The application should include loading skeletons or spinners, API error messages, empty queue and empty search states, failed mutation feedback, confirmation before destructive actions, and no console errors.

Dashboard cards must be functional shortcuts: Open Tickets, Overdue, Due Soon, My Tickets, and Resolved should navigate to or apply the corresponding queue filters.

SLA calculations must use the actual current server or application time rather than hardcoded labels. The queue should refresh periodically so tickets change state as deadlines pass.

Backend inputs must be validated, invalid IDs must return appropriate errors, API status codes must be meaningful, secrets must not be hardcoded, and API/database logic must remain separate from UI logic.

### Testing and Delivery

Before writing code, the repository should be inspected and its existing structure and stack considered. The application should then be implemented end to end, including frontend, backend, database, migrations or setup, seed data, and integration.

The queue tests should cover:

1. Overdue Critical versus non-overdue Critical: overdue first.
2. Overdue Low versus non-overdue Critical: overdue first because overdue status dominates.
3. Two overdue tickets: higher priority first.
4. Same priority: earlier SLA deadline first.
5. Same deadline: older ticket first.
6. Resolved tickets excluded from the active queue.
7. Correct results when filters and pagination are combined.

The final deliverable should include a concise report covering what was built, the tech stack, the queue algorithm, API endpoints, database structure, run instructions, test results, and remaining limitations. The highest priority is correctness of queue ordering and backend logic over decorative UI.

## How We Approached It

### 1. Checked the repository first

The repository only had a basic README file. There was no existing frontend or backend to continue from, so we started the project from scratch.

### 2. Chose a simple project setup

We used:

- React and Vite for the frontend.
- Express for the backend API.
- SQLite for the database.
- `better-sqlite3` to work with SQLite.

This made the project easy to install and run locally.

### 3. Built the queue logic first

The most important part of the prompt was the queue order, so we created the `compareTickets` function before finishing the UI.

The order is:

1. Overdue tickets first.
2. Higher priority next.
3. Earlier SLA deadline next.
4. Older ticket last as the final tie-breaker.

This means an overdue Low ticket can appear before a Critical ticket that is not overdue. The function uses the current time, so the result changes as tickets pass their deadlines.

### 4. Added the database and API

The database stores agents, tickets, and ticket activity. We added Priya and Arjun as agents and seeded realistic helpdesk tickets.

The API supports ticket listing, ticket details, ticket creation, updates, dashboard statistics, and agent information. Filtering, searching, sorting, and pagination happen on the backend instead of only in the browser.

### 5. Built the frontend around the API

The dashboard includes:

- Open, overdue, due-soon, assigned, and resolved counts.
- The Smart Queue.
- Search and combined filters.
- Assignment and status controls.
- Ticket details in a side drawer.
- Activity history.
- The `Why first?` explanation.
- A form for creating new tickets.
- Responsive layouts for smaller screens.

### 6. Made the interface easier to understand

The first ticket is visually highlighted so the user can quickly see why it needs attention. The `Why first?` panel shows the ticket priority, overdue state, SLA timing, and queue rank.

The dashboard cards are also clickable. They work as shortcuts instead of being decorative numbers.

## Later Prompts and Changes

After the application was built, I asked for documentation files. The request was to keep the project information simple and explain the approach clearly.

I also asked to keep only the main README for a while, and later asked to add `reasoning.md` and `ai_logs.md` again. These files were created to explain the project in plain language.

Then I reported that clicking **Resolved archive** showed nothing. We checked the problem step by step:

1. The backend was checked first.
2. The API was returning the resolved tickets correctly.
3. The problem was found in the frontend shortcut state update.
4. The archive action was changed to set `status: 'Resolved'` directly.
5. The fix was tested and pushed to GitHub in commit `a7ee588`.

## Checks We Ran

These commands were used to check the project:

```bash
npm test
npm run build
```

The queue tests passed. The frontend production build passed. The API was also checked directly to confirm that:

- Pagination works.
- Resolved tickets do not appear in the normal active queue.
- Resolved tickets do appear in the archive.
- The overdue ticket is placed at the top.

## Final Result

QueuePilot is a working full-stack helpdesk application. It has a real database, backend queue logic, responsive frontend, seeded tickets, ticket updates, filtering, search, pagination, and documentation.

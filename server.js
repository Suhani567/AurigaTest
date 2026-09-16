import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync } from 'node:fs'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(root, 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir)
const db = new Database(path.join(dataDir, 'queuepilot.db'))
db.pragma('journal_mode = WAL')

export const PRIORITIES = { Critical: 1, High: 2, Medium: 3, Low: 4 }
export const SLA_HOURS = { Critical: 1, High: 2, Medium: 8, Low: 24 }

db.exec(`
CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, initials TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tickets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, ticketNumber TEXT NOT NULL UNIQUE, customerName TEXT NOT NULL,
 customerEmail TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, priority TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Open', assigneeId INTEGER REFERENCES agents(id), createdAt TEXT NOT NULL,
 updatedAt TEXT NOT NULL, slaDeadline TEXT NOT NULL, resolvedAt TEXT
);
CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, ticketId INTEGER NOT NULL REFERENCES tickets(id), message TEXT NOT NULL, createdAt TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ticket_status ON tickets(status); CREATE INDEX IF NOT EXISTS ticket_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS ticket_assignee ON tickets(assigneeId); CREATE INDEX IF NOT EXISTS ticket_created ON tickets(createdAt);
CREATE INDEX IF NOT EXISTS ticket_sla ON tickets(slaDeadline);
`)

const now = () => new Date().toISOString()
const seed = () => {
  if (db.prepare('SELECT COUNT(*) as count FROM agents').get().count === 0) {
    db.prepare('INSERT INTO agents (name, initials) VALUES (?, ?)').run('Priya', 'PS')
    db.prepare('INSERT INTO agents (name, initials) VALUES (?, ?)').run('Arjun', 'AK')
  }
  if (db.prepare('SELECT COUNT(*) as count FROM tickets').get().count > 0) return
  const agents = db.prepare('SELECT id, name FROM agents').all()
  const agentId = name => agents.find(agent => agent.name === name)?.id ?? null
  const examples = [
    ["Laptop won't boot before client demo", 'Maya Chen', 'maya@northstar.io', 'Critical', 'Open', 'Priya', -150, 'Priya needs a laptop ready before the client presentation this afternoon.'],
    ['Unable to access production dashboard', 'Jon Bell', 'jon@finch.co', 'High', 'In Progress', 'Arjun', -40, 'Production access started failing for the on-call engineer during a release.'],
    ['VPN disconnected during customer call', 'Alicia Stone', 'alicia@brightline.com', 'High', 'Open', 'Priya', 35, 'VPN drops every few minutes while Alicia is presenting to a customer.'],
    ['Email sync stopped on mobile', 'Owen Wright', 'owen@orbitlabs.dev', 'Medium', 'Open', null, 210, 'New messages are not syncing to the mobile mail client.'],
    ['Request for larger monitor', 'Nora Patel', 'nora@fieldwork.org', 'Low', 'Open', 'Arjun', 600, 'A second, larger monitor would make the analytics workflow more comfortable.'],
    ['Password reset', 'David Kim', 'david@northstar.io', 'Medium', 'Waiting', null, -120, 'Locked out after too many attempts and waiting for identity verification.'],
    ['Printer unavailable on floor 3', 'Maya Chen', 'maya@northstar.io', 'Low', 'Open', 'Priya', 900, 'The shared printer shows as offline for the third-floor team.'],
    ['Install Figma desktop app', 'Lena Fox', 'lena@brightline.com', 'Low', 'Resolved', 'Arjun', -720, 'Design needs the approved desktop application installed.'],
    ['New starter cannot access Slack', 'Theo Martin', 'theo@finch.co', 'High', 'Open', 'Arjun', 90, 'A new starter has completed onboarding but cannot join the workspace.'],
    ['Laptop camera not detected', 'Sofia Reyes', 'sofia@orbitlabs.dev', 'Medium', 'Open', null, 300, 'Camera disappeared from video conferencing apps after an OS update.'],
    ['Shared drive permission request', 'Caleb Young', 'caleb@fieldwork.org', 'Medium', 'In Progress', 'Priya', 480, 'Needs access to the Q4 shared drive for the finance close.'],
    ['Keyboard keys sticking', 'Iris Moore', 'iris@northstar.io', 'Low', 'Open', null, 1100, 'Several keys stick after a drink was spilled near the keyboard.'],
    ['Two-factor authentication issue', 'Sam Rivera', 'sam@brightline.com', 'Critical', 'Open', 'Arjun', -20, 'Authenticator device was lost and the user cannot access customer systems.'],
    ['Calendar invites not arriving', 'Grace Lee', 'grace@finch.co', 'Medium', 'Open', 'Priya', 700, 'External calendar invitations are missing from the work calendar.'],
    ['Request access to analytics', 'Ben Carter', 'ben@orbitlabs.dev', 'High', 'Waiting', 'Arjun', -200, 'Waiting on manager approval for the analytics workspace.'],
    ['Replace cracked laptop screen', 'Rina Shah', 'rina@fieldwork.org', 'High', 'Open', null, -30, 'The laptop display has a crack and is difficult to read.'],
    ['Wi-Fi slow in meeting room', 'Nadia Cole', 'nadia@northstar.io', 'Medium', 'Open', 'Priya', 150, 'Video calls in Atlas room regularly buffer and disconnect.'],
    ['Software license renewal', 'Leo Grant', 'leo@brightline.com', 'Low', 'Resolved', 'Priya', -900, 'Renewal reminder for the team planning software license.']
  ]
  const insert = db.prepare('INSERT INTO tickets (ticketNumber, customerName, customerEmail, title, description, priority, status, assigneeId, createdAt, updatedAt, slaDeadline, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const activity = db.prepare('INSERT INTO activity (ticketId, message, createdAt) VALUES (?, ?, ?)')
  const seedTickets = db.transaction(() => examples.forEach(([title, customer, email, priority, status, assignee, offset, description], index) => {
    const created = new Date(Date.now() - SLA_HOURS[priority] * 3600000 + offset * 60000)
    const deadline = new Date(created.getTime() + SLA_HOURS[priority] * 3600000)
    const resolvedAt = status === 'Resolved' ? new Date(created.getTime() + 3600000).toISOString() : null
    const result = insert.run(`QP-${String(index + 1).padStart(4, '0')}`, customer, email, title, description, priority, status, agentId(assignee), created.toISOString(), now(), deadline.toISOString(), resolvedAt)
    activity.run(result.lastInsertRowid, status === 'Resolved' ? 'Ticket resolved' : 'Ticket created', created.toISOString())
  }))
  seedTickets()
}
seed()

export function compareTickets(a, b, currentTime = Date.now()) {
  const overdueA = new Date(a.slaDeadline).getTime() < currentTime
  const overdueB = new Date(b.slaDeadline).getTime() < currentTime
  if (overdueA !== overdueB) return overdueA ? -1 : 1
  const priorityDiff = PRIORITIES[a.priority] - PRIORITIES[b.priority]
  if (priorityDiff) return priorityDiff
  const deadlineDiff = new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime()
  if (deadlineDiff) return deadlineDiff
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

const app = express()
app.use(cors()); app.use(express.json())
const agents = () => db.prepare('SELECT id, name, initials FROM agents ORDER BY id').all()
const enrich = ticket => ({ ...ticket, assignee: ticket.assigneeName ? { id: ticket.assigneeId, name: ticket.assigneeName } : null, overdue: new Date(ticket.slaDeadline) < new Date(), dueSoon: new Date(ticket.slaDeadline) > new Date() && new Date(ticket.slaDeadline).getTime() - Date.now() < 2 * 3600000 })
const ticketQuery = 'SELECT t.*, a.name as assigneeName FROM tickets t LEFT JOIN agents a ON a.id = t.assigneeId'

app.get('/api/agents', (_req, res) => res.json(agents()))
app.get('/api/dashboard/stats', (_req, res) => {
  const active = db.prepare(`${ticketQuery} WHERE t.status != 'Resolved'`).all().map(enrich)
  const today = new Date().toISOString().slice(0, 10)
  res.json({ totalOpen: active.length, overdue: active.filter(t => t.overdue).length, dueSoon: active.filter(t => t.dueSoon).length, myTickets: active.filter(t => t.assigneeName === 'Priya').length, resolvedToday: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'Resolved' AND substr(resolvedAt, 1, 10) = ?").get(today).count })
})
app.get('/api/tickets', (req, res) => {
  const { page = 1, limit = 20, search = '', status = '', priority = '', assignee = '', overdue = '', dueSoon = '' } = req.query
  const where = [status === 'Resolved' ? "t.status = 'Resolved'" : "t.status != 'Resolved'"]; const params = []
  if (status && status !== 'all') { where.push('t.status = ?'); params.push(status) }
  if (priority && priority !== 'all') { where.push('t.priority = ?'); params.push(priority) }
  if (assignee && assignee !== 'all') { assignee === 'unassigned' ? where.push('t.assigneeId IS NULL') : (where.push('t.assigneeId = ?'), params.push(Number(assignee))) }
  if (search) { where.push('(t.ticketNumber LIKE ? OR t.customerName LIKE ? OR t.title LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  if (overdue === 'true') where.push("datetime(t.slaDeadline) < datetime('now')")
  if (dueSoon === 'true') where.push("datetime(t.slaDeadline) >= datetime('now') AND datetime(t.slaDeadline) <= datetime('now', '+2 hours')")
  const all = db.prepare(`${ticketQuery} WHERE ${where.join(' AND ')}`).all(...params).map(enrich).sort(compareTickets)
  const pageSize = Math.min(Math.max(Number(limit), 1), 100); const currentPage = Math.max(Number(page), 1)
  res.json({ items: all.slice((currentPage - 1) * pageSize, currentPage * pageSize), page: currentPage, limit: pageSize, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / pageSize)), agents: agents() })
})
app.get('/api/tickets/:id', (req, res) => {
  const ticket = db.prepare(`${ticketQuery} WHERE t.id = ?`).get(Number(req.params.id))
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  res.json({ ...enrich(ticket), activity: db.prepare('SELECT * FROM activity WHERE ticketId = ? ORDER BY createdAt DESC').all(ticket.id) })
})
app.patch('/api/tickets/:id', (req, res) => {
  const id = Number(req.params.id); const current = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
  if (!current) return res.status(404).json({ error: 'Ticket not found' })
  const allowed = { status: ['Open', 'In Progress', 'Waiting', 'Resolved'], priority: Object.keys(PRIORITIES) }
  for (const field of ['status', 'priority']) if (req.body[field] && !allowed[field].includes(req.body[field])) return res.status(400).json({ error: `Invalid ${field}` })
  const assigneeId = req.body.assigneeId === null || req.body.assigneeId === undefined ? current.assigneeId : Number(req.body.assigneeId) || null
  const status = req.body.status || current.status; const resolvedAt = status === 'Resolved' ? (current.resolvedAt || now()) : null
  db.prepare('UPDATE tickets SET status = ?, priority = ?, assigneeId = ?, resolvedAt = ?, updatedAt = ? WHERE id = ?').run(status, req.body.priority || current.priority, assigneeId, resolvedAt, now(), id)
  const changes = []; if (req.body.status && req.body.status !== current.status) changes.push(`Status changed to ${req.body.status}`); if (req.body.priority && req.body.priority !== current.priority) changes.push(`Priority changed to ${req.body.priority}`); if (assigneeId !== current.assigneeId) changes.push('Assignment updated')
  if (changes.length) db.prepare('INSERT INTO activity (ticketId, message, createdAt) VALUES (?, ?, ?)').run(id, changes.join(' • '), now())
  res.json(enrich(db.prepare(`${ticketQuery} WHERE t.id = ?`).get(id)))
})
app.post('/api/tickets', (req, res) => {
  const { customerName, customerEmail, title, description, priority = 'Medium', assigneeId = null } = req.body
  if (!customerName || !customerEmail || !title || !description || !PRIORITIES[priority]) return res.status(400).json({ error: 'Customer, email, title, description and valid priority are required' })
  const created = now(); const deadline = new Date(Date.now() + SLA_HOURS[priority] * 3600000).toISOString(); const ticketNumber = `QP-${String(db.prepare('SELECT COUNT(*) as count FROM tickets').get().count + 1).padStart(4, '0')}`
  const result = db.prepare("INSERT INTO tickets (ticketNumber, customerName, customerEmail, title, description, priority, status, assigneeId, createdAt, updatedAt, slaDeadline) VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?)").run(ticketNumber, customerName, customerEmail, title, description, priority, assigneeId || null, created, created, deadline)
  db.prepare('INSERT INTO activity (ticketId, message, createdAt) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'Ticket created', created)
  res.status(201).json(enrich(db.prepare(`${ticketQuery} WHERE t.id = ?`).get(result.lastInsertRowid)))
})

if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(path.join(root, 'dist')))
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))
  app.listen(process.env.PORT || 3001, () => console.log(`QueuePilot API running on http://localhost:${process.env.PORT || 3001}`))
}
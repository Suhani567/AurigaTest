import test from 'node:test'
import assert from 'node:assert/strict'
import { compareTickets } from './server.js'

const clock = Date.parse('2026-01-01T12:00:00Z')
const ticket = (overrides = {}) => ({ priority: 'Critical', createdAt: '2026-01-01T08:00:00Z', slaDeadline: '2026-01-01T13:00:00Z', ...overrides })

test('overdue beats non-overdue at every priority', () => {
  assert.ok(compareTickets(ticket({ slaDeadline: '2026-01-01T11:59:00Z' }), ticket({ priority: 'Critical' }), clock) < 0)
  assert.ok(compareTickets(ticket({ priority: 'Low', slaDeadline: '2026-01-01T11:59:00Z' }), ticket({ priority: 'Critical' }), clock) < 0)
})
test('higher priority wins among tickets in the same overdue state', () => {
  assert.ok(compareTickets(ticket({ priority: 'Critical', slaDeadline: '2026-01-01T11:00:00Z' }), ticket({ priority: 'High', slaDeadline: '2026-01-01T11:30:00Z' }), clock) < 0)
})
test('earlier SLA deadline wins within the same priority', () => {
  assert.ok(compareTickets(ticket({ slaDeadline: '2026-01-01T12:30:00Z' }), ticket({ slaDeadline: '2026-01-01T13:00:00Z' }), clock) < 0)
})
test('older creation time is the final tie-breaker', () => {
  assert.ok(compareTickets(ticket({ createdAt: '2026-01-01T07:00:00Z' }), ticket({ createdAt: '2026-01-01T08:00:00Z' }), clock) < 0)
})
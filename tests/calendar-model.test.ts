import assert from 'node:assert/strict';
import test from 'node:test';
import { dayKey, monthDays, moveCalendarFocus, shiftMonth } from '../lib/calendar-model.ts';

test('October starts on Thursday with blank September cells and all 31 dates', () => {
  const days = monthDays('2026-10');
  assert.deepEqual(days.slice(0, 4), [null, null, null, '2026-10-01']);
  assert.equal(days.filter(Boolean).length, 31);
  assert.equal(days.at(-1), null);
});
test('future calendars handle year changes and leap years', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(monthDays('2028-02').filter(Boolean).length, 29);
  assert.equal(monthDays('2026-11')[6], '2026-11-01');
});
test('month and keyboard navigation cannot move before archive start', () => {
  assert.equal(shiftMonth('2026-10', -1), '2026-10');
  for (const key of ['ArrowLeft', 'ArrowUp', 'Home']) assert.equal(moveCalendarFocus('2026-10-01', key), '2026-10-01');
  assert.equal(moveCalendarFocus('2026-10-31', 'ArrowRight'), '2026-11-01');
  assert.equal(moveCalendarFocus('2026-11-01', 'ArrowLeft'), '2026-10-31');
  assert.equal(moveCalendarFocus('2026-10-08', 'End'), '2026-10-11');
  assert.equal(moveCalendarFocus('2026-10-08', 'Enter'), null);
});
test('calendar dates match journal UTC dates at timezone boundaries', () => {
  assert.equal(dayKey('2026-10-08T23:30:00-04:00'), '2026-10-09');
});

'use client';

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Select } from 'radix-ui';
import { useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { FIRST_MONTH, LAST_MONTH, monthDays, monthLabel, moveCalendarFocus, shiftMonth } from '@/lib/calendar-model';

type Props = {
  month: string;
  today: string;
  selectedDay: string | null;
  counts: Map<string, number>;
  unavailable: boolean;
  onMonthChange: (month: string) => void;
  onDaySelect: (day: string) => void;
};
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function PromptCalendar({ month, today, selectedDay, counts, unavailable, onMonthChange, onDaySelect }: Props): ReactElement {
  const grid = useRef<HTMLTableElement>(null);
  const [focusedDay, setFocusedDay] = useState('');
  const days = monthDays(month);
  const selectedInMonth = selectedDay?.startsWith(month) ? selectedDay : null;
  const initialFocus = selectedInMonth ?? (today.startsWith(month) ? today : `${month}-01`);
  const tabDay = focusedDay.startsWith(month) ? focusedDay : initialFocus;
  const endMonth = shiftMonth(month > today.slice(0, 7) ? month : today.slice(0, 7), 12);
  const options: string[] = [];
  for (let value = FIRST_MONTH; value <= endMonth; value = shiftMonth(value, 1)) {
    options.push(value);
    if (value === LAST_MONTH) break;
  }
  const count = [...counts].reduce((total, [day, value]) => total + (day.startsWith(month) ? value : 0), 0);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string): void {
    const next = moveCalendarFocus(day, event.key);
    if (!next) return;
    event.preventDefault();
    setFocusedDay(next);
    if (!next.startsWith(month)) onMonthChange(next.slice(0, 7));
    requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus());
  }

  return (
    <div className="prompt-calendar">
      <div className="calendar-heading">
        <div className="calendar-month-select">
          <Select.Root value={month} onValueChange={onMonthChange}>
            <Select.Trigger className="month-trigger" aria-label="Browse month">
              <Select.Value>{monthLabel(month)}</Select.Value>
              <Select.Icon asChild><ChevronDown size={16} aria-hidden="true" /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="month-menu" position="popper" align="start" sideOffset={6} collisionPadding={16}>
                <Select.ScrollUpButton className="month-scroll"><ChevronUp size={16} aria-hidden="true" /></Select.ScrollUpButton>
                <Select.Viewport className="month-options">
                  {options.map(value => (
                    <Select.Item className="month-option" key={value} value={value}>
                      <Select.ItemText>{monthLabel(value)}</Select.ItemText>
                      <Select.ItemIndicator className="month-check"><Check size={16} aria-hidden="true" /></Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="month-scroll"><ChevronDown size={16} aria-hidden="true" /></Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <button className="calendar-nav" aria-label="Previous month" disabled={month === FIRST_MONTH} onClick={() => onMonthChange(shiftMonth(month, -1))}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button className="calendar-nav" aria-label="Next month" disabled={month === LAST_MONTH} onClick={() => onMonthChange(shiftMonth(month, 1))}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <table className="calendar-grid" role="grid" aria-label={monthLabel(month)} ref={grid}>
        <thead><tr>{weekdays.map(day => <th scope="col" key={day}>{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: days.length / 7 }, (_, week) => (
          <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day, index) => {
            if (!day) return <td key={`blank-${index}`} />;
            const available = !unavailable && (counts.get(day) ?? 0) > 0;
            const selected = day === selectedDay;
            const label = fullDate.format(new Date(`${day}T00:00:00Z`));
            return <td key={day} aria-selected={selected}>
              <button className={`calendar-day${available ? ' has-prompt' : ''}${selected ? ' is-selected' : ''}${day === today ? ' is-today' : ''}`}
                data-day={day} tabIndex={day === tabDay ? 0 : -1} aria-current={day === today ? 'date' : undefined}
                aria-label={`${label}${day === today ? ', today' : ''}, ${available ? `${counts.get(day)} ${counts.get(day) === 1 ? 'prompt' : 'prompts'} available` : unavailable ? 'availability unavailable' : 'no prompts archived'}`}
                aria-disabled={!available} onFocus={() => setFocusedDay(day)} onKeyDown={event => onKeyDown(event, day)}
                onClick={() => { if (available) onDaySelect(day); }}>
                <span>{Number(day.slice(8))}</span>{available && <i aria-hidden="true" />}
              </button>
            </td>;
          })}</tr>
        ))}</tbody>
      </table>
      <p className="calendar-legend"><span aria-hidden="true" />Prompt available</p>
      <p className="calendar-count" aria-live="polite">{unavailable ? 'Prompt count unavailable' : `${count} ${count === 1 ? 'prompt' : 'prompts'} this month`}</p>
    </div>
  );
}

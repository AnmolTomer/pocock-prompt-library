'use client';

import { ArrowUpRight, CalendarDays, ChevronDown, Search, Star, X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { sourceUrl, type Library } from '@/lib/prompt-model';
import { dayKey, FIRST_MONTH, monthKey, monthLabel } from '@/lib/calendar-model';
import PromptCalendar from './prompt-calendar';
import CopyPrompt from './copy-prompt';
import OriginalPost from './original-post';

type Props = { library: Library; today: string; unavailable?: boolean };
const repositoryUrl = 'https://github.com/AnmolTomer/pocock-prompt-library';
const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export default function PromptLibrary({ library, today, unavailable = false }: Props): ReactElement {
  const currentMonth = today.slice(0, 7) < FIRST_MONTH ? FIRST_MONTH : today.slice(0, 7);
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pendingJump, setPendingJump] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const prompts = [...library.prompts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const months = [...new Set(prompts.map(prompt => monthKey(prompt.publishedAt)))];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = prompts.filter(prompt => (
    (Boolean(normalizedQuery) || monthKey(prompt.publishedAt) === month)
    && [prompt.title, prompt.command, prompt.text, dateFormatter.format(new Date(prompt.publishedAt))]
      .some(value => value?.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const visibleMonths = months.filter(value => filtered.some(prompt => monthKey(prompt.publishedAt) === value));

  const counts = new Map<string, number>();
  for (const prompt of prompts) {
    const day = dayKey(prompt.publishedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  useEffect(() => {
    if (!pendingJump) return;
    const target = document.getElementById(pendingJump);
    target?.scrollIntoView({ block: 'start' });
    target?.focus({ preventScroll: true });
    setPendingJump(null);
  }, [pendingJump]);

  useEffect(() => {
    function fromLocation(): void {
      const id = window.location.hash.slice(1);
      const prompt = library.prompts.find(prompt => prompt.tweetId === id);
      if (prompt) {
        setQuery('');
        setMonth(monthKey(prompt.publishedAt));
        setSelectedDay(dayKey(prompt.publishedAt));
        setCollapsedIds(ids => ids.filter(value => value !== id));
        setPendingJump(id);
      }
    }
    fromLocation();
    window.addEventListener('hashchange', fromLocation);
    window.addEventListener('popstate', fromLocation);
    return () => {
      window.removeEventListener('hashchange', fromLocation);
      window.removeEventListener('popstate', fromLocation);
    };
  }, [library.prompts]);

  function togglePrompt(id: string): void {
    const opening = collapsedIds.includes(id);
    setCollapsedIds(ids => opening ? ids.filter(value => value !== id) : [...ids, id]);
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${opening ? `#${id}` : ''}`);
  }

  function changeMonth(value: string): void {
    setQuery('');
    setMonth(value);
    setSelectedDay(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  function jumpToDay(day: string): void {
    const entries = prompts.filter(prompt => dayKey(prompt.publishedAt) === day);
    if (!entries.length) return;
    setQuery('');
    setMonth(day.slice(0, 7));
    setSelectedDay(day);
    setCollapsedIds(ids => ids.filter(id => !entries.some(prompt => prompt.tweetId === id)));
    setCalendarOpen(false);
    window.history.pushState(null, '', `#${entries[0].tweetId}`);
    setPendingJump(entries[0].tweetId);
  }

  return (
    <>
      <a className="skip-link" href="#prompts">Skip to prompts</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="wordmark" href="/">Prompt Library</a>
          <span className="site-subtitle">Matt Pocock’s daily prompts</span>
          <a className="github-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer"><Star size={21} aria-hidden="true" /> Star on GitHub</a>
        </div>
      </header>
      <main className="journal" id="prompts" tabIndex={-1}>
        <h1 className="sr-only">Matt Pocock’s prompt journal</h1>
        <aside className="calendar-sidebar" aria-label="Browse prompts by date">
          <button className="browse-dates" aria-expanded={calendarOpen} aria-controls="calendar-panel" onClick={() => setCalendarOpen(open => !open)}>
            <CalendarDays size={19} aria-hidden="true" /> Browse dates <ChevronDown size={17} aria-hidden="true" />
          </button>
          <div id="calendar-panel" className={`calendar-panel${calendarOpen ? ' is-open' : ''}`}>
            <PromptCalendar month={month} today={today} selectedDay={selectedDay} counts={counts} unavailable={unavailable} onMonthChange={changeMonth} onDaySelect={jumpToDay} />
          </div>
        </aside>
        <div className="journal-filters">
          <div className="search-field">
            <Search size={21} aria-hidden="true" />
            <input type="search" aria-label="Search all prompts" placeholder="Search all prompts" value={query} onChange={event => setQuery(event.target.value)} />
            {query && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X size={18} aria-hidden="true" /></button>}
          </div>
        </div>
        <div className="journal-content">
        <p className={normalizedQuery ? 'search-summary' : 'sr-only'} role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'} found{normalizedQuery ? ' across all months' : ''}.</p>
        {unavailable ? (
          <div className="journal-message" role="alert"><h2>The library couldn’t load.</h2><p>Please try again in a moment.</p><a href="/">Reload library</a></div>
        ) : !filtered.length ? (
          normalizedQuery ? <div className="journal-message"><h2>No matching prompts</h2><p>Try another topic or command.</p><button className="text-button" onClick={() => setQuery('')}>Clear search</button></div>
          : <div className="journal-message empty-month"><h2>No prompts added for this month yet</h2><p>{monthLabel(month)}</p><button className="primary-button" onClick={() => changeMonth(currentMonth)}>Back to current month</button></div>
        ) : visibleMonths.map(value => (
          <section className="journal-month" key={value} aria-labelledby={`month-${value}`}>
            <h2 className="month-heading" id={`month-${value}`}>{monthLabel(value)}</h2>
            <div className="timeline">
              {filtered.filter(prompt => monthKey(prompt.publishedAt) === value).map(prompt => {
                const expanded = !collapsedIds.includes(prompt.tweetId);
                const short = Boolean(prompt.text && prompt.text.length <= 150);
                const excerpt = prompt.text?.split('\n\n')[0].replace(/^\/[\w-]+\s*/, '') ?? 'View Matt’s original post.';
                return (
                  <article className={`journal-entry${expanded ? ' is-expanded' : ''}`} id={prompt.tweetId} tabIndex={-1} key={prompt.tweetId} aria-labelledby={`title-${prompt.tweetId}`}>
                    <time className="entry-date" dateTime={prompt.publishedAt}>{dateFormatter.format(new Date(prompt.publishedAt))}</time>
                    <div className="entry-body">
                      <div className="entry-heading"><h3 id={`title-${prompt.tweetId}`}>
                        <button className="entry-toggle" aria-expanded={expanded} aria-controls={`text-${prompt.tweetId}`} onClick={() => togglePrompt(prompt.tweetId)}>
                          {prompt.title}<ChevronDown size={17} aria-hidden="true" />
                        </button>
                      </h3>
                      <span className="entry-command">{prompt.command ?? 'Skills maintenance'}</span></div>
                      {!expanded && !short && <p className="entry-excerpt">{excerpt}</p>}
                      {short && !expanded && <p className="prompt-text compact-text">{prompt.text}</p>}
                      <div id={`text-${prompt.tweetId}`} hidden={!expanded}>
                        <p className="byline">Matt Pocock · <a href="https://x.com/mattpocockuk" target="_blank" rel="noopener noreferrer">@mattpocockuk</a></p>
                        {prompt.text ? <p className="prompt-text">{prompt.text}</p> : expanded && <OriginalPost tweetId={prompt.tweetId} />}
                      </div>
                    </div>
                    <div className="entry-actions">
                      <CopyPrompt text={prompt.text} />
                      <a className="source-link" href={sourceUrl(prompt.tweetId)} target="_blank" rel="noopener noreferrer">Original post <ArrowUpRight size={15} aria-hidden="true" /></a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        </div>
      </main>
      <footer className="site-footer">
        <p>An independent archive. Not affiliated with or endorsed by Matt Pocock.</p>
        <p>Prompts may require <a href="https://github.com/mattpocock/skills" target="_blank" rel="noopener noreferrer">Matt’s skills</a>. <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">Give the project a star</a>.</p>
      </footer>
    </>
  );
}

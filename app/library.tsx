'use client';

import { ArrowUpRight, ChevronDown, Search, Star, X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { sourceUrl, type Library } from '@/lib/prompt-model';
import CopyPrompt from './copy-prompt';
import OriginalPost from './original-post';

type Props = { library: Library; unavailable?: boolean };
const repositoryUrl = 'https://github.com/AnmolTomer/pocock-prompt-library';
const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function monthKey(date: string): string {
  return new Date(date).toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

export default function PromptLibrary({ library, unavailable = false }: Props): ReactElement {
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState('all');
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const prompts = [...library.prompts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const months = [...new Set(prompts.map(prompt => monthKey(prompt.publishedAt)))];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = prompts.filter(prompt => (
    (month === 'all' || monthKey(prompt.publishedAt) === month)
    && [prompt.title, prompt.command, prompt.text, dateFormatter.format(new Date(prompt.publishedAt))]
      .some(value => value?.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const visibleMonths = months.filter(value => filtered.some(prompt => monthKey(prompt.publishedAt) === value));

  useEffect(() => {
    function fromLocation(): void {
      const id = window.location.hash.slice(1);
      if (library.prompts.some(prompt => prompt.tweetId === id)) {
        setQuery('');
        setMonth('all');
        setCollapsedIds(ids => ids.filter(value => value !== id));
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
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

  function clearFilters(): void {
    setQuery('');
    setMonth('all');
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
        <div className="journal-filters">
          <div className="search-field">
            <Search size={21} aria-hidden="true" />
            <input type="search" aria-label="Search prompts" placeholder="Search prompts" value={query} onChange={event => setQuery(event.target.value)} />
            {query && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X size={18} aria-hidden="true" /></button>}
          </div>
          <div className="month-field">
            <label htmlFor="month" className="sr-only">Filter by month</label>
            <select id="month" value={month} onChange={event => setMonth(event.target.value)}>
              <option value="all">All months</option>
              {months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>)}
            </select>
            <ChevronDown size={17} aria-hidden="true" />
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'} found.</p>
        {unavailable ? (
          <div className="journal-message" role="alert"><h2>The library couldn’t load.</h2><p>Please try again in a moment.</p><a href="/">Reload library</a></div>
        ) : !prompts.length ? (
          <div className="journal-message"><h2>No prompts yet</h2><p>New prompts will appear here once they’ve been added.</p></div>
        ) : !filtered.length ? (
          <div className="journal-message"><h2>No matching prompts</h2><p>Try another topic, command, or month.</p><button className="text-button" onClick={clearFilters}>Clear filters</button></div>
        ) : visibleMonths.map(value => (
          <section className="journal-month" key={value} aria-labelledby={`month-${value}`}>
            <h2 className="month-heading" id={`month-${value}`}>{monthLabel(value)}</h2>
            <div className="timeline">
              {filtered.filter(prompt => monthKey(prompt.publishedAt) === value).map(prompt => {
                const expanded = !collapsedIds.includes(prompt.tweetId);
                const short = Boolean(prompt.text && prompt.text.length <= 150);
                const excerpt = prompt.text?.split('\n\n')[0].replace(/^\/[\w-]+\s*/, '') ?? 'View Matt’s original post.';
                return (
                  <article className={`journal-entry${expanded ? ' is-expanded' : ''}`} id={prompt.tweetId} key={prompt.tweetId} aria-labelledby={`title-${prompt.tweetId}`}>
                    <time className="entry-date" dateTime={prompt.publishedAt}>{dateFormatter.format(new Date(prompt.publishedAt))}</time>
                    <div className="entry-body">
                      <h3 id={`title-${prompt.tweetId}`}>
                        <button className="entry-toggle" aria-expanded={expanded} aria-controls={`text-${prompt.tweetId}`} onClick={() => togglePrompt(prompt.tweetId)}>
                          {prompt.title}<ChevronDown size={17} aria-hidden="true" />
                        </button>
                      </h3>
                      <span className="entry-command">{prompt.command ?? 'Skills maintenance'}</span>
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
      </main>
      <footer className="site-footer">
        <p>An independent archive. Not affiliated with or endorsed by Matt Pocock.</p>
        <p>Prompts may require <a href="https://github.com/mattpocock/skills" target="_blank" rel="noopener noreferrer">Matt’s skills</a>. <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">Give the project a star</a>.</p>
      </footer>
    </>
  );
}

'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { sourceUrl, type Library } from '@/lib/prompt-model';
import CopyPrompt from './copy-prompt';
import OriginalPost from './original-post';

type Props = { library: Library; unavailable?: boolean };

function formatDate(date: string, month: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month, year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}

export default function PromptLibrary({ library, unavailable = false }: Props): ReactElement {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(library.prompts[0]?.tweetId);
  const [mobileDetail, setMobileDetail] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const selected = library.prompts.find(prompt => prompt.tweetId === selectedId);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = library.prompts.filter(prompt => [prompt.title, prompt.command, prompt.text, formatDate(prompt.publishedAt)].some(value => value?.toLocaleLowerCase().includes(normalizedQuery)));
  const next = selected ? library.prompts[(library.prompts.findIndex(prompt => prompt.tweetId === selectedId) + library.prompts.length - 1) % library.prompts.length] : null;

  useEffect(() => {
    function fromLocation() {
      const id = window.location.hash.slice(1);
      if (library.prompts.some(prompt => prompt.tweetId === id)) {
        setSelectedId(id);
        setMobileDetail(true);
      } else setMobileDetail(false);
    }
    fromLocation();
    window.addEventListener('hashchange', fromLocation);
    window.addEventListener('popstate', fromLocation);
    return () => { window.removeEventListener('hashchange', fromLocation); window.removeEventListener('popstate', fromLocation); };
  }, [library.prompts]);

  function choose(id: string) {
    setSelectedId(id);
    setMobileDetail(true);
    window.history.pushState(null, '', `#${id}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      {selected && <a className="skip-link" href="#prompt-detail" onClick={event => { event.preventDefault(); choose(selected.tweetId); }}>Skip to prompt</a>}
      <header className="site-header">
        <a className="wordmark" href="/">Prompt Library</a>
        <span className="site-subtitle">Matt Pocock’s daily prompts</span>
        <a className="about-link" href="#about">About this archive</a>
      </header>
      <main className="library" data-mobile-detail={mobileDetail}>
        <aside className="index" aria-label="Prompt index">
          <div className="index-heading">
            <div className="index-label"><h1>Browse prompts</h1><span>{library.prompts.length}</span></div>
            <div className="search-field">
              <Search size={22} aria-hidden="true" />
              <input ref={searchInput} type="search" aria-label="Search prompts" placeholder="Search prompts" value={query} onChange={event => setQuery(event.target.value)} />
              {query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><X size={18} /></button>}
            </div>
          </div>
          {unavailable ? <div className="index-message" role="alert"><h2>The library couldn’t load.</h2><p>Please try again in a moment.</p><a href="/">Reload library</a></div> : (
            <>
              <nav aria-label="Prompts">
                {filtered.map(prompt => (
                  <a key={prompt.tweetId} href={`#${prompt.tweetId}`} className={`index-entry${selectedId === prompt.tweetId ? ' selected' : ''}`} aria-current={selectedId === prompt.tweetId ? 'true' : undefined} onClick={event => { event.preventDefault(); choose(prompt.tweetId); }}>
                    <time dateTime={prompt.publishedAt}>{formatDate(prompt.publishedAt)}</time>
                    <span className="entry-title">{prompt.title}</span>
                    <span className="entry-command">{prompt.command ?? 'Skills maintenance'}</span>
                  </a>
                ))}
              </nav>
              {!filtered.length && <div className="index-message" role="status"><h2>No matching prompts</h2><p>Try a topic or command, such as “retro”.</p><button className="text-button" onClick={() => setQuery('')}>Clear search</button></div>}
              <p className="sr-only" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'} found.</p>
            </>
          )}
          <div className="coverage">
            <p>Coverage may be incomplete.</p>
            <p>Initial collection: past 30 days</p>
            {library.lastCheckedAt && <p>Last checked: <time dateTime={library.lastCheckedAt}>{formatDate(library.lastCheckedAt)}</time></p>}
          </div>
        </aside>
        <section className="reader" id="prompt-detail" aria-label="Selected prompt">
          <button className="back-button text-button" onClick={() => {
            setMobileDetail(false);
            window.history.pushState(null, '', window.location.pathname);
            requestAnimationFrame(() => { window.scrollTo(0, 0); searchInput.current?.focus({ preventScroll: true }); });
          }}><ArrowLeft size={18} /> All prompts</button>
          {selected ? (
            <article>
              <div className="reader-meta">
                <time dateTime={selected.publishedAt}>{formatDate(selected.publishedAt, 'long')}</time>
                <a href={sourceUrl(selected.tweetId)} target="_blank" rel="noopener noreferrer">Original post <ArrowUpRight size={19} aria-hidden="true" /></a>
              </div>
              <h2 ref={heading} tabIndex={-1} className="prompt-title">{selected.title}</h2>
              <p className="byline">Matt Pocock <span aria-hidden="true">·</span> <a href="https://x.com/mattpocockuk" target="_blank" rel="noopener noreferrer">@mattpocockuk</a></p>
              <div className="prompt-content" key={selected.tweetId}>
                <CopyPrompt text={selected.text} />
                <OriginalPost tweetId={selected.tweetId} />
              </div>
              <footer className="prompt-footer">
                <p>From the Prompt of the Day series</p>
                {next && next.tweetId !== selected.tweetId && <a href={`#${next.tweetId}`} onClick={event => { event.preventDefault(); choose(next.tweetId); }}>Next: {next.title}<ArrowRight size={20} aria-hidden="true" /></a>}
              </footer>
            </article>
          ) : <div className="reader-empty"><h2>Choose a prompt</h2><p>Browse the index to find something useful.</p></div>}
        </section>
      </main>
      <footer id="about" className="about-section">
        <h2>About this archive</h2>
        <div>
          <p>An independent collection of Matt Pocock’s <a href="https://x.com/mattpocockuk" target="_blank" rel="noopener noreferrer">Prompt of the Day</a> posts. Not affiliated with or endorsed by Matt.</p>
          <p>Commands may depend on <a href="https://github.com/mattpocock/skills" target="_blank" rel="noopener noreferrer">Matt’s skills</a> being installed in your coding agent.</p>
        </div>
      </footer>
    </>
  );
}

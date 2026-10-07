'use client';

import { useEffect, useRef, useState } from 'react';
import { sourceUrl } from '@/lib/prompt-model';

type Widgets = { createTweet: (id: string, element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLElement | undefined> };
declare global { interface Window { twttr?: { widgets?: Widgets } } }

let widgetsPromise: Promise<Widgets> | undefined;

function loadWidgets(): Promise<Widgets> {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr.widgets);
  if (widgetsPromise) return widgetsPromise;
  widgetsPromise = new Promise<Widgets>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    const timer = window.setTimeout(() => reject(new Error('Post provider timed out')), 15000);
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.twttr?.widgets) resolve(window.twttr.widgets);
      else reject(new Error('Post provider unavailable'));
    };
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('Post provider unavailable')); };
    document.head.appendChild(script);
  }).catch(error => { widgetsPromise = undefined; throw error; });
  return widgetsPromise;
}

export default function OriginalPost({ tweetId }: { tweetId: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const target = container.current;
    if (!target) return;
    const mount = document.createElement('div');
    target.appendChild(mount);
    const timer = window.setTimeout(() => { if (!cancelled) setStatus('error'); }, 20000);
    loadWidgets().then(async widgets => {
      if (cancelled) return;
      const post = await widgets.createTweet(tweetId, mount, { dnt: true, conversation: 'none', theme: 'light', width: 550 });
      if (!cancelled) setStatus(post ? 'ready' : 'error');
    }).catch(() => { if (!cancelled) setStatus('error'); }).finally(() => window.clearTimeout(timer));
    return () => { cancelled = true; window.clearTimeout(timer); mount.remove(); };
  }, [tweetId]);

  return <div className="original-post">
    {status === 'loading' && <p role="status">Loading Matt’s original post…</p>}
    <div ref={container} aria-label="Matt Pocock’s original post" />
    {status === 'error' && <p role="status">X couldn’t load this post here. <a href={sourceUrl(tweetId)} target="_blank" rel="noopener noreferrer">Open the original post</a>.</p>}
    {status === 'ready' && <p className="embed-note">Served by X. If the post is shortened, use “Show more” to read the rest.</p>}
  </div>;
}

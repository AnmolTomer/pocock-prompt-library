'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';

type Props = { text: string | null };
type CopyState = 'idle' | 'copying' | 'copied' | 'manual';

export default function CopyPrompt({ text }: Props): ReactElement {
  const [state, setState] = useState<CopyState>('idle');
  const manualInput = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const helpId = useId();

  useEffect(() => {
    if (state === 'manual') {
      manualInput.current?.focus();
      manualInput.current?.select();
    }
    if (state !== 'copied') return;
    const timer = window.setTimeout(() => setState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy(): Promise<void> {
    if (!text || state === 'copying') return;
    setState('copying');
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('manual');
    }
  }

  let label = 'Copy prompt';
  if (state === 'copying') label = 'Copying…';
  if (state === 'copied') label = 'Copied';

  return (
    <div className="prompt-actions">
      <button
        className="copy-button"
        type="button"
        disabled={!text || state === 'copying'}
        aria-describedby={!text ? helpId : undefined}
        onClick={copy}
      >
        {state === 'copied' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        {label}
      </button>
      {!text && <p className="copy-help" id={helpId}>Original prompt text is needed to enable copying.</p>}
      <span className="sr-only" role="status">{state === 'copied' && 'Prompt copied to your clipboard.'}</span>
      {state === 'manual' && (
        <div className="manual-copy" role="status">
          <label htmlFor={fieldId}>Clipboard access was blocked. Copy the selected text:</label>
          <textarea ref={manualInput} id={fieldId} readOnly value={text ?? ''} rows={6} />
        </div>
      )}
    </div>
  );
}

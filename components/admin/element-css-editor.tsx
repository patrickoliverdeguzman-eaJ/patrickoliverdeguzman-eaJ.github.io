'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Code2, Copy, MousePointer2 } from 'lucide-react';
import { blockCssSelector, elementSelector, readElementCss, savedElementSelectors, writeElementCss } from '@/lib/element-css';

type Target = { selector: string; label: string };
const LIVE_ONLY_TARGETS: Target[] = [
  { selector: 'html', label: 'Document · html (live page only)' },
  { selector: 'body', label: 'Document body · body (live page only)' },
  { selector: '.site-chatbot', label: 'Live chat widget · .site-chatbot (live page only)' },
  { selector: '.chatbot-launcher', label: 'Chat launcher · .chatbot-launcher (live page only)' },
  { selector: '.chatbot-panel', label: 'Chat panel · .chatbot-panel (live page only)' },
  { selector: '.chatbot-header', label: 'Chat header · .chatbot-header (live page only)' },
  { selector: '.chatbot-thread', label: 'Chat messages · .chatbot-thread (live page only)' },
  { selector: '.chatbot-composer', label: 'Chat composer · .chatbot-composer (live page only)' },
];
type Props = {
  canvasRef: RefObject<HTMLDivElement | null>;
  css: string;
  selectedNodeId: string | null;
  onChange: (css: string) => void;
};

function labelFor(element: Element): string {
  if (element.hasAttribute('data-cms-page')) return 'Whole page';
  const name = element.getAttribute('data-cms-node') ?? element.getAttribute('data-cms-chrome') ?? element.getAttribute('class')?.split(' ').filter((name) => !name.startsWith('page-builder-'))[0] ?? '';
  const copy = element.getAttribute('alt') ?? element.getAttribute('aria-label') ?? element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 48) ?? '';
  return `${element.localName}${name ? ` · ${name}` : ''}${copy ? ` — ${copy}` : ''}`;
}

export function ElementCssEditor({ canvasRef, css, selectedNodeId, onChange }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selector, setSelector] = useState(selectedNodeId ? blockCssSelector(selectedNodeId) : '[data-cms-page]');
  const [picking, setPicking] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invalidInput, setInvalidInput] = useState<string | null>(null);
  let saved = '';
  let markerError = '';
  try { saved = readElementCss(css, selector); } catch (caught) { markerError = (caught as Error).message; }
  const draft = invalidInput ?? (saved || `${selector} {\n  /* Add CSS properties here */\n}\n`);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const refresh = () => {
      const root = canvas.querySelector('[data-cms-page]');
      if (!root) return;
      const elements = [root, ...root.querySelectorAll('*')].filter((element) => !element.matches('style, script, br, [data-cms-editor-only]') && !element.closest('[data-cms-editor-only]'));
      setTargets(elements.map((element) => ({ selector: elementSelector(element, root), label: labelFor(element) })));
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(canvas, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [canvasRef]);

  const choose = useCallback((nextSelector: string) => {
    setSelector(nextSelector);
    setInvalidInput(null);
    setError('');
    setNotice('');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !picking) return;
    const pick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      const root = element?.closest('[data-cms-page]');
      if (!element || !root || element.closest('[data-cms-editor-only]')) return;
      event.preventDefault();
      event.stopPropagation();
      choose(elementSelector(element, root));
      setPicking(false);
    };
    canvas.addEventListener('click', pick, true);
    canvas.classList.add('visual-css-picking');
    return () => {
      canvas.removeEventListener('click', pick, true);
      canvas.classList.remove('visual-css-picking');
    };
  }, [canvasRef, picking, choose]);

  const changeRules = (rules: string) => {
    try {
      onChange(writeElementCss(css, selector, rules));
      setInvalidInput(null);
      setError('');
      setNotice('Preview updated. Save draft to keep it, then Publish to make it live.');
    } catch (caught) {
      setInvalidInput(rules);
      setError((caught as Error).message);
    }
  };
  const reserved = new Set(LIVE_ONLY_TARGETS.map((target) => target.selector));
  const extraTargets = savedElementSelectors(css).filter((item) => !reserved.has(item) && !targets.some((target) => target.selector === item));
  if (!reserved.has(selector) && !targets.some((item) => item.selector === selector) && !extraTargets.includes(selector)) extraTargets.push(selector);

  return (
    <section className="visual-element-css visual-page-css" aria-label="Element CSS editor">
      <div className="visual-page-css-heading">
        <div><strong><Code2 size={16} /> Element CSS</strong><p>Pick an element or choose from the list, including hidden elements. Edit its CSS below.</p></div>
        <button type="button" className={`admin-btn admin-btn-secondary ${picking ? 'active' : ''}`} aria-pressed={picking} onClick={() => setPicking(!picking)}><MousePointer2 size={16} /> {picking ? 'Picking… click the page' : 'Pick element'}</button>
      </div>
      <label className="visual-field"><span>Element</span><select value={selector} onChange={(event) => { choose(event.target.value); setPicking(false); }}>
        {targets.map((target) => <option key={target.selector} value={target.selector}>{target.label}</option>)}
        {extraTargets.map((target) => <option key={target} value={target}>Saved selector · {target}</option>)}
        {LIVE_ONLY_TARGETS.map((target) => <option key={target.selector} value={target.selector}>{target.label}</option>)}
      </select></label>
      <div className="visual-css-selector"><code>{selector}</code><button type="button" className="admin-btn admin-btn-ghost" onClick={() => { void navigator.clipboard.writeText(selector).then(() => setNotice('Selector copied.'), () => setError('Select and copy the selector above.')); }}><Copy size={14} /> Copy selector</button></div>
      <label className="visual-field"><span>CSS rules</span><textarea aria-label="Selected element CSS" className="visual-page-css-input" value={draft} spellCheck={false} onChange={(event) => changeRules(event.target.value)} /></label>
      <div className="visual-page-css-footer"><small>Use the selector with :hover, ::before, ::after, or inside @media rules. Block selectors follow moved blocks; repeated child selectors follow item order.</small><button className="admin-btn admin-btn-ghost" type="button" disabled={!saved && invalidInput === null} onClick={() => changeRules('')}>Reset element CSS</button></div>
      <p role={error || markerError ? 'alert' : 'status'} className={error || markerError ? 'visual-css-error' : 'visual-css-notice'}>{error || markerError || notice || 'Changes stay in the draft until you publish this page.'}</p>
    </section>
  );
}

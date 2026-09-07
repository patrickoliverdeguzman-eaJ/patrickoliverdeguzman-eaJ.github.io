/** Element rules share the page's existing CSS storage, revision and publish
 * lifecycle. Delimited sections let the inspector update one selection without
 * replacing hand-written page CSS or rules for other elements. */
const END = '/* /cms-element */';
const LIMIT = 80_000;

function marker(selector: string): string {
  return `/* cms-element:${encodeURIComponent(selector)} */`;
}

function range(css: string, selector: string): [number, number, number] | null {
  const start = css.indexOf(marker(selector));
  if (start < 0) return null;
  const body = start + marker(selector).length;
  const end = css.indexOf(END, body);
  if (end < 0) throw new Error('This element’s CSS marker was edited. Repair it in Page CSS before continuing.');
  return [start, body, end];
}

export function readElementCss(css: string, selector: string): string {
  const bounds = range(css, selector);
  return bounds ? css.slice(bounds[1] + 1, bounds[2] - 1) : '';
}

export function writeElementCss(css: string, selector: string, rules: string): string {
  if (/<\s*\/?\s*style\b/i.test(rules)) throw new Error('Enter CSS rules without <style> tags.');
  if (/\/\*\s*\/?cms-element\b/.test(rules)) throw new Error('Element markers are managed automatically. Enter only CSS rules here.');
  const bounds = range(css, selector);
  const replacement = rules.trim() ? `${marker(selector)}\n${rules}\n${END}` : '';
  const next = bounds
    ? css.slice(0, bounds[0]) + replacement + css.slice(bounds[2] + END.length)
    : css + (css && replacement ? '\n\n' : '') + replacement;
  if (next.length > LIMIT) throw new Error('This page has reached its 80,000 character CSS limit. Shorten or remove a rule first.');
  return next;
}

export function savedElementSelectors(css: string): string[] {
  return Array.from(css.matchAll(/\/\* cms-element:([^\s]+) \*\//g), (match) => {
    try { return decodeURIComponent(match[1]); } catch { return ''; }
  }).filter(Boolean);
}

// Quote CSS attribute values without relying on DOM APIs during rendering.
function quoted(value: string): string {
  return `"${value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character.codePointAt(0)!.toString(16)} `)}"`;
}

export function blockCssSelector(nodeId: string): string {
  return `[data-cms-page] [data-cms-node=${quoted(nodeId)}]`;
}

export function elementSelector(element: Element, root: Element): string {
  if (!root.contains(element)) throw new Error('Choose an element in the page preview.');
  const block = element.closest('[data-cms-node]');
  const parts: string[] = [];
  let cursor: Element | null = element;
  while (cursor && cursor !== root) {
    const nodeId = cursor.getAttribute('data-cms-node');
    if (nodeId) return `${blockCssSelector(nodeId)}${parts.length ? ' > ' + parts.join(' > ') : ''}`;
    const chrome = cursor.getAttribute('data-cms-chrome');
    if (chrome && !block) return `[data-cms-page] [data-cms-chrome=${quoted(chrome)}]${parts.length ? ' > ' + parts.join(' > ') : ''}`;
    const tag = cursor.localName;
    const itemId = cursor.getAttribute('data-cms-item');
    const peers = Array.from(cursor.parentElement?.children ?? []).filter((sibling) => sibling.localName === tag);
    parts.unshift(chrome ? `${tag}[data-cms-chrome=${quoted(chrome)}]` : itemId ? `${tag}[data-cms-item=${quoted(itemId)}]` : `${tag}:nth-of-type(${peers.indexOf(cursor) + 1})`);
    cursor = cursor.parentElement;
  }
  return `[data-cms-page]${parts.length ? ' > ' + parts.join(' > ') : ''}`;
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readElementCss, writeElementCss, savedElementSelectors, elementSelector } from '../lib/element-css.ts';

const heading = '[data-cms-page] [data-cms-node="hero"] > h1:nth-of-type(1)';
const button = '[data-cms-page] [data-cms-node="hero"] > a:nth-of-type(1)';

test('element edits preserve hand-written CSS and independent rules through CMS JSON storage', () => {
  const original = '/* Existing site design */\n.hero { min-height: 700px; }\n';
  const rules = `${heading} { color: red; }\n@media (max-width: 620px) { ${heading} { font-size: 2rem; } }\n${heading}::before { content: "Hello"; }\n`;
  const first = writeElementCss(original, heading, rules);
  const second = writeElementCss(first, button, `${button}:hover { opacity: .8; }`);
  const reloaded = JSON.parse(JSON.stringify({ customCss: second })).customCss;
  assert.ok(reloaded.startsWith(original));
  assert.equal(readElementCss(reloaded, heading), rules);
  assert.equal(readElementCss(reloaded, button), `${button}:hover { opacity: .8; }`);
  assert.deepEqual(savedElementSelectors(reloaded), [heading, button]);
  const changed = writeElementCss(reloaded, heading, `${heading} { color: blue; }`);
  assert.equal(readElementCss(changed, heading), `${heading} { color: blue; }`);
  assert.equal(readElementCss(changed, button), readElementCss(reloaded, button));
  assert.equal(readElementCss(writeElementCss(changed, heading, ''), button), readElementCss(reloaded, button));
  assert.equal(readElementCss(first, heading), rules, 'earlier undo/revision snapshots are unchanged');
});

test('unfinished whitespace survives typing and dangerous markup or oversized edits are rejected', () => {
  const rules = `${heading} {\n  color: red;\n  `;
  assert.equal(readElementCss(writeElementCss('', heading, rules), heading), rules);
  assert.throws(() => writeElementCss('', heading, '</style><script>alert(1)</script>'), /without <style>/);
  assert.throws(() => writeElementCss('', heading, '/* /cms-element */'), /managed automatically/);
  assert.throws(() => writeElementCss(' '.repeat(80_000), heading, 'a{}'), /80,000/);
  assert.throws(() => readElementCss(`/* cms-element:${encodeURIComponent(heading)} */`, heading), /marker was edited/);
});

// A minimal DOM fixture exercises ancestor/sibling selection without starting a
// browser or introducing a test dependency to the deployed application.
class ElementFixture {
  children = [];
  parentElement = null;
  constructor(localName, attributes = {}, children = []) {
    this.localName = localName;
    this.attributes = attributes;
    for (const child of children) this.append(child);
  }
  append(child) { child.parentElement = this; this.children.push(child); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  contains(element) { return element === this || this.children.some((child) => child.contains(element)); }
  closest(selector) {
    const attribute = selector.slice(1, -1);
    return this.getAttribute(attribute) !== null ? this : this.parentElement?.closest(selector) ?? null;
  }
}

test('nested targets remain tied to their block when that block is reordered', () => {
  const first = new ElementFixture('h2');
  const second = new ElementFixture('h2');
  const hero = new ElementFixture('section', { 'data-cms-node': 'hero' }, [first, second]);
  const slot = new ElementFixture('div', {}, [hero]);
  const root = new ElementFixture('main', { 'data-cms-page': '' }, [slot]);
  const selector = elementSelector(second, root);
  assert.equal(selector, '[data-cms-page] [data-cms-node="hero"] > h2:nth-of-type(2)');
  root.children.unshift(new ElementFixture('section'));
  assert.equal(elementSelector(second, root), selector);
  assert.equal(elementSelector(root, root), '[data-cms-page]');
  assert.throws(() => elementSelector(new ElementFixture('div'), root), /page preview/);
});

test('header, footer, keyed links, and SVG descendants have precise selectors', () => {
  const iconPath = new ElementFixture('path');
  const icon = new ElementFixture('svg', {}, [iconPath]);
  const link = new ElementFixture('a', { 'data-cms-item': 'contact' }, [icon]);
  const nav = new ElementFixture('nav', { 'data-cms-chrome': 'header' }, [link]);
  const footerText = new ElementFixture('p');
  const footer = new ElementFixture('footer', { 'data-cms-chrome': 'footer' }, [footerText]);
  const root = new ElementFixture('main', { 'data-cms-page': '' }, [nav, footer]);
  assert.equal(elementSelector(iconPath, root), '[data-cms-page] [data-cms-chrome="header"] > a[data-cms-item="contact"] > svg:nth-of-type(1) > path:nth-of-type(1)');
  assert.equal(elementSelector(footerText, root), '[data-cms-page] [data-cms-chrome="footer"] > p:nth-of-type(1)');
  const hero = new ElementFixture('section', { 'data-cms-node': 'hero-two' }, [nav]);
  root.append(hero);
  assert.equal(elementSelector(link, root), '[data-cms-page] [data-cms-node="hero-two"] > nav[data-cms-chrome="header"] > a[data-cms-item="contact"]');
});

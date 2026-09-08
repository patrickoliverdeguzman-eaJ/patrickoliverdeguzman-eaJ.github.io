import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createBuilderNode, emptyBuilderPage, reindexBuilderPage } from '../lib/page-builder.ts';

const api = process.env.CMS_ACCEPTANCE_API ?? 'http://127.0.0.1:8787';
const site = process.env.CMS_ACCEPTANCE_SITE ?? 'http://localhost:3000';
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9300 + (process.pid % 300);
const profile = join(process.cwd(), '.wrangler', `dnd-browser-profile-${process.pid}`);
const screenshotPath = join(process.cwd(), '.wrangler', 'dnd-editor.png');

async function json(path, options = {}) {
  const response = await fetch(`${api}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${body.error ?? 'request failed'}`);
  return body;
}

const session = await json('/v1/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'acceptance@local.test', password: 'LocalAcceptance!2026' }),
});
const headers = { 'Content-Type': 'application/json', authorization: `Bearer ${session.token}` };
const listing = await json('/v1/admin/documents?limit=100', { headers });
let home = listing.documents.find((document) => document.type === 'builder_page' && document.slug === 'home');
const page = emptyBuilderPage();
page.slots.afterHero = [createBuilderNode('site_header'), createBuilderNode('brand_hero')];
page.slots.afterSolutions = [createBuilderNode('solution_grid')];
page.slots.afterServices = [createBuilderNode('service_list')];
page.slots.afterContent = [createBuilderNode('contact_panel'), createBuilderNode('site_footer')];
const baseline = reindexBuilderPage(page);
if (!home) {
  const created = await json('/v1/admin/documents', {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'builder_page', title: 'Home', slug: 'home', data: baseline, note: 'Browser drag acceptance fixture' }),
  });
  home = created.document;
} else {
  const reset = await json(`/v1/admin/documents/${home.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ title: home.title, slug: home.slug, data: baseline, note: 'Reset browser drag acceptance fixture' }),
  });
  home = reset.document;
}

await mkdir(profile, { recursive: true });
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    if (targets[0]?.webSocketDebuggerUrl) break;
  } catch {}
  await pause(100);
}

const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');
assert.ok(target?.webSocketDebuggerUrl, 'Chrome DevTools target was not available');
const socket = new WebSocket(target.webSocketDebuggerUrl);
socket.binaryType = 'arraybuffer';
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let commandId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8'));
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});
socket.addEventListener('close', () => {
  for (const { reject } of pending.values()) reject(new Error('Chrome DevTools connection closed'));
  pending.clear();
});
function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function mouse(type, x, y, buttons = 0) {
  await command('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1 });
}
async function key(keyValue, code = keyValue) {
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: keyValue, code });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: keyValue, code });
  await pause(180);
}
async function dragFromTo(startExpression, targetExpression) {
  const start = await evaluate(startExpression);
  await mouse('mousePressed', start.x, start.y, 1);
  await mouse('mouseMoved', start.x, start.y + 20, 1);
  await pause(250);
  const targetPoint = await evaluate(targetExpression);
  await mouse('mouseMoved', targetPoint.x, targetPoint.y, 1);
  await pause(180);
  await mouse('mouseReleased', targetPoint.x, targetPoint.y);
  await pause(1800);
}
const slotIdsExpression = (slot) =>
  `[...document.querySelectorAll('[data-builder-slot="${slot}"] > .builder-sortable-position > .builder-drag-shell')].map((item) => item.dataset.builderSortId)`;
const handlePointExpression = (nodeId) =>
  `(() => { const r = document.querySelector('[data-builder-sort-id="${nodeId}"] > .builder-block-drag-handle').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`;
const zonePointExpression = (slot, index) =>
  `(() => { const r = document.querySelector('[data-builder-insert-slot="${slot}"][data-builder-insert-parent="root"][data-builder-insert-index="${index}"]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`;

try {
  await command('Page.enable');
  await command('Runtime.enable');
  // Keep the first two full-size canvas blocks and their insertion zone in the
  // viewport so this assertion measures sorting rather than off-screen pointer
  // clamping. Auto-scroll remains enabled in the editor for normal viewports.
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 2400, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: `${site}/admin/login` });
  await pause(700);
  await evaluate(`localStorage.setItem('cms_token', ${JSON.stringify(session.token)})`);
  await command('Page.navigate', { url: `${site}/admin/visual-editor` });
  await pause(2500);

  const initial = await evaluate(`(() => ({
    handles: document.querySelectorAll('.builder-block-drag-handle').length,
    libraries: document.querySelectorAll('.visual-builder-elements [data-cms-builder-library]').length,
    blocks: [...document.querySelectorAll('[data-builder-slot="afterHero"] > .builder-sortable-position > .builder-drag-shell')].map((item) => item.dataset.builderSortId),
    body: document.body.innerText
  }))()`);
  console.log(JSON.stringify({ initial }, null, 2));
  assert.ok(initial.handles >= 2, 'Canvas drag handles did not render');
  assert.match(initial.body, /STRUCTURED BUILDER/);

  const firstId = initial.blocks[0];
  const secondId = initial.blocks[1];
  await dragFromTo(handlePointExpression(firstId), zonePointExpression('afterHero', 2));
  const moved = await evaluate(slotIdsExpression('afterHero'));
  assert.deepEqual(moved.slice(0, 2), [secondId, firstId]);

  const libraryStart = `(() => { const r = document.querySelector('[data-cms-builder-library="section"]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`;
  await dragFromTo(libraryStart, zonePointExpression('afterHero', 1));
  const afterLibraryDrop = await evaluate(slotIdsExpression('afterHero'));
  assert.equal(afterLibraryDrop.length, 3);
  assert.equal(afterLibraryDrop[0], secondId);
  assert.equal(afterLibraryDrop[2], firstId);
  const createdId = afterLibraryDrop[1];
  assert.ok(createdId && createdId !== firstId && createdId !== secondId, 'Library drop did not instantiate a unique block');

  await evaluate(`document.querySelector('[data-builder-sort-id="${firstId}"] > .builder-block-drag-handle').focus()`);
  await key(' ', 'Space');
  await key('ArrowUp');
  await key('ArrowUp');
  await key(' ', 'Space');
  await pause(1800);
  const afterKeyboardMove = await evaluate(slotIdsExpression('afterHero'));
  assert.deepEqual(afterKeyboardMove, [secondId, firstId, createdId]);

  await evaluate(`document.querySelector('button[title="Mobile preview"]').click()`);
  await pause(300);
  await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const touchStart = await evaluate(handlePointExpression(secondId));
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchStart.x, y: touchStart.y }] });
  await pause(220);
  await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchStart.x, y: touchStart.y + 24 }] });
  await pause(250);
  const touchTarget = await evaluate(zonePointExpression('afterHero', 2));
  await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchTarget.x, y: touchTarget.y }] });
  await pause(220);
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(1800);
  const afterTouchMove = await evaluate(slotIdsExpression('afterHero'));
  assert.deepEqual(afterTouchMove, [firstId, secondId, createdId]);
  await command('Emulation.setTouchEmulationEnabled', { enabled: false });
  await evaluate(`document.querySelector('button[title="Desktop preview"]').click()`);
  await pause(300);

  const saved = await json(`/v1/admin/documents/${home.id}`, { headers });
  assert.deepEqual(saved.document.data.slots.afterHero.map((node) => node.id), afterTouchMove);
  assert.deepEqual(saved.document.data.slots.afterHero.map((node) => node.sortIndex), [0, 1, 2]);
  const originalHeader = baseline.slots.afterHero.find((node) => node.id === firstId);
  const movedHeader = saved.document.data.slots.afterHero.find((node) => node.id === firstId);
  assert.deepEqual(movedHeader.props, originalHeader.props);
  assert.deepEqual(movedHeader.styles, originalHeader.styles);
  assert.deepEqual(movedHeader.responsive, originalHeader.responsive);

  await command('Page.navigate', { url: `${site}/admin/visual-editor` });
  await pause(2500);
  const refreshed = await evaluate(slotIdsExpression('afterHero'));
  assert.deepEqual(refreshed, afterTouchMove);

  await json(`/v1/admin/documents/${home.id}/publish`, { method: 'POST', headers });
  const published = await json('/v1/content/builder_page/home');
  assert.deepEqual(published.document.data.slots.afterHero.map((node) => node.id), afterTouchMove);
  await command('Page.navigate', { url: `${site}/` });
  await pause(2500);
  const publicOrder = await evaluate(`[...document.querySelectorAll('[data-builder-slot="afterHero"] > [data-cms-node]')].map((item) => item.dataset.cmsNode)`);
  assert.deepEqual(publicOrder, afterTouchMove);

  await command('Page.navigate', { url: `${site}/admin/visual-editor` });
  await pause(2500);

  const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'));
  console.log(JSON.stringify({
    passed: true,
    handles: initial.handles,
    libraryBlocks: initial.libraries,
    moved: [secondId, firstId],
    createdId,
    keyboardMove: afterKeyboardMove,
    touchMove: afterTouchMove,
    refreshed: true,
    persisted: true,
    publishedOrderVerified: true,
    screenshotPath,
  }, null, 2));
} finally {
  socket.close();
  chrome.kill();
}

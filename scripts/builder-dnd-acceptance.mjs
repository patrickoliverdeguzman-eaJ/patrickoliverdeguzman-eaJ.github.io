import assert from 'node:assert/strict';
import {
  appendBuilderNode,
  canInsertBuilderNodeAtLocation,
  createBuilderNode,
  emptyBuilderPage,
  findBuilderNode,
  insertBuilderNodeAtLocation,
  moveBuilderNodeToLocation,
  normaliseBuilderPage,
} from '../lib/page-builder.ts';

function ids(nodes) {
  return nodes.map((node) => node.id);
}

let page = emptyBuilderPage();
const first = createBuilderNode('section');
const second = createBuilderNode('section');
const last = createBuilderNode('section');
first.props = { label: 'First', preserved: 'content and metadata' };
first.styles = { ...first.styles, customClass: 'preserved-class' };
first.responsive = { ...first.responsive, mobileAlign: 'center' };
page = appendBuilderNode(page, 'afterHero', first);
page = appendBuilderNode(page, 'afterHero', second);
page = appendBuilderNode(page, 'afterHero', last);

// 1. First below second.
page = moveBuilderNodeToLocation(page, first.id, { slot: 'afterHero', parentId: null, index: 2 });
assert.deepEqual(ids(page.slots.afterHero), [second.id, first.id, last.id]);

// 2. Last to top.
page = moveBuilderNodeToLocation(page, last.id, { slot: 'afterHero', parentId: null, index: 0 });
assert.deepEqual(ids(page.slots.afterHero), [last.id, second.id, first.id]);

// 3. Library block instantiated between two existing blocks with a new id.
const inserted = createBuilderNode('text');
page = insertBuilderNodeAtLocation(page, inserted, { slot: 'afterHero', parentId: null, index: 1 });
assert.deepEqual(ids(page.slots.afterHero), [last.id, inserted.id, second.id, first.id]);
assert.notEqual(inserted.id, first.id);

// 4. Move between valid nested sections without cloning the source.
const left = createBuilderNode('container');
const right = createBuilderNode('container');
const nested = createBuilderNode('heading');
nested.props = { text: 'Stable nested content', level: 2 };
page = appendBuilderNode(page, 'afterContent', left);
page = appendBuilderNode(page, 'afterContent', right);
page = appendBuilderNode(page, 'afterContent', nested, left.id);
page = moveBuilderNodeToLocation(page, nested.id, { slot: 'afterContent', parentId: right.id, index: 0 });
assert.equal(findBuilderNode(page, left.id)?.children.length, 0);
assert.deepEqual(ids(findBuilderNode(page, right.id)?.children ?? []), [nested.id]);

// 5–7. JSON round-trip keeps order, ids, settings and responsive/CSS metadata.
const refreshed = normaliseBuilderPage(JSON.parse(JSON.stringify(page)));
assert.deepEqual(ids(refreshed.slots.afterHero), [last.id, inserted.id, second.id, first.id]);
assert.equal(findBuilderNode(refreshed, first.id)?.props.preserved, 'content and metadata');
assert.equal(findBuilderNode(refreshed, first.id)?.styles.customClass, 'preserved-class');
assert.equal(findBuilderNode(refreshed, first.id)?.responsive.mobileAlign, 'center');
assert.deepEqual(refreshed.slots.afterHero.map((node) => node.sortIndex), [0, 1, 2, 3]);

// Published rendering normalisation follows persisted sortIndex, never type.
const stored = structuredClone(refreshed);
stored.slots.afterHero = [stored.slots.afterHero[3], stored.slots.afterHero[0], stored.slots.afterHero[2], stored.slots.afterHero[1]];
assert.deepEqual(ids(normaliseBuilderPage(stored).slots.afterHero), [last.id, inserted.id, second.id, first.id]);

// Named nested blocks are real draggable nodes with strict valid locations.
const legacy = emptyBuilderPage();
const solutionGrid = createBuilderNode('solution_grid');
const serviceList = createBuilderNode('service_list');
legacy.slots.afterSolutions = [solutionGrid];
legacy.slots.afterServices = [serviceList];
const nestedPage = normaliseBuilderPage(legacy);
const solution = nestedPage.slots.afterSolutions[0].children[0];
const service = nestedPage.slots.afterServices[0].children[0];
assert.equal(solution.type, 'solution_card');
assert.equal(service.type, 'service_row');
assert.equal(canInsertBuilderNodeAtLocation(nestedPage, 'solution_card', { slot: 'afterHero', parentId: null, index: 0 }), false);
assert.equal(canInsertBuilderNodeAtLocation(nestedPage, 'solution_card', { slot: 'afterSolutions', parentId: solutionGrid.id, index: 1 }), true);
assert.equal(canInsertBuilderNodeAtLocation(nestedPage, 'service_row', { slot: 'afterServices', parentId: serviceList.id, index: 1 }), true);

console.log('Builder drag-and-drop acceptance passed.');

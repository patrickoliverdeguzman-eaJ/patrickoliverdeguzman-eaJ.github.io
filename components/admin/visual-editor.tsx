'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Box,
  Code2,
  ChevronDown,
  Columns3,
  Copy,
  GripVertical,
  Heading,
  History as HistoryIcon,
  Image as ImageIcon,
  Layers3,
  Minus,
  Monitor,
  MousePointer2,
  Plus,
  Redo2,
  Save,
  Send,
  Smartphone,
  Tablet,
  Text,
  Undo2,
} from 'lucide-react';
import { CMS_API } from '@/lib/cms-api';
import { adminPath } from '@/lib/site-paths';
import { CmsSitePage } from '@/components/cms-site-page';
import { CustomPageLayout } from '@/components/custom-page-layout';
import { ElementCssEditor } from '@/components/admin/element-css-editor';
import { BuilderStyleControls } from '@/components/admin/builder-style-controls';
import {
  appendBuilderNode,
  BUILDER_NODE_TYPES,
  BUILDER_SLOTS,
  cloneBuilderNode,
  canContainBuilderChildren,
  createPageFromBrief,
  type BuilderNode,
  type BuilderPage,
  type BuilderNodeType,
  createBuilderNode,
  duplicateBuilderNode,
  emptyBuilderPage,
  findBuilderNode,
  moveBuilderNode,
  normaliseBuilderPage,
  removeBuilderNode,
  updateBuilderNode,
} from '@/lib/page-builder';
import siteContentSeed from '@/cms-worker/seed/site-content.json';
import {
  DEFAULT_HOME,
  DEFAULT_DESIGN_SYSTEM,
  DEFAULT_PARTNERS,
  createHomeBuilderPage,
  createPartnersBuilderPage,
  designVariables,
  designSystemFromDoc,
  type ClientContent,
  type DesignSystem,
  type PartnerContent,
  type SolutionContent,
} from '@/lib/site-content';

type CmsDocument = {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  data: Record<string, unknown>;
  publishedData: Record<string, unknown> | null;
  updatedAt: string;
  scheduledAt?: string | null;
};

type MediaAsset = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
};
type PageKey = 'home' | 'partners';
type Device = 'desktop' | 'tablet' | 'mobile';
type FieldRef = { documentId: string; key: string };
type HeaderLink = { id: string; label: string; href: string; enabled: boolean; parentId?: string };

type Layer = {
  id: string;
  label: string;
  type: string;
  slug?: string;
  repeating?: boolean;
  locked?: boolean;
};

const PAGE_LAYERS: Record<PageKey, Layer[]> = {
  home: [
    { id: 'global', label: 'Global header & footer', type: 'site_settings', slug: 'global', locked: true },
    { id: 'navigation', label: 'Navigation', type: 'navigation', slug: 'main' },
  ],
  partners: [
    { id: 'global', label: 'Global header & footer', type: 'site_settings', slug: 'global', locked: true },
    { id: 'navigation', label: 'Navigation', type: 'navigation', slug: 'main' },
  ],
};
type CmsRevision = { id: string; revisionNumber: number; title: string; note?: string; createdAt: string };

const DEFAULT_DATA: Record<string, Record<string, unknown>> = {
  solution: { description: '', items: [] },
  service: { description: '' },
  partner: { focus: '', website: '' },
  client: { logo: '', website: '' },
};

const DESIGN_BLOCKS: Array<{ type: BuilderNodeType; label: string; Icon: typeof Box }> = [
  { type: 'brand_hero', label: 'Brand hero', Icon: Layers3 },
  { type: 'home_intro', label: 'Editorial intro', Icon: Text },
  { type: 'split_intro', label: 'Split introduction', Icon: Text },
  { type: 'principle_grid', label: 'Principle grid', Icon: Columns3 },
  { type: 'solution_grid', label: 'Solution grid', Icon: Box },
  { type: 'continuity_panel', label: 'Continuity panel', Icon: Layers3 },
  { type: 'service_list', label: 'Service list', Icon: Text },
  { type: 'tag_band', label: 'Tag band', Icon: Box },
  { type: 'contact_panel', label: 'Contact panel', Icon: MousePointer2 },
  { type: 'partner_directory', label: 'Partner directory', Icon: Box },
  { type: 'logo_grid', label: 'Logo grid', Icon: ImageIcon },
  { type: 'method_list', label: 'Method list', Icon: Text },
  { type: 'partner_contact', label: 'Partner CTA', Icon: MousePointer2 },
];

const BUILDER_LIBRARY_GROUPS: Array<{ label: string; items: Array<{ type: BuilderNodeType; label: string; Icon: typeof Box }> }> = [
  { label: 'Layout', items: [
    { type: 'section', label: 'Section', Icon: Box }, { type: 'container', label: 'Container', Icon: Box },
    { type: 'row', label: 'Row', Icon: Columns3 }, { type: 'columns', label: 'Columns', Icon: Columns3 },
    { type: 'column', label: 'Column', Icon: Columns3 }, { type: 'grid', label: 'Grid', Icon: Columns3 },
    { type: 'card', label: 'Card', Icon: Box }, { type: 'divider', label: 'Divider', Icon: Minus }, { type: 'spacer', label: 'Spacer', Icon: Plus },
  ] },
  { label: 'Content', items: [
    { type: 'heading', label: 'Heading', Icon: Heading }, { type: 'text', label: 'Text', Icon: Text },
    { type: 'rich_text', label: 'Rich text', Icon: Text }, { type: 'image', label: 'Image', Icon: ImageIcon },
    { type: 'video', label: 'Video', Icon: ImageIcon }, { type: 'icon', label: 'Icon', Icon: ImageIcon },
    { type: 'button', label: 'Button', Icon: MousePointer2 }, { type: 'link', label: 'Link', Icon: MousePointer2 },
    { type: 'list', label: 'List', Icon: Text },
  ] },
  { label: 'Interface', items: [
    { type: 'badge', label: 'Badge', Icon: Box }, { type: 'accordion', label: 'Accordion', Icon: Layers3 },
    { type: 'tabs', label: 'Tabs', Icon: Layers3 }, { type: 'modal', label: 'Modal', Icon: Layers3 },
    { type: 'alert', label: 'Alert', Icon: Box }, { type: 'tooltip', label: 'Tooltip', Icon: MousePointer2 },
  ] },
  { label: 'Marketing', items: [
    { type: 'cta', label: 'CTA', Icon: MousePointer2 }, { type: 'feature_grid', label: 'Feature grid', Icon: Columns3 },
    { type: 'testimonials', label: 'Testimonials', Icon: Text }, { type: 'statistics', label: 'Statistics', Icon: Columns3 },
    { type: 'pricing', label: 'Pricing', Icon: Columns3 }, { type: 'faq', label: 'FAQ', Icon: Layers3 },
    ...DESIGN_BLOCKS,
  ] },
  { label: 'Navigation', items: [
    { type: 'site_header', label: 'Site header', Icon: Layers3 }, { type: 'menu', label: 'Menu', Icon: Layers3 },
    { type: 'breadcrumb', label: 'Breadcrumb', Icon: Text }, { type: 'site_footer', label: 'Site footer', Icon: Layers3 },
  ] },
  { label: 'Forms', items: [
    { type: 'form', label: 'Form', Icon: Box }, { type: 'input', label: 'Input', Icon: Text },
    { type: 'textarea_field', label: 'Textarea', Icon: Text }, { type: 'select_field', label: 'Select', Icon: Text },
    { type: 'checkbox', label: 'Checkbox', Icon: MousePointer2 }, { type: 'radio_group', label: 'Radio group', Icon: MousePointer2 },
    { type: 'submit', label: 'Submit button', Icon: MousePointer2 },
  ] },
];

type BuilderField = {
  key: string;
  label: string;
  multiline?: boolean;
  kind?: 'text' | 'number' | 'boolean' | 'select' | 'media';
  options?: Array<{ value: string; label: string }>;
};

type RepeaterInput = { label: string; placeholder: string; multiline?: boolean; lineSeparator?: string };
type DesignBlockRepeater = {
  key: string;
  label: string;
  itemLabel: string;
  inputs: RepeaterInput[];
  max?: number;
};

const DESIGN_BLOCK_FIELDS: Partial<Record<BuilderNodeType, BuilderField[]>> = {
  site_header: [
    { key: 'useGlobal', label: 'Use global logo and navigation', kind: 'boolean' }, { key: 'logo', label: 'Override logo', kind: 'media' }, { key: 'mobileLogo', label: 'Override mobile logo', kind: 'media' }, { key: 'logoAlt', label: 'Logo description' },
    { key: 'logoWidth', label: 'Logo width' }, { key: 'mobileLogoWidth', label: 'Mobile logo width' }, { key: 'logoAlignment', label: 'Logo alignment', kind: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] }, { key: 'logoSpacing', label: 'Logo outer spacing' },
    { key: 'links', label: 'Override links — “Label | URL” per line', multiline: true }, { key: 'ctaLabel', label: 'Button label' }, { key: 'ctaHref', label: 'Button destination' },
  ],
  site_footer: [
    { key: 'useGlobal', label: 'Use global footer settings', kind: 'boolean' }, { key: 'logo', label: 'Override logo', kind: 'media' }, { key: 'logoAlt', label: 'Logo description' },
    { key: 'address', label: 'Address' }, { key: 'copyright', label: 'Copyright' }, { key: 'links', label: 'Footer links — “Label | URL” per line', multiline: true },
  ],
  rich_text: [{ key: 'text', label: 'Rich text — blank line starts a paragraph', multiline: true }],
  video: [{ key: 'src', label: 'Video URL' }, { key: 'poster', label: 'Poster image', kind: 'media' }, { key: 'title', label: 'Video title' }, { key: 'controls', label: 'Show playback controls', kind: 'boolean' }],
  icon: [{ key: 'name', label: 'Icon', kind: 'select', options: ['database', 'network', 'server', 'laptop', 'shield', 'cloud', 'code', 'sparkles'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })) }, { key: 'label', label: 'Accessible label' }, { key: 'size', label: 'Size in pixels', kind: 'number' }],
  link: [{ key: 'label', label: 'Link label' }, { key: 'href', label: 'Destination' }, { key: 'external', label: 'Open in a new tab', kind: 'boolean' }],
  list: [{ key: 'items', label: 'List items — one per line', multiline: true }, { key: 'ordered', label: 'Numbered list', kind: 'boolean' }],
  badge: [{ key: 'text', label: 'Badge text' }],
  accordion: [{ key: 'items', label: 'Items — “Question | Answer” per line', multiline: true }],
  tabs: [{ key: 'items', label: 'Tabs — “Label | Content” per line', multiline: true }],
  modal: [{ key: 'triggerLabel', label: 'Open button label' }, { key: 'title', label: 'Modal heading' }, { key: 'body', label: 'Modal content', multiline: true }],
  alert: [{ key: 'title', label: 'Alert heading' }, { key: 'body', label: 'Alert message', multiline: true }, { key: 'variant', label: 'Treatment', kind: 'select', options: [{ value: 'info', label: 'Information' }, { value: 'warning', label: 'Warning' }, { value: 'success', label: 'Success' }] }],
  tooltip: [{ key: 'label', label: 'Visible label' }, { key: 'tip', label: 'Tooltip text', multiline: true }],
  cta: [{ key: 'eyebrow', label: 'Eyebrow' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'primaryLabel', label: 'Primary button label' }, { key: 'primaryHref', label: 'Primary destination' }, { key: 'secondaryLabel', label: 'Secondary button label' }, { key: 'secondaryHref', label: 'Secondary destination' }],
  feature_grid: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'items', label: 'Features — “Title | Description” per line', multiline: true }],
  testimonials: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'items', label: 'Testimonials — “Quote | Name | Role” per line', multiline: true }],
  statistics: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'items', label: 'Statistics — “Value | Label” per line', multiline: true }],
  pricing: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'items', label: 'Plans — “Name | Price | Feature; Feature | Button” per line', multiline: true }],
  faq: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'items', label: 'Questions — “Question | Answer” per line', multiline: true }],
  menu: [{ key: 'label', label: 'Menu name' }, { key: 'items', label: 'Links — “Label | URL” per line', multiline: true }],
  breadcrumb: [{ key: 'items', label: 'Trail — “Label | URL” per line', multiline: true }],
  form: [{ key: 'title', label: 'Form heading' }, { key: 'action', label: 'Submission URL' }, { key: 'method', label: 'Method', kind: 'select', options: [{ value: 'post', label: 'POST' }, { value: 'get', label: 'GET' }] }, { key: 'successMessage', label: 'Success message', multiline: true }],
  input: [{ key: 'label', label: 'Field label' }, { key: 'name', label: 'Field name' }, { key: 'placeholder', label: 'Placeholder' }, { key: 'inputType', label: 'Input type', kind: 'select', options: ['text', 'email', 'tel', 'url', 'number', 'date'].map((value) => ({ value, label: value })) }, { key: 'required', label: 'Required field', kind: 'boolean' }],
  textarea_field: [{ key: 'label', label: 'Field label' }, { key: 'name', label: 'Field name' }, { key: 'placeholder', label: 'Placeholder' }, { key: 'rows', label: 'Visible rows', kind: 'number' }, { key: 'required', label: 'Required field', kind: 'boolean' }],
  select_field: [{ key: 'label', label: 'Field label' }, { key: 'name', label: 'Field name' }, { key: 'options', label: 'Options — one per line', multiline: true }, { key: 'required', label: 'Required field', kind: 'boolean' }],
  checkbox: [{ key: 'label', label: 'Checkbox label' }, { key: 'name', label: 'Field name' }, { key: 'required', label: 'Required field', kind: 'boolean' }],
  radio_group: [{ key: 'label', label: 'Group label' }, { key: 'name', label: 'Field name' }, { key: 'options', label: 'Options — one per line', multiline: true }, { key: 'required', label: 'Required field', kind: 'boolean' }],
  submit: [{ key: 'label', label: 'Button label' }],
  brand_hero: [
    { key: 'variant', label: 'Hero style (home or partners)' }, { key: 'eyebrow', label: 'Eyebrow' }, { key: 'title', label: 'Heading' }, { key: 'accent', label: 'Heading accent' },
    { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'primaryLabel', label: 'Primary button label' }, { key: 'primaryHref', label: 'Primary button destination' },
    { key: 'secondaryLabel', label: 'Secondary button label' }, { key: 'secondaryHref', label: 'Secondary button destination' }, { key: 'logo', label: 'Logo or stage image URL' }, { key: 'capabilities', label: 'Capability labels — one per line', multiline: true },
  ],
  home_intro: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'accent', label: 'Heading accent' },
    { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'linkLabel', label: 'Link label' }, { key: 'linkHref', label: 'Link destination' }, { key: 'items', label: 'Principles — one “Title | Description” per line', multiline: true },
  ],
  split_intro: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'accent', label: 'Heading accent' },
    { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'linkLabel', label: 'Link label' }, { key: 'linkHref', label: 'Link destination' },
  ],
  principle_grid: [{ key: 'items', label: 'Principles — one “Title | Description” per line', multiline: true }],
  solution_grid: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true },
    { key: 'items', label: 'Solutions — “Title | Description | Feature; Feature” per line', multiline: true },
  ],
  continuity_panel: [
    { key: 'eyebrow', label: 'Eyebrow' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true },
    { key: 'ctaLabel', label: 'Button label' }, { key: 'ctaHref', label: 'Button destination' },
  ],
  service_list: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true },
    { key: 'items', label: 'Services — one per line', multiline: true }, { key: 'href', label: 'Service destination' },
  ],
  tag_band: [{ key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'tags', label: 'Tags — one per line', multiline: true }],
  contact_panel: [
    { key: 'eyebrow', label: 'Eyebrow' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true },
    { key: 'primaryLabel', label: 'Primary button label' }, { key: 'primaryHref', label: 'Primary button destination' }, { key: 'secondaryLabel', label: 'Secondary button label' }, { key: 'secondaryHref', label: 'Secondary button destination' },
  ],
  partner_directory: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'note', label: 'Supporting note', multiline: true },
    { key: 'items', label: 'Partners — “Name | Focus” per line', multiline: true },
  ],
  logo_grid: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true },
    { key: 'items', label: 'Clients — “Name | Logo URL” per line', multiline: true },
  ],
  method_list: [
    { key: 'kicker', label: 'Kicker' }, { key: 'heading', label: 'Heading' }, { key: 'items', label: 'Methods — “Title | Description” per line', multiline: true },
  ],
  partner_contact: [
    { key: 'eyebrow', label: 'Eyebrow' }, { key: 'heading', label: 'Heading' }, { key: 'body', label: 'Supporting copy', multiline: true }, { key: 'ctaLabel', label: 'Button label' }, { key: 'ctaHref', label: 'Button destination' },
  ],
};

// Repeating CMS fields used to be edited as pipe-separated text. Keep the
// compact value format for compatibility with the renderer, but present it as
// simple rows and fields so an editor never needs to learn that syntax.
const DESIGN_BLOCK_REPEATERS: Partial<Record<BuilderNodeType, DesignBlockRepeater>> = {
  accordion: { key: 'items', label: 'Accordion items', itemLabel: 'item', inputs: [{ label: 'Question', placeholder: 'Add a question' }, { label: 'Answer', placeholder: 'Add the answer', multiline: true }] },
  tabs: { key: 'items', label: 'Tabs', itemLabel: 'tab', inputs: [{ label: 'Tab label', placeholder: 'Overview' }, { label: 'Content', placeholder: 'Add tab content', multiline: true }] },
  feature_grid: { key: 'items', label: 'Features', itemLabel: 'feature', inputs: [{ label: 'Title', placeholder: 'Feature title' }, { label: 'Description', placeholder: 'Describe the feature', multiline: true }] },
  testimonials: { key: 'items', label: 'Testimonials', itemLabel: 'testimonial', inputs: [{ label: 'Quote', placeholder: 'Customer quote', multiline: true }, { label: 'Name', placeholder: 'Client name' }, { label: 'Role or company', placeholder: 'Role or company' }] },
  statistics: { key: 'items', label: 'Statistics', itemLabel: 'statistic', inputs: [{ label: 'Value', placeholder: '99.9%' }, { label: 'Label', placeholder: 'Availability' }] },
  pricing: { key: 'items', label: 'Plans', itemLabel: 'plan', inputs: [{ label: 'Name', placeholder: 'Essential' }, { label: 'Price', placeholder: 'Contact us' }, { label: 'Features', placeholder: 'One feature per line', multiline: true, lineSeparator: ';' }, { label: 'Button label', placeholder: 'Talk to us' }] },
  faq: { key: 'items', label: 'Questions', itemLabel: 'question', inputs: [{ label: 'Question', placeholder: 'How do we begin?' }, { label: 'Answer', placeholder: 'Add the answer', multiline: true }] },
  menu: { key: 'items', label: 'Menu links', itemLabel: 'link', inputs: [{ label: 'Label', placeholder: 'Partners' }, { label: 'Destination', placeholder: '/partners' }] },
  breadcrumb: { key: 'items', label: 'Breadcrumbs', itemLabel: 'crumb', inputs: [{ label: 'Label', placeholder: 'Home' }, { label: 'Destination', placeholder: '/' }] },
  brand_hero: { key: 'capabilities', label: 'Capabilities', itemLabel: 'capability', inputs: [{ label: 'Label', placeholder: 'For example: Data protection' }] },
  home_intro: { key: 'items', label: 'Principles', itemLabel: 'principle', inputs: [{ label: 'Title', placeholder: 'For example: Specialized' }, { label: 'Description', placeholder: 'Describe this principle', multiline: true }] },
  principle_grid: { key: 'items', label: 'Principles', itemLabel: 'principle', inputs: [{ label: 'Title', placeholder: 'For example: Specialized' }, { label: 'Description', placeholder: 'Describe this principle', multiline: true }] },
  solution_grid: { key: 'items', label: 'Solutions', itemLabel: 'solution', inputs: [{ label: 'Title', placeholder: 'For example: Data protection' }, { label: 'Description', placeholder: 'Describe the solution', multiline: true }, { label: 'Included features', placeholder: 'One feature per line', multiline: true, lineSeparator: ';' }] },
  service_list: { key: 'items', label: 'Services', itemLabel: 'service', inputs: [{ label: 'Service name', placeholder: 'For example: Helpdesk' }] },
  tag_band: { key: 'tags', label: 'Sector tags', itemLabel: 'tag', inputs: [{ label: 'Tag', placeholder: 'For example: Financial services' }] },
  partner_directory: { key: 'items', label: 'Partners', itemLabel: 'partner', inputs: [{ label: 'Partner name', placeholder: 'For example: Oracle' }, { label: 'Focus', placeholder: 'For example: Cloud infrastructure', multiline: true }] },
  logo_grid: { key: 'items', label: 'Client logos', itemLabel: 'client', inputs: [{ label: 'Client name', placeholder: 'For example: Global Payments' }, { label: 'Logo image URL', placeholder: 'Paste an uploaded image URL' }, { label: 'Optional logo treatment', placeholder: 'Leave blank unless already used' }] },
  method_list: { key: 'items', label: 'Methods', itemLabel: 'method', inputs: [{ label: 'Title', placeholder: 'For example: Context first' }, { label: 'Description', placeholder: 'Describe the method', multiline: true }] },
};

function repeaterRows(value: unknown, config: DesignBlockRepeater): string[][] {
  return String(value ?? '')
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 24)
    .map((line) => Array.from({ length: config.inputs.length }, (_, index) => {
      const field = line.split('|')[index]?.trim() ?? '';
      return config.inputs[index].lineSeparator ? field.split(config.inputs[index].lineSeparator).map((item) => item.trim()).filter(Boolean).join('\n') : field;
    }));
}

function serialiseRepeaterRows(rows: string[][], config: DesignBlockRepeater): string {
  return rows
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => row.map((value, index) => value.replaceAll('|', ' ').replaceAll('\n', config.inputs[index].lineSeparator ?? ' ').trim()).join(' | '))
    .join('\n');
}

function BuilderRepeaterEditor({
  config,
  value,
  onChange,
}: {
  config: DesignBlockRepeater;
  value: unknown;
  onChange: (value: string) => void;
}) {
  const rows = repeaterRows(value, config);
  const commit = (nextRows: string[][]) => onChange(serialiseRepeaterRows(nextRows, config));
  const addItem = () => commit([...rows, [`New ${config.itemLabel}`, ...Array.from({ length: config.inputs.length - 1 }, () => '')]]);

  return (
    <section className="visual-repeater-editor" aria-label={config.label}>
      <div className="visual-repeater-editor-heading">
        <div><span>{config.label}</span><small>Add and edit each {config.itemLabel} directly.</small></div>
        <button type="button" onClick={addItem} disabled={rows.length >= (config.max ?? 24)}><Plus size={14} /> Add {config.itemLabel}</button>
      </div>
      {rows.length ? (
        <div className="visual-repeater-items">
          {rows.map((row, rowIndex) => (
            <div className="visual-repeater-item" key={`${config.key}-${rowIndex}`}>
              <div className="visual-repeater-item-heading"><strong>{config.itemLabel} {rowIndex + 1}</strong><button type="button" onClick={() => commit(rows.filter((_, index) => index !== rowIndex))}><Minus size={14} /> Remove</button></div>
              {config.inputs.map((input, inputIndex) => (
                <label className="visual-field" key={input.label}>
                  <span>{input.label}</span>
                  {input.multiline ? (
                    <textarea value={row[inputIndex] ?? ''} placeholder={input.placeholder} onChange={(event) => commit(rows.map((current, index) => index === rowIndex ? current.map((field, fieldIndex) => fieldIndex === inputIndex ? event.target.value : field) : current))} />
                  ) : (
                    <input value={row[inputIndex] ?? ''} placeholder={input.placeholder} onChange={(event) => commit(rows.map((current, index) => index === rowIndex ? current.map((field, fieldIndex) => fieldIndex === inputIndex ? event.target.value : field) : current))} />
                  )}
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : <p className="visual-repeater-empty">No {config.label.toLowerCase()} yet. Add one to start.</p>}
    </section>
  );
}

const DESIGN_COLOR_FIELDS: Array<{ key: keyof DesignSystem; label: string }> = [
  { key: 'primary', label: 'Primary brand' }, { key: 'primaryDeep', label: 'Deep brand' }, { key: 'secondary', label: 'Secondary brand' },
  { key: 'accent', label: 'Accent' }, { key: 'accentSoft', label: 'Accent light' },
  { key: 'background', label: 'Page background' }, { key: 'surface', label: 'Main surface' }, { key: 'surfaceMuted', label: 'Soft surface' }, { key: 'card', label: 'Card surface' },
  { key: 'ink', label: 'Heading and body ink' }, { key: 'muted', label: 'Supporting text' }, { key: 'border', label: 'Borders' },
  { key: 'link', label: 'Links' }, { key: 'button', label: 'Buttons' }, { key: 'buttonHover', label: 'Button hover' },
];

const BRANDING_FIELDS = [
  { key: 'logo', label: 'Default logo' }, { key: 'logoLight', label: 'Logo for dark backgrounds' },
  { key: 'logoDark', label: 'Logo for light backgrounds' }, { key: 'logoMobile', label: 'Mobile logo' },
  { key: 'favicon', label: 'Browser favicon' }, { key: 'appIcon', label: 'Application icon' },
] as const;

const BRANDING_LAYOUT_FIELDS = [
  { key: 'logoWidth', label: 'Logo width (for example 52px)' },
  { key: 'logoMobileWidth', label: 'Mobile logo width' },
  { key: 'logoAlignment', label: 'Logo alignment: left, center, or right' },
  { key: 'logoSpacing', label: 'Logo outer spacing' },
] as const;

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function fieldName(key: string): string {
  if (key === '__title') return 'Title';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isMediaKey(key: string): boolean {
  return (
    /(?:logo|image)$/i.test(key) ||
    /(?:heroImage|backgroundImage|ogImage)$/i.test(key)
  );
}

function nextSlug(value: string): string {
  const root =
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'content';
  return `${root}-${Date.now().toString(36)}`.slice(0, 120);
}

function slugFromTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function customPageHref(slug: string): string {
  const base = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/custom.html' : '/custom';
  return `${base}?page=${encodeURIComponent(slug)}`;
}

function headerLinks(value: unknown): HeaderLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `header-link-${index}`,
      label: typeof item.label === 'string' ? item.label : '',
      href: typeof item.href === 'string' ? item.href : '#',
      enabled: item.enabled !== false,
      parentId: typeof item.parentId === 'string' && item.parentId ? item.parentId : undefined,
    }));
}

function findDocument(
  documents: CmsDocument[],
  type: string,
  slug?: string,
): CmsDocument | undefined {
  return documents.find(
    (document) => document.type === type && (!slug || document.slug === slug),
  );
}

function EditorText({
  field,
  value,
  selected,
  onSelect,
  onChange,
  className,
}: {
  field?: FieldRef;
  value: string;
  selected: FieldRef | null;
  onSelect: (field: FieldRef) => void;
  onChange: (field: FieldRef, value: string) => void;
  className?: string;
}) {
  const isSelected = Boolean(
    field &&
    selected?.documentId === field.documentId &&
    selected.key === field.key,
  );
  return (
    <span
      className={`${className ?? ''} visual-editable ${isSelected ? 'visual-editable-selected' : ''}`}
      data-cms-document-id={field?.documentId}
      data-cms-field={field?.key}
      data-cms-type={field ? 'text' : undefined}
      contentEditable={Boolean(field)}
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(event) => {
        if (!field) return;
        event.stopPropagation();
        onSelect(field);
      }}
      onInput={(event) => {
        if (field) onChange(field, event.currentTarget.textContent ?? '');
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
      }}
    >
      {value}
    </span>
  );
}

function BuilderLayerTree({
  nodes,
  selectedNodeId,
  onSelect,
  depth = 0,
}: {
  nodes: BuilderNode[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id} className="visual-builder-tree-node">
          <button
            type="button"
            className={`visual-layer ${selectedNodeId === node.id ? 'active' : ''}`}
            style={{ paddingLeft: `${0.7 + depth * 0.85}rem` }}
            onClick={() => onSelect(node.id)}
          >
            <Layers3 size={13} /> {node.type.replace('_', ' ')}
          </button>
          {node.children.length > 0 && (
            <BuilderLayerTree
              nodes={node.children}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}

export function VisualEditor() {
  const [page, setPage] = useState<PageKey>('home');
  const [documents, setDocuments] = useState<CmsDocument[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selected, setSelected] = useState<FieldRef | null>(null);
  const [history, setHistory] = useState<CmsDocument[][]>([]);
  const [future, setFuture] = useState<CmsDocument[][]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [device, setDevice] = useState<Device>('desktop');
  const [status, setStatus] = useState<
    'loading' | 'saved' | 'saving' | 'publishing' | 'error'
  >('loading');
  const [message, setMessage] = useState('Loading editor…');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [activeBuilderSlot, setActiveBuilderSlot] = useState(BUILDER_SLOTS[0].id);
  const [selectedBuilderNodeId, setSelectedBuilderNodeId] = useState<string | null>(null);
  const [draggedBuilderNodeId, setDraggedBuilderNodeId] = useState<string | null>(null);
  const [activeCustomPageId, setActiveCustomPageId] = useState<string | null>(null);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageBrief, setNewPageBrief] = useState('');
  const [newPageTemplateId, setNewPageTemplateId] = useState('');
  const [copiedBuilderNode, setCopiedBuilderNode] = useState<BuilderNode | null>(null);
  const [pageCssOpen, setPageCssOpen] = useState(false);
  const [elementCssOpen, setElementCssOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [scheduleAt, setScheduleAt] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setMessage('Loading editor…');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = { authorization: `Bearer ${token}` };
      const [documentsResponse, mediaResponse] = await Promise.all([
        fetch(`${CMS_API}/v1/admin/documents?limit=100`, { headers }),
        fetch(`${CMS_API}/v1/admin/media`, { headers }),
      ]);
      const documentsBody = (await documentsResponse.json()) as {
        documents?: CmsDocument[];
        error?: string;
      };
      const mediaBody = (await mediaResponse.json()) as {
        media?: MediaAsset[];
      };
      if (!documentsResponse.ok)
        throw new Error(
          documentsBody.error ?? 'The CMS documents could not be loaded.',
        );
      setDocuments(documentsBody.documents ?? []);
      setMedia(mediaBody.media ?? []);
      setStatus('saved');
      setMessage(
        documentsBody.documents?.length
          ? 'All changes saved'
          : 'Import the existing site to begin editing',
      );
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'The editor could not load.',
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const customPages = documents.filter(
    (document) =>
      document.type === 'builder_page' &&
      document.status !== 'archived' &&
      document.slug !== 'home' &&
      document.slug !== 'partners',
  );
  const builderTemplates = documents.filter((document) => document.type === 'builder_template' && document.status !== 'archived');
  const blockTemplates = builderTemplates.filter((document) => document.data.kind === 'block');
  const pageTemplates = builderTemplates.filter((document) => document.data.kind === 'page');
  const activeCustomPage = customPages.find(
    (document) => document.id === activeCustomPageId,
  );
  const isCustomPage = Boolean(activeCustomPage);
  const activePageSlug = activeCustomPage?.slug ?? page;
  const activePageTitle = activeCustomPage?.title ?? (page === 'home' ? 'Home' : 'Partners');
  const pageLayers = isCustomPage ? [] : PAGE_LAYERS[page];
  const builderDocument = findDocument(
    documents,
    'builder_page',
    activePageSlug,
  );
  const builderPage = builderDocument ? normaliseBuilderPage(builderDocument.data) : emptyBuilderPage();
  const globalSettings = findDocument(documents, 'site_settings', 'global');
  const navigation = findDocument(documents, 'navigation', 'main');
  const previewNavItems = headerLinks(navigation?.data.items);
  const previewChrome = {
    variant: page,
    navItems: previewNavItems.length ? previewNavItems : DEFAULT_HOME.navItems,
    headerCta: {
      label: text(navigation?.data.ctaLabel, DEFAULT_HOME.headerCta.label),
      href: text(navigation?.data.ctaHref, DEFAULT_HOME.headerCta.href),
    },
    site: {
      logo: text(globalSettings?.data.logo, DEFAULT_HOME.site.logo),
      logoLight: text(globalSettings?.data.logoLight, text(globalSettings?.data.logo, DEFAULT_HOME.site.logo)),
      logoDark: text(globalSettings?.data.logoDark, text(globalSettings?.data.logo, DEFAULT_HOME.site.logo)),
      logoMobile: text(globalSettings?.data.logoMobile, text(globalSettings?.data.logo, DEFAULT_HOME.site.logo)),
      logoWidth: text(globalSettings?.data.logoWidth, DEFAULT_HOME.site.logoWidth),
      logoMobileWidth: text(globalSettings?.data.logoMobileWidth, DEFAULT_HOME.site.logoMobileWidth),
      logoAlignment: text(globalSettings?.data.logoAlignment, DEFAULT_HOME.site.logoAlignment),
      logoSpacing: text(globalSettings?.data.logoSpacing, DEFAULT_HOME.site.logoSpacing),
      phone: text(globalSettings?.data.phone, DEFAULT_HOME.site.phone),
      phoneHref: text(globalSettings?.data.phoneHref, DEFAULT_HOME.site.phoneHref),
      address: text(globalSettings?.data.address, DEFAULT_HOME.site.address),
      addressUrl: text(globalSettings?.data.addressUrl, DEFAULT_HOME.site.addressUrl),
    },
    footer: {
      address: text(globalSettings?.data.address, DEFAULT_HOME.footer.address),
      copyright: text(globalSettings?.data.copyright, DEFAULT_HOME.footer.copyright),
    },
  } as const;
  const hasPageBindings =
    isCustomPage
      ? true
      : Boolean(builderDocument && Object.values(builderPage.slots).some((nodes) => nodes.length > 0));
  const pageDocuments = useMemo(() => {
    const types = new Set(pageLayers.map((layer) => layer.type));
    return documents.filter(
      (document) =>
        document.status !== 'archived' &&
        (types.has(document.type) ||
          (document.type === 'builder_page' && document.slug === activePageSlug)),
    );
  }, [activePageSlug, documents, pageLayers]);

  const markChanged = (nextDocuments: CmsDocument[], ids: string[]) => {
    setHistory((items) => [...items, structuredClone(documents)].slice(-30));
    setFuture([]);
    setDocuments(nextDocuments);
    setDirtyIds((current) => new Set([...current, ...ids]));
    setStatus('saved');
    setMessage('Unsaved draft changes');
  };

  const updateField = (field: FieldRef, value: string | boolean) => {
    const next = documents.map((document) => {
      if (document.id !== field.documentId) return document;
      if (field.key === '__title') return { ...document, title: String(value) };
      return { ...document, data: { ...document.data, [field.key]: value } };
    });
    markChanged(next, [field.documentId]);
  };

  const updateDesignField = (documentId: string, key: keyof DesignSystem, value: string) => {
    const next = documents.map((document) => {
      if (document.id !== documentId) return document;
      const design = designSystemFromDoc(document.data.design);
      return { ...document, data: { ...document.data, design: { ...design, [key]: value } } };
    });
    markChanged(next, [documentId]);
  };

  const updateHeaderLinks = (documentId: string, links: HeaderLink[]) => {
    const next = documents.map((document) =>
      document.id === documentId
        ? { ...document, data: { ...document.data, items: links } }
        : document,
    );
    markChanged(next, [documentId]);
  };

  const updateBuilder = (nextPage: ReturnType<typeof emptyBuilderPage>) => {
    if (!builderDocument) return;
    const next = documents.map((document) =>
      document.id === builderDocument.id ? { ...document, data: nextPage } : document,
    );
    markChanged(next, [builderDocument.id]);
  };

  const updatePageCss = (value: string) => {
    if (!builderDocument) return;
    updateBuilder({ ...builderPage, customCss: value.slice(0, 80_000) });
  };

  const updatePageSetting = <K extends keyof BuilderPage['settings']>(key: K, value: BuilderPage['settings'][K]) => {
    updateBuilder({ ...builderPage, settings: { ...builderPage.settings, [key]: value } });
  };

  const ensureBuilderDocument = async (): Promise<CmsDocument | null> => {
    if (builderDocument) return builderDocument;
    setStatus('saving');
    setMessage('Preparing a structured page canvas…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'builder_page',
          slug: activePageSlug,
          title: activeCustomPage?.title ?? `${page === 'home' ? 'Home' : 'Partners'} custom blocks`,
          data: emptyBuilderPage(),
          note: 'Created structured visual-builder canvas',
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The builder canvas could not be created.');
      return result.document;
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The builder canvas could not be created.');
      return null;
    }
  };

  const createPage = async () => {
    const title = newPageTitle.trim();
    const slug = slugFromTitle(newPageSlug || title);
    if (!title || !slug) {
      setStatus('error');
      setMessage('Give the new page a title and a valid URL name.');
      return;
    }
    if (documents.some((document) => document.type === 'builder_page' && document.slug === slug)) {
      setStatus('error');
      setMessage('That page URL is already in use. Choose another URL name.');
      return;
    }
    setStatus('saving');
    setMessage('Creating page draft…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'builder_page',
          slug,
          title,
          data: newPageTemplateId ? normaliseBuilderPage(builderTemplates.find((template) => template.id === newPageTemplateId)?.data.page) : newPageBrief.trim() ? createPageFromBrief(newPageBrief) : emptyBuilderPage(),
          note: newPageTemplateId ? 'Created from a saved CMS page template' : newPageBrief.trim() ? 'Created from an editable page brief' : 'Created as a new visual-builder page',
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The page draft could not be created.');
      setDocuments((current) => [...current, result.document!]);
      setActiveCustomPageId(result.document.id);
      setSelected(null);
      setSelectedBuilderNodeId(null);
      setActiveBuilderSlot(BUILDER_SLOTS[0].id);
      setAddingPage(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setNewPageBrief('');
      setNewPageTemplateId('');
      setStatus('saved');
      setMessage(newPageTemplateId || newPageBrief.trim() ? 'Editable page starter is ready. Refine the blocks, then publish it.' : 'New page draft is ready. Add blocks, then publish it.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The page draft could not be created.');
    }
  };

  const updateActivePage = (changes: Partial<Pick<CmsDocument, 'title' | 'slug'>>) => {
    if (!activeCustomPage) return;
    const next = documents.map((document) => document.id === activeCustomPage.id ? { ...document, ...changes } : document);
    markChanged(next, [activeCustomPage.id]);
  };

  const duplicateActivePage = async () => {
    if (!activeCustomPage) return;
    setStatus('saving');
    setMessage('Duplicating page…');
    try {
      const token = localStorage.getItem('cms_token');
      const title = `${activeCustomPage.title} copy`;
      const slug = nextSlug(activeCustomPage.slug);
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'builder_page', title, slug, data: normaliseBuilderPage(activeCustomPage.data), note: 'Duplicated page in visual editor' }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The page could not be duplicated.');
      setDocuments((current) => [...current, result.document!]);
      setActiveCustomPageId(result.document.id);
      setStatus('saved');
      setMessage('Page duplicated as a draft');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The page could not be duplicated.');
    }
  };

  const unpublishActivePage = async () => {
    if (!activeCustomPage || activeCustomPage.status !== 'published') return;
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${activeCustomPage.id}/unpublish`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setStatus('error');
      setMessage('The page could not be unpublished.');
      return;
    }
    setDocuments((current) => current.map((document) => document.id === activeCustomPage.id ? { ...document, status: 'draft', publishedData: null } : document));
    setMessage('Page unpublished. Its draft remains in the CMS.');
  };

  const archiveActivePage = async () => {
    if (!activeCustomPage || !window.confirm(`Archive “${activeCustomPage.title}”? Its saved revisions remain available in the CMS.`)) return;
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${activeCustomPage.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setStatus('error');
      setMessage('The page could not be archived.');
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== activeCustomPage.id));
    setActiveCustomPageId(null);
    setPage('home');
    setMessage('Page archived and removed from the live site');
  };

  const setActiveAsHomepage = async () => {
    if (!activeCustomPage || !globalSettings) {
      setStatus('error');
      setMessage('Global settings must be available before setting the homepage.');
      return;
    }
    if (activeCustomPage.status !== 'published') {
      setStatus('error');
      setMessage('Publish this page before setting it as the homepage.');
      return;
    }
    setStatus('publishing');
    setMessage('Setting homepage…');
    const token = localStorage.getItem('cms_token');
    const data = { ...globalSettings.data, homepageSlug: activeCustomPage.slug };
    const update = await fetch(`${CMS_API}/v1/admin/documents/${globalSettings.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ title: globalSettings.title, slug: globalSettings.slug, data, note: `Set ${activeCustomPage.slug} as homepage` }) });
    const publish = update.ok ? await fetch(`${CMS_API}/v1/admin/documents/${globalSettings.id}/publish`, { method: 'POST', headers: { authorization: `Bearer ${token}` } }) : update;
    if (!update.ok || !publish.ok) {
      setStatus('error');
      setMessage('The homepage setting could not be published.');
      return;
    }
    setDocuments((current) => current.map((document) => document.id === globalSettings.id ? { ...document, data, publishedData: structuredClone(data), status: 'published' } : document));
    setStatus('saved');
    setMessage(`${activeCustomPage.title} is now the homepage`);
  };

  const addBuilderElement = async (type: BuilderNodeType) => {
    const document = await ensureBuilderDocument();
    if (!document) return;
    const currentPage = normaliseBuilderPage(document.data);
    const selectedNode = selectedBuilderNodeId ? findBuilderNode(currentPage, selectedBuilderNodeId) : undefined;
    const canContain = Boolean(selectedNode && canContainBuilderChildren(selectedNode.type));
    const node = createBuilderNode(type);
    const nextPage = appendBuilderNode(currentPage, activeBuilderSlot, node, canContain ? selectedNode?.id : undefined);
    const nextDocuments = (document.id === builderDocument?.id ? documents : [...documents, document]).map((entry) =>
      entry.id === document.id ? { ...entry, data: nextPage } : entry,
    );
    markChanged(nextDocuments, [document.id]);
    setSelectedBuilderNodeId(node.id);
    setSelected(null);
    setStatus('saved');
    setMessage(`${type.replace('_', ' ')} added to the draft`);
  };

  const changeBuilderNode = (nodeId: string, change: (node: BuilderNode) => BuilderNode) => {
    updateBuilder(updateBuilderNode(builderPage, nodeId, change));
  };

  const removeSelectedBuilderNode = () => {
    if (!selectedBuilderNodeId) return;
    updateBuilder(removeBuilderNode(builderPage, selectedBuilderNodeId).page);
    setSelectedBuilderNodeId(null);
    setMessage('Custom block removed from the draft');
  };

  const duplicateSelectedBuilderNode = () => {
    if (!selectedBuilderNodeId) return;
    updateBuilder(duplicateBuilderNode(builderPage, selectedBuilderNodeId));
    setMessage('Custom block duplicated in the draft');
  };

  const copySelectedBuilderNode = () => {
    if (!selectedBuilderNode) return;
    setCopiedBuilderNode(cloneBuilderNode(selectedBuilderNode));
    setMessage('Block copied. Choose a location and paste it into the draft.');
  };

  const pasteBuilderNode = () => {
    if (!copiedBuilderNode) return;
    const parent = selectedBuilderNode && canContainBuilderChildren(selectedBuilderNode.type)
      ? selectedBuilderNode.id
      : undefined;
    const node = cloneBuilderNode(copiedBuilderNode);
    updateBuilder(appendBuilderNode(builderPage, activeBuilderSlot, node, parent));
    setSelectedBuilderNodeId(node.id);
    setMessage('Copied block pasted into the draft');
  };

  const createBuilderTemplate = async (kind: 'block' | 'page') => {
    if (kind === 'block' && !selectedBuilderNode) return;
    const title = kind === 'block' ? `Reusable ${selectedBuilderNode!.type.replace('_', ' ')}` : `${activePageTitle} page template`;
    setStatus('saving');
    setMessage(`Saving ${kind} template…`);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'builder_template', slug: nextSlug(title), title, data: kind === 'block' ? { kind, block: structuredClone(selectedBuilderNode) } : { kind, page: structuredClone(builderPage) }, note: `Saved ${kind} template in visual editor` }),
      });
      const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
      if (!response.ok || !result.document) throw new Error(result.error ?? 'The template could not be saved.');
      setDocuments((current) => [...current, result.document!]);
      setStatus('saved');
      setMessage(kind === 'block' ? 'Reusable block saved' : 'Page template saved');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'The template could not be saved.');
    }
  };

  const insertBlockTemplate = (template: CmsDocument) => {
    const pageFixture = emptyBuilderPage();
    pageFixture.slots.afterContent = [template.data.block as BuilderNode];
    const source = normaliseBuilderPage(pageFixture).slots.afterContent[0];
    if (!source) {
      setStatus('error');
      setMessage('This reusable block is no longer valid.');
      return;
    }
    const parent = selectedBuilderNode && canContainBuilderChildren(selectedBuilderNode.type) ? selectedBuilderNode.id : undefined;
    const node = cloneBuilderNode(source);
    updateBuilder(appendBuilderNode(builderPage, activeBuilderSlot, node, parent));
    setSelectedBuilderNodeId(node.id);
    setMessage('Reusable block inserted into the draft');
  };

  const moveBuilderBlock = (targetId: string, requestedMode: 'before' | 'inside' = 'before') => {
    if (!draggedBuilderNodeId) return;
    const source = findBuilderNode(builderPage, draggedBuilderNodeId);
    const target = findBuilderNode(builderPage, targetId);
    const mode = requestedMode === 'inside' && source && target && source.type !== target.type ? 'inside' : 'before';
    updateBuilder(moveBuilderNode(builderPage, draggedBuilderNodeId, targetId, mode));
    setDraggedBuilderNodeId(null);
    setMessage('Custom block order updated');
  };

  const selectDocument = (document: CmsDocument, key = '__title') => {
    setSelectedBuilderNodeId(null);
    setSelected({ documentId: document.id, key });
  };

  const initializeEditableDrafts = async () => {
    setInitializing(true);
    setStatus('saving');
    setMessage('Creating editable draft bindings…');
    try {
      const token = localStorage.getItem('cms_token');
      const headers = {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      };
      const known = new Set(
        documents.map((document) => `${document.type}/${document.slug}`),
      );
      const builderDrafts = (['home', 'partners'] as PageKey[]).map((pageKey) => ({
        type: 'builder_page',
        slug: pageKey,
        title: pageKey === 'home' ? 'Home' : 'Partners',
        data: pageKey === 'home' ? createHomeBuilderPage() : createPartnersBuilderPage(),
      }));
      const toCreate = [...siteContentSeed.documents, ...builderDrafts].filter(
        (entry) => !known.has(`${entry.type}/${entry.slug}`),
      );
      const created: CmsDocument[] = [];
      for (const entry of toCreate) {
        const response = await fetch(`${CMS_API}/v1/admin/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...entry,
            note: 'Initialized for visual editing from the current static site',
          }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          document?: CmsDocument;
          error?: string;
        };
        if (!response.ok || !result.document)
          throw new Error(result.error ?? `Could not bind ${entry.title}.`);
        created.push(result.document);
      }
      setDocuments((current) => [...current, ...created]);
      setStatus('saved');
      setMessage('Editable drafts are ready — the live site is unchanged');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The editable draft bindings could not be created.',
      );
    } finally {
      setInitializing(false);
    }
  };

  const saveDrafts = useCallback(
    async (ids = Array.from(dirtyIds)) => {
      if (!ids.length) return true;
      setStatus('saving');
      setMessage('Saving draft…');
      try {
        const token = localStorage.getItem('cms_token');
        const headers = {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        };
        for (const id of ids) {
          const document = documents.find((item) => item.id === id);
          if (!document) continue;
          const response = await fetch(`${CMS_API}/v1/admin/documents/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              title: document.title,
              slug: document.slug,
              data: document.data,
              note: 'Edited in visual editor',
            }),
          });
          const result = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!response.ok)
            throw new Error(
              result.error ?? `Could not save ${document.title}.`,
            );
        }
        setDirtyIds(
          (current) => new Set([...current].filter((id) => !ids.includes(id))),
        );
        setStatus('saved');
        setMessage('All changes saved');
        return true;
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'The draft could not be saved.',
        );
        return false;
      }
    },
    [dirtyIds, documents],
  );

  useEffect(() => {
    if (!dirtyIds.size) return;
    const timer = window.setTimeout(() => {
      void saveDrafts();
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [dirtyIds, documents, saveDrafts]);

  const publishPage = async () => {
    const saved = await saveDrafts();
    if (!saved) return;
    const ids = pageDocuments.map((document) => document.id);
    if (!ids.length) {
      setStatus('error');
      setMessage('Import the existing site before publishing this page.');
      return;
    }
    setStatus('publishing');
    setMessage('Publishing…');
    try {
      const token = localStorage.getItem('cms_token');
      for (const id of ids) {
        const response = await fetch(
          `${CMS_API}/v1/admin/documents/${id}/publish`,
          {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
          },
        );
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error ?? 'The page could not be published.');
      }
      setDocuments((current) =>
        current.map((document) =>
          ids.includes(document.id)
            ? {
                ...document,
                status: 'published',
                publishedData: structuredClone(document.data),
              }
            : document,
        ),
      );
      setStatus('saved');
      setMessage('Published to the live site');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The page could not be published.',
      );
    }
  };

  const scheduleActivePage = async () => {
    if (!builderDocument || !scheduleAt) {
      setStatus('error');
      setMessage('Choose a future date and time first.');
      return;
    }
    const saved = await saveDrafts();
    if (!saved) return;
    const publishAt = new Date(scheduleAt);
    if (Number.isNaN(publishAt.getTime())) {
      setStatus('error');
      setMessage('Choose a valid publication date and time.');
      return;
    }
    setStatus('publishing');
    setMessage('Scheduling publication…');
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${builderDocument.id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ publishAt: publishAt.toISOString() }),
    });
    const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
    if (!response.ok || !result.document) {
      setStatus('error');
      setMessage(result.error ?? 'The page could not be scheduled.');
      return;
    }
    setDocuments((current) => current.map((document) => document.id === result.document!.id ? result.document! : document));
    setStatus('saved');
    setMessage(`Publication scheduled for ${publishAt.toLocaleString()}`);
  };

  const cancelScheduledPage = async () => {
    if (!builderDocument?.scheduledAt) return;
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${builderDocument.id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ publishAt: null }),
    });
    const result = (await response.json().catch(() => ({}))) as { document?: CmsDocument; error?: string };
    if (!response.ok || !result.document) {
      setStatus('error');
      setMessage(result.error ?? 'The schedule could not be cancelled.');
      return;
    }
    setDocuments((current) => current.map((document) => document.id === result.document!.id ? result.document! : document));
    setMessage('Scheduled publication cancelled');
  };

  const showRevisions = async () => {
    if (!builderDocument) return;
    setRevisionsOpen(true);
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${builderDocument.id}/revisions`, { headers: { authorization: `Bearer ${token}` } });
    const result = (await response.json().catch(() => ({}))) as { revisions?: CmsRevision[]; error?: string };
    if (!response.ok) {
      setStatus('error');
      setMessage(result.error ?? 'Revision history could not be loaded.');
      return;
    }
    setRevisions(result.revisions ?? []);
  };

  const restorePageRevision = async (revisionNumber: number) => {
    if (!builderDocument || !window.confirm(`Restore revision ${revisionNumber} as the current draft?`)) return;
    const token = localStorage.getItem('cms_token');
    const response = await fetch(`${CMS_API}/v1/admin/documents/${builderDocument.id}/restore/${revisionNumber}`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setStatus('error');
      setMessage('The revision could not be restored.');
      return;
    }
    await load();
    setRevisionsOpen(false);
    setSelectedBuilderNodeId(null);
    setMessage(`Revision ${revisionNumber} restored as a draft`);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [structuredClone(documents), ...items].slice(0, 30));
    setHistory((items) => items.slice(0, -1));
    setDocuments(previous);
    setDirtyIds(new Set(previous.map((document) => document.id)));
    setMessage('Undid the last change');
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, structuredClone(documents)].slice(-30));
    setFuture((items) => items.slice(1));
    setDocuments(next);
    setDirtyIds(new Set(next.map((document) => document.id)));
    setMessage('Restored the change');
  };

  const addRepeater = async (
    type: 'solution' | 'service' | 'partner' | 'client',
  ) => {
    const baseTitle =
      type === 'solution'
        ? 'New solution'
        : type === 'service'
          ? 'New service'
          : type === 'partner'
            ? 'New partner'
            : 'New client';
    setStatus('saving');
    setMessage(`Adding ${baseTitle.toLowerCase()}…`);
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title: baseTitle,
          slug: nextSlug(baseTitle),
          data: DEFAULT_DATA[type],
          note: 'Added in visual editor',
        }),
      });
      const result = (await response.json()) as {
        document?: CmsDocument;
        error?: string;
      };
      if (!response.ok || !result.document)
        throw new Error(result.error ?? 'The block could not be added.');
      setDocuments((current) => [...current, result.document!]);
      setSelected({ documentId: result.document.id, key: '__title' });
      setDirtyIds((current) => new Set([...current, result.document!.id]));
      setStatus('saved');
      setMessage(`${baseTitle} added as a draft`);
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be added.',
      );
    }
  };

  const duplicateSelected = async () => {
    const document = selected
      ? documents.find((item) => item.id === selected.documentId)
      : undefined;
    if (
      !document ||
      !['solution', 'service', 'partner', 'client'].includes(document.type)
    )
      return;
    setStatus('saving');
    try {
      const token = localStorage.getItem('cms_token');
      const title = `${document.title} copy`;
      const response = await fetch(`${CMS_API}/v1/admin/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: document.type,
          title,
          slug: nextSlug(title),
          data: document.data,
          note: 'Duplicated in visual editor',
        }),
      });
      const result = (await response.json()) as {
        document?: CmsDocument;
        error?: string;
      };
      if (!response.ok || !result.document)
        throw new Error(result.error ?? 'The block could not be duplicated.');
      setDocuments((current) => [...current, result.document!]);
      setSelected({ documentId: result.document.id, key: '__title' });
      setDirtyIds((current) => new Set([...current, result.document!.id]));
      setStatus('saved');
      setMessage('Block duplicated as a draft');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be duplicated.',
      );
    }
  };

  const archiveSelected = async () => {
    const document = selected
      ? documents.find((item) => item.id === selected.documentId)
      : undefined;
    if (
      !document ||
      !['solution', 'service', 'partner', 'client'].includes(document.type)
    )
      return;
    if (
      !window.confirm(
        `Archive “${document.title}”? It will be removed from the live page after publishing.`,
      )
    )
      return;
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(
        `${CMS_API}/v1/admin/documents/${document.id}`,
        { method: 'DELETE', headers: { authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error('The block could not be archived.');
      setDocuments((current) =>
        current.filter((item) => item.id !== document.id),
      );
      setSelected(null);
      setMessage('Block archived');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The block could not be archived.',
      );
    }
  };

  const reorderRepeater = async (type: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const items = documents.filter((document) => document.type === type);
    const fromIndex = items.findIndex((document) => document.id === draggedId);
    const targetIndex = items.findIndex((document) => document.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const ids = reordered.map((document) => document.id);
    const currentPositions = documents.map((document) =>
      document.type === type ? reordered.shift()! : document,
    );
    setDocuments(currentPositions);
    setMessage('Reordering blocks…');
    try {
      const token = localStorage.getItem('cms_token');
      const response = await fetch(`${CMS_API}/v1/admin/documents/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('The new order could not be saved.');
      setMessage('Block order saved');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'The new order could not be saved.',
      );
      void load();
    } finally {
      setDraggedId(null);
    }
  };

  const selectedDocument = selected
    ? documents.find((document) => document.id === selected.documentId)
    : undefined;
  const selectedBuilderNode = selectedBuilderNodeId
    ? findBuilderNode(builderPage, selectedBuilderNodeId)
    : undefined;
  const selectedBuilderRepeater = selectedBuilderNode
    ? DESIGN_BLOCK_REPEATERS[selectedBuilderNode.type]
    : undefined;
  const selectedHeaderLinks =
    selectedDocument?.type === 'navigation'
      ? headerLinks(selectedDocument.data.items)
      : [];
  const selectedDesign = selectedDocument?.type === 'site_settings'
    ? designSystemFromDoc(selectedDocument.data.design)
    : DEFAULT_DESIGN_SYSTEM;
  const selectedFields = selectedDocument
    ? [
        { key: '__title', value: selectedDocument.title },
        ...Object.entries(selectedDocument.data)
          .filter(
            ([key, value]) =>
              (typeof value === 'string' || typeof value === 'boolean') &&
              !(
                selectedDocument.type === 'navigation' &&
                ['ctaLabel', 'ctaHref'].includes(key)
              ) && !(
                selectedDocument.type === 'site_settings' &&
                BRANDING_FIELDS.some((field) => field.key === key)
              ),
          )
          .map(([key, value]) => ({ key, value: value as string | boolean })),
      ]
    : [];

  const selectLayer = (layer: Layer) => {
    const document = layer.repeating
      ? documents.find((item) => item.type === layer.type)
      : findDocument(documents, layer.type, layer.slug);
    if (document) selectDocument(document);
  };

  return (
    <div className="visual-editor">
      <header className="visual-toolbar">
        <a className="admin-btn admin-btn-ghost" href={adminPath('/admin')}>
          <ArrowLeft size={16} /> Back to CMS
        </a>
        <div className="visual-page-switcher">
          {(['home', 'partners'] as PageKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={!isCustomPage && page === key ? 'active' : ''}
              onClick={() => {
                setPage(key);
                setActiveCustomPageId(null);
                setSelected(null);
                setSelectedBuilderNodeId(null);
                setActiveBuilderSlot(BUILDER_SLOTS[0].id);
              }}
            >
              {key === 'home' ? 'Home' : 'Partners'}
            </button>
          ))}
          {customPages.map((customPage) => (
            <button
              key={customPage.id}
              type="button"
              className={activeCustomPageId === customPage.id ? 'active' : ''}
              title={customPage.slug}
              onClick={() => {
                setActiveCustomPageId(customPage.id);
                setSelected(null);
                setSelectedBuilderNodeId(null);
                setActiveBuilderSlot(BUILDER_SLOTS[0].id);
              }}
            >
              {customPage.title}
            </button>
          ))}
          <button
            type="button"
            className="visual-add-page"
            onClick={() => setAddingPage(true)}
          >
            <Plus size={14} /> Add page
          </button>
        </div>
        <div
          className={`visual-save-status status-${status}`}
          aria-live="polite"
        >
          {status === 'saving' || status === 'publishing' ? '● ' : ''}
          {message}
        </div>
        <div className="visual-toolbar-actions">
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            disabled={!history.length}
            onClick={undo}
            title="Undo"
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            disabled={!future.length}
            onClick={redo}
            title="Redo"
          >
            <Redo2 size={16} /> Redo
          </button>
          <div className="visual-devices" aria-label="Preview device">
            <button
              type="button"
              className={device === 'desktop' ? 'active' : ''}
              onClick={() => setDevice('desktop')}
              title="Desktop preview"
            >
              <Monitor size={16} />
            </button>
            <button
              type="button"
              className={device === 'tablet' ? 'active' : ''}
              onClick={() => setDevice('tablet')}
              title="Tablet preview"
            >
              <Tablet size={16} />
            </button>
            <button
              type="button"
              className={device === 'mobile' ? 'active' : ''}
              onClick={() => setDevice('mobile')}
              title="Mobile preview"
            >
              <Smartphone size={16} />
            </button>
          </div>
          <button
            className={`admin-btn admin-btn-ghost ${pageCssOpen ? 'active' : ''}`}
            type="button"
            disabled={!builderDocument}
            onClick={() => setPageCssOpen((open) => !open)}
            title="Edit the complete page stylesheet"
          >
            <Code2 size={16} /> Page CSS
          </button>
          <button className={`admin-btn admin-btn-secondary ${elementCssOpen ? 'active' : ''}`} type="button" disabled={!builderDocument} onClick={() => setElementCssOpen(!elementCssOpen)} aria-pressed={elementCssOpen}>
            <MousePointer2 size={16} /> Element CSS
          </button>
          <button className={`admin-btn admin-btn-ghost ${revisionsOpen ? 'active' : ''}`} type="button" disabled={!builderDocument} onClick={() => revisionsOpen ? setRevisionsOpen(false) : void showRevisions()}><HistoryIcon size={16} /> Revisions</button>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            onClick={() => void saveDrafts()}
            disabled={!dirtyIds.size || status === 'saving'}
          >
            <Save size={16} /> Save draft
          </button>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={() => void publishPage()}
            disabled={status === 'publishing'}
          >
            <Send size={16} /> Publish
          </button>
        </div>
      </header>

      {elementCssOpen && builderDocument && <ElementCssEditor key={`${builderDocument.id}:${selectedBuilderNodeId ?? ''}`} canvasRef={canvasRef} css={builderPage.customCss} selectedNodeId={selectedBuilderNodeId} onChange={updatePageCss} />}

      {pageCssOpen && builderDocument && (
        <section className="visual-page-css" aria-label="Page CSS editor">
          <div className="visual-page-css-heading">
            <div>
              <span>PAGE STYLESHEET</span>
              <strong>{activePageTitle}</strong>
              <p>Edit CSS for any part of this page. Element CSS adds marked rule groups here; keep those markers when editing their rules.</p>
            </div>
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              disabled={!builderPage.customCss}
              onClick={() => updatePageCss('')}
            >
              Clear CSS
            </button>
          </div>
          <textarea
            className="visual-page-css-input"
            value={builderPage.customCss}
            maxLength={80_000}
            spellCheck={false}
            placeholder={'/* Example: refine the Home hero without changing other pages */\n.hero { min-height: 44rem; }\n@media (max-width: 700px) { .hero { min-height: auto; } }'}
            onChange={(event) => updatePageCss(event.target.value)}
          />
          <div className="visual-page-css-footer">
            <small>{builderPage.customCss.length.toLocaleString()} / 80,000 characters · CSS rules only, without &lt;style&gt; tags.</small>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => void saveDrafts()} disabled={!dirtyIds.size || status === 'saving'}>
              <Save size={16} /> Save CSS draft
            </button>
          </div>
        </section>
      )}

      {revisionsOpen && builderDocument && <section className="visual-revisions" aria-label="Page revision history"><div><strong>Revision history</strong><span>Restore any saved version as a new draft.</span></div>{revisions.length ? <ol>{revisions.map((revision) => <li key={revision.id}><div><strong>Revision {revision.revisionNumber}</strong><span>{revision.note || 'Saved draft'} · {new Date(revision.createdAt).toLocaleString()}</span></div><button type="button" onClick={() => void restorePageRevision(revision.revisionNumber)}>Restore</button></li>)}</ol> : <p>No saved revisions yet.</p>}</section>}

      {addingPage && (
        <section className="visual-new-page-form" aria-label="Create a new page">
          <div>
            <strong>Create a page draft</strong>
            <p>The page will go live at a shareable static URL after you publish it.</p>
          </div>
          <label>
            Title
            <input
              autoFocus
              value={newPageTitle}
              placeholder="For example: Managed services"
              onChange={(event) => {
                setNewPageTitle(event.target.value);
                setNewPageSlug(slugFromTitle(event.target.value));
              }}
            />
          </label>
          <label>
            URL name
            <input
              value={newPageSlug}
              placeholder="managed-services"
              onChange={(event) => setNewPageSlug(slugFromTitle(event.target.value))}
            />
          </label>
          <label>
            Page brief (optional)
            <textarea
              value={newPageBrief}
              placeholder="For example: Create a modern managed services page matching the INFOStorage site."
              onChange={(event) => setNewPageBrief(event.target.value)}
            />
            <small>Creates a design-matched, fully editable starter using the CMS block library.</small>
          </label>
          {pageTemplates.length > 0 && <label>Start from a saved template<select value={newPageTemplateId} onChange={(event) => setNewPageTemplateId(event.target.value)}><option value="">No template</option>{pageTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select><small>A saved template replaces the optional page brief.</small></label>}
          <button className="admin-btn admin-btn-primary" type="button" onClick={() => void createPage()}>
            {newPageTemplateId || newPageBrief.trim() ? 'Create editable starter' : 'Create blank draft'}
          </button>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setAddingPage(false)}>
            Cancel
          </button>
        </section>
      )}

      <div className="visual-editor-body">
        <aside className="visual-left-panel">
          <div className="visual-panel-heading">
            <Layers3 size={16} />
            <span>Pages & layers</span>
          </div>
          <div className="visual-page-tree">
            <button
              type="button"
              className="visual-tree-page"
              onClick={() => setLayersOpen((value) => !value)}
            >
              <ChevronDown
                size={15}
                className={layersOpen ? '' : 'collapsed'}
              />{' '}
              {page === 'home' ? 'Home' : 'Partners'}
            </button>
            {layersOpen &&
              pageLayers.map((layer) => {
                const entries = layer.repeating
                  ? documents.filter((document) => document.type === layer.type)
                  : [];
                const direct = layer.repeating
                  ? undefined
                  : findDocument(documents, layer.type, layer.slug);
                const active = Boolean(
                  selected &&
                  (direct?.id === selected.documentId ||
                    entries.some((entry) => entry.id === selected.documentId)),
                );
                return (
                  <div key={layer.id} className="visual-layer-group">
                    <button
                      type="button"
                      className={`visual-layer ${active ? 'active' : ''}`}
                      onClick={() => selectLayer(layer)}
                    >
                      <MousePointer2 size={13} /> {layer.label}{' '}
                      {layer.locked && <small>GLOBAL</small>}
                    </button>
                    {layer.repeating &&
                      entries.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          className={`visual-layer visual-layer-child ${selected?.documentId === entry.id ? 'active' : ''}`}
                          onClick={() => selectDocument(entry)}
                        >
                          <GripVertical size={13} /> {entry.title}
                        </button>
                      ))}
                  </div>
                );
              })}
          </div>
          {!isCustomPage && <div className="visual-add-block">
            <span>ADD BLOCK</span>
            {page === 'home' ? (
              <>
                <button
                  type="button"
                  onClick={() => void addRepeater('solution')}
                >
                  <Plus size={15} /> Solution card
                </button>
                <button
                  type="button"
                  onClick={() => void addRepeater('service')}
                >
                  <Plus size={15} /> Service row
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void addRepeater('partner')}
                >
                  <Plus size={15} /> Partner card
                </button>
                <button
                  type="button"
                  onClick={() => void addRepeater('client')}
                >
                  <Plus size={15} /> Client logo
                </button>
              </>
            )}
          </div>}
          {activeCustomPage && (
            <div className="visual-custom-page-info">
              <span>PAGE SETTINGS</span>
              <label className="visual-field"><span>Page title</span><input value={activeCustomPage.title} onChange={(event) => updateActivePage({ title: event.target.value })} /></label>
              <label className="visual-field"><span>URL name</span><input value={activeCustomPage.slug} onChange={(event) => updateActivePage({ slug: slugFromTitle(event.target.value) })} /></label>
              <small>{activeCustomPage.status === 'published' ? 'Published' : 'Draft only'}</small>
              <a href={customPageHref(activeCustomPage.slug)} target="_blank" rel="noreferrer">
                Open published URL
              </a>
              <div className="visual-page-actions">
                <button type="button" onClick={() => void duplicateActivePage()}><Copy size={13} /> Duplicate</button>
                <button type="button" onClick={() => void createBuilderTemplate('page')}>Save template</button>
                <button type="button" onClick={() => void setActiveAsHomepage()}>Set homepage</button>
                {activeCustomPage.status === 'published' && <button type="button" onClick={() => void unpublishActivePage()}>Unpublish</button>}
                <button type="button" className="danger" onClick={() => void archiveActivePage()}><Archive size={13} /> Archive</button>
              </div>
            </div>
          )}
          <div className="visual-builder-library">
            <span>STRUCTURED BUILDER</span>
            <p>Reusable INFOStorage design blocks. Every block stays structured, responsive, and editable.</p>
            {builderDocument && <details className="visual-page-seo"><summary>Page SEO and shell</summary><div>
              <label className="visual-field"><span>Search title</span><input value={builderPage.settings.seoTitle} maxLength={160} placeholder={activePageTitle} onChange={(event) => updatePageSetting('seoTitle', event.target.value)} /></label>
              <label className="visual-field"><span>Search description</span><textarea value={builderPage.settings.seoDescription} maxLength={320} onChange={(event) => updatePageSetting('seoDescription', event.target.value)} /></label>
              <label className="visual-field"><span>Social image</span><input value={builderPage.settings.socialImage} placeholder="Image URL" onChange={(event) => updatePageSetting('socialImage', event.target.value)} />{media.some((asset) => asset.mimeType.startsWith('image/')) && <select value="" onChange={(event) => event.target.value && updatePageSetting('socialImage', event.target.value)}><option value="">Choose from media…</option>{media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}</select>}</label>
              <label className="visual-check-field"><input type="checkbox" checked={builderPage.settings.hideDefaultHeader} onChange={(event) => updatePageSetting('hideDefaultHeader', event.target.checked)} /><span>Hide automatic header</span></label>
              <label className="visual-check-field"><input type="checkbox" checked={builderPage.settings.hideDefaultFooter} onChange={(event) => updatePageSetting('hideDefaultFooter', event.target.checked)} /><span>Hide automatic footer</span></label>
            </div></details>}
            {builderDocument && <details className="visual-page-seo"><summary>Schedule publication</summary><div>
              {builderDocument.scheduledAt && <small>Scheduled for {new Date(builderDocument.scheduledAt).toLocaleString()}</small>}
              <label className="visual-field"><span>Date and time</span><input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} /></label>
              <div className="visual-page-actions">
                <button type="button" disabled={!scheduleAt} onClick={() => void scheduleActivePage()}>Schedule</button>
                {builderDocument.scheduledAt && <button type="button" onClick={() => void cancelScheduledPage()}>Cancel schedule</button>}
              </div>
            </div></details>}
            <label className="visual-field">
              <span>Insert location</span>
              <select value={activeBuilderSlot} onChange={(event) => setActiveBuilderSlot(event.target.value as typeof activeBuilderSlot)}>
                {BUILDER_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
              </select>
            </label>
            <div className="visual-builder-outline">
              {builderPage.slots[activeBuilderSlot].length ? (
                <BuilderLayerTree
                  nodes={builderPage.slots[activeBuilderSlot]}
                  selectedNodeId={selectedBuilderNodeId}
                  onSelect={(nodeId) => { setSelectedBuilderNodeId(nodeId); setSelected(null); }}
                />
              ) : <small className="visual-builder-empty">Drop or add a block here.</small>}
            </div>
            <div className="visual-builder-elements">
              {BUILDER_LIBRARY_GROUPS.map((group) => <details key={group.label} open={group.label === 'Layout' || group.label === 'Content'}><summary>{group.label}</summary><div>{group.items.map(({ type, label, Icon }) => (
                  <button
                    key={type}
                    type="button"
                    draggable
                    onClick={() => void addBuilderElement(type)}
                    onDragStart={(event) => { event.dataTransfer.setData('application/x-infostorage-builder-new', type); event.dataTransfer.effectAllowed = 'copy'; }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}</div></details>)}
            </div>
            <div className="visual-template-library">
              <div><strong>Saved templates</strong><button type="button" disabled={!builderDocument} onClick={() => void createBuilderTemplate('page')}>Save page</button></div>
              {blockTemplates.length ? blockTemplates.map((template) => <button type="button" key={template.id} onClick={() => insertBlockTemplate(template)}><Plus size={13} /> {template.title}</button>) : <small>Save any selected block to reuse it on another page.</small>}
            </div>
          </div>
        </aside>

        <main
          className={`visual-canvas-area visual-canvas-area-${device}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const type = event.dataTransfer.getData('application/x-infostorage-builder-new');
            if (type && BUILDER_NODE_TYPES.includes(type as BuilderNodeType)) void addBuilderElement(type as BuilderNodeType);
          }}
        >
          {!hasPageBindings && (
            <div className="visual-initialize-banner" role="status">
              <div>
                <strong>This page does not yet have a CMS component tree.</strong>
                <p>
                  Create the structured page draft to make every visual block
                  editable. Nothing will be published automatically.
                </p>
              </div>
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={initializing}
                onClick={() => void initializeEditableDrafts()}
              >
                {initializing ? 'Preparing editable drafts…' : 'Create CMS page tree'}
              </button>
            </div>
          )}
          <div ref={canvasRef} className={`visual-canvas visual-canvas-${device}`}>
            {isCustomPage ? (
              <CustomPageLayout title={activePageTitle} page={builderPage} chrome={previewChrome}
                style={designVariables(designSystemFromDoc(globalSettings?.data.design))}
                previewCss editable selectedNodeId={selectedBuilderNodeId}
                onSelectNode={(nodeId) => { setSelectedBuilderNodeId(nodeId); setSelected(null); }}
                onDropNode={moveBuilderBlock} onDragStartNode={setDraggedBuilderNodeId}
                onUpdateNodeProp={(nodeId, key, value) => changeBuilderNode(nodeId, (node) => ({ ...node, props: { ...node.props, [key]: value } }))} />
            ) : (
              <CmsSitePage
                kind={page}
                page={builderPage}
                chrome={previewChrome}
                style={designVariables(designSystemFromDoc(globalSettings?.data.design))}
                previewCss
                editable
                selectedNodeId={selectedBuilderNodeId}
                onSelectNode={(nodeId) => { setSelectedBuilderNodeId(nodeId); setSelected(null); }}
                onDropNode={moveBuilderBlock}
                onDragStartNode={setDraggedBuilderNodeId}
                onUpdateNodeProp={(nodeId, key, value) => changeBuilderNode(nodeId, (node) => ({ ...node, props: { ...node.props, [key]: value } }))}
              />
            )}
            {isCustomPage && !BUILDER_SLOTS.some((slot) => builderPage.slots[slot.id].length) && (
                <div className="visual-builder-drop-target">
                  Drag an element here or choose one from the library.
                </div>
            )}
          </div>
        </main>

        <aside className="visual-right-panel">
          <div className="visual-panel-heading">
            <MousePointer2 size={16} />
            <span>Content settings</span>
          </div>
          {selectedBuilderNode ? (
            <div className="visual-settings-content">
              <div className="visual-selection-label">
                <span>Structured block</span>
                <strong>{selectedBuilderNode.type}</strong>
                <small>Edit content and layout here, or use Element CSS to style any part of this block.</small>
              </div>
              {['section', 'container', 'row', 'column', 'grid', 'card'].includes(selectedBuilderNode.type) && (
                <label className="visual-field">
                  <span>Editor label</span>
                  <input value={String(selectedBuilderNode.props.label ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, label: event.target.value } }))} />
                </label>
              )}
              {DESIGN_BLOCK_FIELDS[selectedBuilderNode.type]?.filter((field) => field.key !== DESIGN_BLOCK_REPEATERS[selectedBuilderNode.type]?.key).map((field) => (
                <label key={field.key} className="visual-field">
                  <span>{field.label}</span>
                  {field.kind === 'boolean' ? (
                    <input type="checkbox" checked={Boolean(selectedBuilderNode.props[field.key])} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, [field.key]: event.target.checked } }))} />
                  ) : field.kind === 'select' ? (
                    <select value={String(selectedBuilderNode.props[field.key] ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, [field.key]: event.target.value } }))}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  ) : field.multiline ? (
                    <textarea
                      value={String(selectedBuilderNode.props[field.key] ?? '')}
                      onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, [field.key]: event.target.value } }))}
                    />
                  ) : (
                    <input
                      type={field.kind === 'number' ? 'number' : 'text'}
                      value={String(selectedBuilderNode.props[field.key] ?? '')}
                      onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, [field.key]: field.kind === 'number' ? Number(event.target.value) : event.target.value } }))}
                    />
                  )}
                  {field.kind === 'media' && media.some((asset) => asset.mimeType.startsWith('image/')) && <select value="" onChange={(event) => { if (event.target.value) changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, [field.key]: event.target.value } })); }}><option value="">Choose from media…</option>{media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}</select>}
                </label>
              ))}
              {selectedBuilderRepeater && (
                <BuilderRepeaterEditor
                  config={selectedBuilderRepeater}
                  value={selectedBuilderNode.props[selectedBuilderRepeater.key]}
                  onChange={(value) => changeBuilderNode(selectedBuilderNode.id, (node) => ({
                    ...node,
                    props: { ...node.props, [selectedBuilderRepeater.key]: value },
                  }))}
                />
              )}
              {['heading', 'text'].includes(selectedBuilderNode.type) && (
                <label className="visual-field">
                  <span>{selectedBuilderNode.type === 'heading' ? 'Heading' : 'Text'}</span>
                  <textarea value={String(selectedBuilderNode.props.text ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, text: event.target.value } }))} />
                </label>
              )}
              {selectedBuilderNode.type === 'heading' && (
                <label className="visual-field">
                  <span>Heading level</span>
                  <select value={String(selectedBuilderNode.props.level ?? 2)} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, level: Number(event.target.value) } }))}>
                    <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option><option value="4">H4</option>
                  </select>
                </label>
              )}
              {selectedBuilderNode.type === 'image' && (
                <>
                  <label className="visual-field">
                    <span>Image URL</span>
                    <input value={String(selectedBuilderNode.props.src ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, src: event.target.value } }))} />
                  </label>
                  <label className="visual-field">
                    <span>Alt text</span>
                    <input value={String(selectedBuilderNode.props.alt ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, alt: event.target.value } }))} />
                  </label>
                  <label className="visual-field">
                    <span>Image title</span>
                    <input value={String(selectedBuilderNode.props.title ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, title: event.target.value } }))} />
                  </label>
                  <label className="visual-field">
                    <span>Caption</span>
                    <textarea value={String(selectedBuilderNode.props.caption ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, caption: event.target.value } }))} />
                  </label>
                  {media.length > 0 && (
                    <label className="visual-field">
                      <span>Media library</span>
                      <select value="" onChange={(event) => { if (event.target.value) changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, src: event.target.value } })); }}>
                        <option value="">Choose an uploaded image…</option>
                        {media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}
                      </select>
                    </label>
                  )}
                </>
              )}
              {selectedBuilderNode.type === 'button' && (
                <>
                  <label className="visual-field"><span>Button label</span><input value={String(selectedBuilderNode.props.label ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, label: event.target.value } }))} /></label>
                  <label className="visual-field"><span>Destination</span><input value={String(selectedBuilderNode.props.href ?? '')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, href: event.target.value } }))} /></label>
                  <label className="visual-field"><span>Button treatment</span><select value={String(selectedBuilderNode.props.variant ?? 'primary')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, variant: event.target.value } }))}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></label>
                </>
              )}
              {(selectedBuilderNode.type === 'columns' || selectedBuilderNode.type === 'grid') && (
                <label className="visual-field"><span>Desktop columns</span><select value={String(selectedBuilderNode.props.columns ?? 2)} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, columns: Number(event.target.value) } }))}><option value="1">One column</option><option value="2">Two columns</option><option value="3">Three columns</option><option value="4">Four columns</option><option value="5">Five columns</option><option value="6">Six columns</option></select></label>
              )}
              {selectedBuilderNode.type === 'spacer' && (
                <label className="visual-field"><span>Spacer size</span><select value={String(selectedBuilderNode.props.size ?? 'regular')} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, props: { ...node.props, size: event.target.value } }))}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
              )}
              <section className="visual-section-actions">
                <h3>Layout & visibility</h3>
                <label className="visual-field"><span>Colour treatment</span><select value={selectedBuilderNode.styles.tone} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, tone: event.target.value as BuilderNode['styles']['tone'] } }))}><option value="default">Default</option><option value="muted">Soft neutral</option><option value="brand">Brand dark</option><option value="gradient">Brand gradient</option></select></label>
                <label className="visual-field"><span>Vertical spacing</span><select value={selectedBuilderNode.styles.padding} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, padding: event.target.value as BuilderNode['styles']['padding'] } }))}><option value="inherit">Original component spacing</option><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                <label className="visual-field"><span>Content alignment</span><select value={selectedBuilderNode.styles.align} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, align: event.target.value as BuilderNode['styles']['align'] } }))}><option value="inherit">Original component alignment</option><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
                <label className="visual-field"><span>Content width</span><select value={selectedBuilderNode.styles.width} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, width: event.target.value as BuilderNode['styles']['width'] } }))}><option value="inherit">Original component width</option><option value="content">Content</option><option value="wide">Wide</option><option value="full">Full bleed</option></select></label>
                <label className="visual-field"><span>Corner radius</span><select value={selectedBuilderNode.styles.radius} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, radius: event.target.value as BuilderNode['styles']['radius'] } }))}><option value="none">None</option><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></label>
                <label className="visual-field"><span>Border</span><select value={selectedBuilderNode.styles.border} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, border: event.target.value as BuilderNode['styles']['border'] } }))}><option value="none">None</option><option value="soft">Soft</option><option value="strong">Strong</option></select></label>
                <label className="visual-field"><span>Shadow</span><select value={selectedBuilderNode.styles.shadow} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, shadow: event.target.value as BuilderNode['styles']['shadow'] } }))}><option value="none">None</option><option value="soft">Soft</option><option value="lifted">Lifted</option></select></label>
                <label className="visual-field"><span>Internal gap</span><select value={selectedBuilderNode.styles.gap} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, gap: event.target.value as BuilderNode['styles']['gap'] } }))}><option value="inherit">Original component gap</option><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                <label className="visual-field"><span>Hover effect</span><select value={selectedBuilderNode.styles.hover} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, hover: event.target.value as BuilderNode['styles']['hover'] } }))}><option value="none">None</option><option value="lift">Lift</option></select></label>
                <label className="visual-field"><span>Entrance motion</span><select value={selectedBuilderNode.styles.motion} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, styles: { ...node.styles, motion: event.target.value as BuilderNode['styles']['motion'] } }))}><option value="none">None</option><option value="reveal">Reveal</option><option value="float">Float</option></select></label>
                <label className="visual-field"><span>Visibility</span><select value={selectedBuilderNode.responsive.visibility} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, visibility: event.target.value as BuilderNode['responsive']['visibility'] } }))}><option value="all">All devices</option><option value="desktop">Desktop only</option><option value="mobile">Mobile only</option></select></label>
                <label className="visual-field"><span>Tablet alignment</span><select value={selectedBuilderNode.responsive.tabletAlign} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, tabletAlign: event.target.value as BuilderNode['responsive']['tabletAlign'] } }))}><option value="inherit">Use desktop</option><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
                <label className="visual-field"><span>Mobile alignment</span><select value={selectedBuilderNode.responsive.mobileAlign} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, mobileAlign: event.target.value as BuilderNode['responsive']['mobileAlign'] } }))}><option value="inherit">Use tablet</option><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
                <label className="visual-field"><span>Tablet spacing</span><select value={selectedBuilderNode.responsive.tabletPadding} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, tabletPadding: event.target.value as BuilderNode['responsive']['tabletPadding'] } }))}><option value="inherit">Use desktop</option><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                <label className="visual-field"><span>Mobile spacing</span><select value={selectedBuilderNode.responsive.mobilePadding} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, mobilePadding: event.target.value as BuilderNode['responsive']['mobilePadding'] } }))}><option value="inherit">Use tablet</option><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                {selectedBuilderNode.type === 'columns' && <><label className="visual-field"><span>Tablet columns</span><select value={selectedBuilderNode.responsive.tabletColumns} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, tabletColumns: event.target.value === 'inherit' ? 'inherit' : Number(event.target.value) as 1 | 2 | 3 | 4 } }))}><option value="inherit">Use desktop</option><option value="1">One</option><option value="2">Two</option><option value="3">Three</option><option value="4">Four</option></select></label><label className="visual-field"><span>Mobile columns</span><select value={selectedBuilderNode.responsive.mobileColumns} onChange={(event) => changeBuilderNode(selectedBuilderNode.id, (node) => ({ ...node, responsive: { ...node.responsive, mobileColumns: event.target.value === 'inherit' ? 'inherit' : Number(event.target.value) as 1 | 2 | 3 | 4 } }))}><option value="inherit">Use tablet</option><option value="1">One</option><option value="2">Two</option><option value="3">Three</option><option value="4">Four</option></select></label></>}
              </section>
              <BuilderStyleControls
                node={selectedBuilderNode}
                device={device}
                media={media}
                onChange={(nextNode) => changeBuilderNode(selectedBuilderNode.id, () => nextNode)}
              />
              <section className="visual-section-actions">
                <h3>Block actions</h3>
                <button type="button" onClick={duplicateSelectedBuilderNode}><Copy size={15} /> Duplicate</button>
                <button type="button" onClick={copySelectedBuilderNode}><Copy size={15} /> Copy</button>
                <button type="button" disabled={!copiedBuilderNode} onClick={pasteBuilderNode}><Plus size={15} /> Paste here</button>
                <button type="button" onClick={() => void createBuilderTemplate('block')}><Plus size={15} /> Save as reusable block</button>
                <button type="button" className="danger" onClick={removeSelectedBuilderNode}><Archive size={15} /> Remove</button>
              </section>
            </div>
          ) : !selectedDocument ? (
            <div className="visual-empty-settings">
              <MousePointer2 size={24} />
              <p>
                Click a highlighted item in the preview, or choose a layer to
                edit it.
              </p>
            </div>
          ) : (
            <div className="visual-settings-content">
              <div className="visual-selection-label">
                <span>{selectedDocument.type.replace('_', ' ')}</span>
                <strong>{selectedDocument.title}</strong>
                <small>
                  {selectedDocument.status === 'published'
                    ? 'Published — edits stay draft until you publish'
                    : 'Draft'}
                </small>
              </div>
              {selectedDocument.type === 'navigation' && (
                <section className="visual-section-actions visual-header-editor">
                  <h3>Header navigation</h3>
                  <p>
                    Edit the shared header links. These labels and destinations
                    are used on every public page.
                  </p>
                  <label className="visual-field">
                    <span>Header button label</span>
                    <input
                      value={text(selectedDocument.data.ctaLabel, 'Start a conversation')}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: 'ctaLabel' },
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label className="visual-field">
                    <span>Header button destination</span>
                    <input
                      value={text(selectedDocument.data.ctaHref, '#contact')}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: 'ctaHref' },
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  {selectedHeaderLinks.map((item, index) => (
                    <div key={item.id} className="visual-header-link">
                      <input
                        aria-label={`Header label ${index + 1}`}
                        value={item.label}
                        placeholder="Link label"
                        onChange={(event) =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.map((link, linkIndex) =>
                              linkIndex === index
                                ? { ...link, label: event.target.value }
                                : link,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={`Header destination ${index + 1}`}
                        value={item.href}
                        placeholder="/destination or #section"
                        onChange={(event) =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.map((link, linkIndex) =>
                              linkIndex === index
                                ? { ...link, href: event.target.value }
                                : link,
                            ),
                          )
                        }
                      />
                      <select aria-label={`Parent menu for ${item.label || `link ${index + 1}`}`} value={item.parentId ?? ''} onChange={(event) => updateHeaderLinks(selectedDocument.id, selectedHeaderLinks.map((link, linkIndex) => linkIndex === index ? { ...link, parentId: event.target.value || undefined } : link))}>
                        <option value="">Top-level link</option>
                        {selectedHeaderLinks.filter((candidate) => candidate.id !== item.id && !candidate.parentId).map((candidate) => <option key={candidate.id} value={candidate.id}>Under {candidate.label || 'unnamed link'}</option>)}
                      </select>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            updateHeaderLinks(
                              selectedDocument.id,
                              selectedHeaderLinks.map((link, linkIndex) =>
                                linkIndex === index
                                  ? { ...link, enabled: event.target.checked }
                                  : link,
                              ),
                            )
                          }
                        />
                        Show
                      </label>
                      <button type="button" aria-label={`Move ${item.label || 'link'} up`} disabled={index === 0} onClick={() => { const next = [...selectedHeaderLinks]; const [moved] = next.splice(index, 1); next.splice(index - 1, 0, moved); updateHeaderLinks(selectedDocument.id, next); }}><ArrowUp size={14} /></button>
                      <button type="button" aria-label={`Move ${item.label || 'link'} down`} disabled={index === selectedHeaderLinks.length - 1} onClick={() => { const next = [...selectedHeaderLinks]; const [moved] = next.splice(index, 1); next.splice(index + 1, 0, moved); updateHeaderLinks(selectedDocument.id, next); }}><ArrowDown size={14} /></button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          updateHeaderLinks(
                            selectedDocument.id,
                            selectedHeaderLinks.filter(
                              (_, linkIndex) => linkIndex !== index,
                            ),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateHeaderLinks(selectedDocument.id, [
                        ...selectedHeaderLinks,
                        {
                          id: `header-link-${crypto.randomUUID()}`,
                          label: 'New link',
                          href: '#',
                          enabled: true,
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> Add header link
                  </button>
                </section>
              )}
              {selectedDocument.type === 'site_settings' && (
                <section className="visual-section-actions visual-header-editor">
                  <h3>Global design system</h3>
                  <p>
                    These shared tokens drive the public website and every reusable CMS design block.
                  </p>
                  <div className="visual-theme-groups">
                    <h4>Brand assets</h4>
                    {BRANDING_FIELDS.map((field) => <label className="visual-field" key={field.key}><span>{field.label}</span><input value={text(selectedDocument.data[field.key])} placeholder="Choose or paste an image URL" onChange={(event) => updateField({ documentId: selectedDocument.id, key: field.key }, event.target.value)} />{media.some((asset) => asset.mimeType.startsWith('image/')) && <select value="" onChange={(event) => { if (event.target.value) updateField({ documentId: selectedDocument.id, key: field.key }, event.target.value); }}><option value="">Choose from media…</option>{media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.url}>{asset.filename}</option>)}</select>}</label>)}
                    {BRANDING_LAYOUT_FIELDS.map((field) => <label className="visual-field" key={field.key}><span>{field.label}</span><input value={text(selectedDocument.data[field.key])} onChange={(event) => updateField({ documentId: selectedDocument.id, key: field.key }, event.target.value)} /></label>)}
                  </div>
                  <div className="visual-design-tokens">
                    {DESIGN_COLOR_FIELDS.map((field) => (
                      <label key={field.key} className="visual-field">
                        <span>{field.label}</span>
                        <input
                          type="color"
                          value={selectedDesign[field.key]}
                          onChange={(event) => updateDesignField(selectedDocument.id, field.key, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="visual-field">
                    <span>Corner-radius scale</span>
                    <select value={selectedDesign.radius} onChange={(event) => updateDesignField(selectedDocument.id, 'radius', event.target.value)}>
                      <option value="compact">Compact</option><option value="regular">Regular</option><option value="generous">Generous</option>
                    </select>
                  </label>
                  <label className="visual-field">
                    <span>Maximum content width</span>
                    <select value={selectedDesign.container} onChange={(event) => updateDesignField(selectedDocument.id, 'container', event.target.value)}>
                      <option value="standard">Standard</option><option value="wide">Wide</option>
                    </select>
                  </label>
                  <div className="visual-theme-groups">
                    <h4>Typography</h4>
                    <label className="visual-field"><span>Heading font</span><select value={selectedDesign.headingFont} onChange={(event) => updateDesignField(selectedDocument.id, 'headingFont', event.target.value)}><option value="geist">INFOStorage sans</option><option value="system">System sans</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label>
                    <label className="visual-field"><span>Body font</span><select value={selectedDesign.bodyFont} onChange={(event) => updateDesignField(selectedDocument.id, 'bodyFont', event.target.value)}><option value="geist">INFOStorage sans</option><option value="system">System sans</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label>
                    <label className="visual-field"><span>Base text size</span><select value={selectedDesign.baseFontSize} onChange={(event) => updateDesignField(selectedDocument.id, 'baseFontSize', event.target.value)}><option value="compact">Compact</option><option value="regular">Regular</option><option value="large">Large</option></select></label>
                    <label className="visual-field"><span>Heading weight</span><select value={selectedDesign.headingWeight} onChange={(event) => updateDesignField(selectedDocument.id, 'headingWeight', event.target.value)}><option value="regular">Regular</option><option value="medium">Medium</option><option value="bold">Bold</option></select></label>
                    <label className="visual-field"><span>Body weight</span><select value={selectedDesign.bodyWeight} onChange={(event) => updateDesignField(selectedDocument.id, 'bodyWeight', event.target.value)}><option value="regular">Regular</option><option value="medium">Medium</option></select></label>
                    <label className="visual-field"><span>Line spacing</span><select value={selectedDesign.lineHeight} onChange={(event) => updateDesignField(selectedDocument.id, 'lineHeight', event.target.value)}><option value="tight">Tight</option><option value="regular">Regular</option><option value="relaxed">Relaxed</option></select></label>
                    <label className="visual-field"><span>Letter spacing</span><select value={selectedDesign.letterSpacing} onChange={(event) => updateDesignField(selectedDocument.id, 'letterSpacing', event.target.value)}><option value="tight">Tight</option><option value="regular">Regular</option><option value="wide">Wide</option></select></label>
                    <h4>Components and spacing</h4>
                    <label className="visual-field"><span>Button corners</span><select value={selectedDesign.buttonRadius} onChange={(event) => updateDesignField(selectedDocument.id, 'buttonRadius', event.target.value)}><option value="square">Square</option><option value="regular">Regular</option><option value="pill">Pill</option></select></label>
                    <label className="visual-field"><span>Card corners</span><select value={selectedDesign.cardRadius} onChange={(event) => updateDesignField(selectedDocument.id, 'cardRadius', event.target.value)}><option value="compact">Compact</option><option value="regular">Regular</option><option value="generous">Generous</option></select></label>
                    <label className="visual-field"><span>Global shadow</span><select value={selectedDesign.shadow} onChange={(event) => updateDesignField(selectedDocument.id, 'shadow', event.target.value)}><option value="none">None</option><option value="soft">Soft</option><option value="strong">Strong</option></select></label>
                    <label className="visual-field"><span>Page spacing</span><select value={selectedDesign.pageSpacing} onChange={(event) => updateDesignField(selectedDocument.id, 'pageSpacing', event.target.value)}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                    <label className="visual-field"><span>Section spacing</span><select value={selectedDesign.sectionSpacing} onChange={(event) => updateDesignField(selectedDocument.id, 'sectionSpacing', event.target.value)}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                    <label className="visual-field"><span>Grid gap</span><select value={selectedDesign.gridGap} onChange={(event) => updateDesignField(selectedDocument.id, 'gridGap', event.target.value)}><option value="compact">Compact</option><option value="regular">Regular</option><option value="spacious">Spacious</option></select></label>
                  </div>
                </section>
              )}
              {selectedFields.map((field) => (
                <label key={field.key} className="visual-field">
                  <span>{fieldName(field.key)}</span>
                  {typeof field.value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) =>
                        updateField(
                          { documentId: selectedDocument.id, key: field.key },
                          event.target.checked,
                        )
                      }
                    />
                  ) : (
                    <>
                      {field.key === selected?.key &&
                      field.value.length > 90 ? (
                        <textarea
                          value={field.value}
                          onChange={(event) =>
                            updateField(
                              {
                                documentId: selectedDocument.id,
                                key: field.key,
                              },
                              event.target.value,
                            )
                          }
                        />
                      ) : (
                        <input
                          value={field.value}
                          onFocus={() =>
                            setSelected({
                              documentId: selectedDocument.id,
                              key: field.key,
                            })
                          }
                          onChange={(event) =>
                            updateField(
                              {
                                documentId: selectedDocument.id,
                                key: field.key,
                              },
                              event.target.value,
                            )
                          }
                        />
                      )}
                      {isMediaKey(field.key) && media.length > 0 && (
                        <select
                          value=""
                          onChange={(event) => {
                            if (event.target.value)
                              updateField(
                                {
                                  documentId: selectedDocument.id,
                                  key: field.key,
                                },
                                event.target.value,
                              );
                          }}
                        >
                          <option value="">Replace from media library…</option>
                          {media
                            .filter((asset) =>
                              asset.mimeType.startsWith('image/'),
                            )
                            .map((asset) => (
                              <option key={asset.id} value={asset.url}>
                                {asset.filename}
                              </option>
                            ))}
                        </select>
                      )}
                    </>
                  )}
                </label>
              ))}
              <section className="visual-section-actions">
                <h3>Block actions</h3>
                {['solution', 'service', 'partner', 'client'].includes(
                  selectedDocument.type,
                ) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void duplicateSelected()}
                    >
                      <Copy size={15} /> Duplicate
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void archiveSelected()}
                    >
                      <Archive size={15} /> Archive
                    </button>
                  </>
                ) : (
                  <p>
                    This is a protected layout or shared component. Its content
                    can change, but its placement stays safe.
                  </p>
                )}
              </section>
              <section className="visual-section-actions">
                <h3>Revision safety</h3>
                <p>
                  Every autosave creates a draft revision. Publishing never
                  exposes unsaved edits.
                </p>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type PreviewProps = {
  documents: CmsDocument[];
  selected: FieldRef | null;
  onSelect: (field: FieldRef) => void;
  onChange: (field: FieldRef, value: string) => void;
  onSelectDocument: (document: CmsDocument, key?: string) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  onDropRepeater: (type: string, targetId: string) => void;
};

function HomePreview(props: PreviewProps) {
  const {
    documents,
    selected,
    onSelect,
    onChange,
    onSelectDocument,
    draggedId,
    setDraggedId,
    onDropRepeater,
  } = props;
  const get = (type: string, slug: string) =>
    findDocument(documents, type, slug);
  const ref = (
    document: CmsDocument | undefined,
    key: string,
  ): FieldRef | undefined =>
    document ? { documentId: document.id, key } : undefined;
  const value = (
    document: CmsDocument | undefined,
    key: string,
    fallback: string,
  ) =>
    document
      ? key === '__title'
        ? document.title
        : text(document.data[key], fallback)
      : fallback;
  const site = get('site_settings', 'global');
  const navigation = get('navigation', 'main');
  const hero = get('home_section', 'hero');
  const approach = get('home_section', 'approach');
  const solutionsHeading = get('home_section', 'solutions-heading');
  const continuity = get('home_section', 'continuity');
  const servicesHeading = get('home_section', 'services-heading');
  const sectors = get('home_section', 'sectors');
  const contact = get('home_section', 'contact');
  const solutions = documents.filter(
    (document) => document.type === 'solution',
  );
  const services = documents.filter((document) => document.type === 'service');
  const logo = value(site, 'logo', DEFAULT_HOME.site.logo);
  const logoSelected =
    selected?.documentId === site?.id && selected?.key === 'logo';
  const solutionFallbacks = DEFAULT_HOME.solutions;
  const serviceFallbacks = DEFAULT_HOME.services;
  const navLinks = headerLinks(navigation?.data.items).length
    ? headerLinks(navigation?.data.items)
    : DEFAULT_HOME.navItems;

  return (
    <div className="site-shell visual-public-preview">
      <section
        className="hero visual-section"
        onClick={() => hero && onSelectDocument(hero)}
      >
        <nav
          className="nav-wrap visual-header-preview"
          onClick={(event) => {
            event.stopPropagation();
            if (navigation) onSelectDocument(navigation);
          }}
        >
          <span
            className="brand brand-image"
            role={site ? 'button' : undefined}
            tabIndex={site ? 0 : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (site) onSelectDocument(site, 'logo');
            }}
          >
            <span className="brand-logo-frame">
              <img className="brand-logo" src={logo} alt="INFOStorage" />
            </span>
          </span>
          <div className="desktop-links">
            {navLinks
              .filter((item) => item.enabled)
              .map((item) => <span key={item.id}>{item.label}</span>)}
          </div>
          <span className="nav-cta">
            <EditorText
              field={ref(navigation, 'ctaLabel')}
              value={value(navigation, 'ctaLabel', 'Start a conversation')}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </span>
        </nav>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">
              <EditorText
                field={ref(hero, 'eyebrow')}
                value={value(hero, 'eyebrow', DEFAULT_HOME.hero.eyebrow)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h1 className="hero-title">
              <EditorText
                field={ref(hero, 'titleA')}
                value={value(hero, 'titleA', DEFAULT_HOME.hero.titleA)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />{' '}
              <span>
                <EditorText
                  field={ref(hero, 'titleAccent')}
                  value={value(
                    hero,
                    'titleAccent',
                    DEFAULT_HOME.hero.titleAccent,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </h1>
            <p className="hero-description">
              <EditorText
                field={ref(hero, 'description')}
                value={value(
                  hero,
                  'description',
                  DEFAULT_HOME.hero.description,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <div className="hero-actions">
              <span className="button button-primary">
                <EditorText
                  field={ref(hero, 'primaryLabel')}
                  value={value(
                    hero,
                    'primaryLabel',
                    DEFAULT_HOME.hero.primaryLabel,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
              <span className="button button-quiet">
                <EditorText
                  field={ref(hero, 'secondaryLabel')}
                  value={value(
                    hero,
                    'secondaryLabel',
                    DEFAULT_HOME.hero.secondaryLabel,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </div>
          </div>
          <div className="hero-brand-stage">
            <div className="hero-logo-plaque">
              <img
                className={`visual-editable-image ${logoSelected ? 'visual-editable-selected' : ''}`}
                src={logo}
                alt="INFOStorage"
                role={site ? 'button' : undefined}
                tabIndex={site ? 0 : undefined}
                data-cms-document-id={site?.id}
                data-cms-field={site ? 'logo' : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  if (site) onSelectDocument(site, 'logo');
                }}
                onKeyDown={(event) => {
                  if (site && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSelectDocument(site, 'logo');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>
      <section
        className="intro section-pad visual-section"
        onClick={() => approach && onSelectDocument(approach)}
      >
        <div className="section-kicker">
          <EditorText
            field={ref(approach, 'kicker')}
            value={value(approach, 'kicker', DEFAULT_HOME.approach.kicker)}
            selected={selected}
            onSelect={onSelect}
            onChange={onChange}
          />
        </div>
        <div className="intro-grid">
          <h2 className="display-heading">
            <EditorText
              field={ref(approach, 'headingA')}
              value={value(
                approach,
                'headingA',
                DEFAULT_HOME.approach.headingA,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
            <br />
            <em>
              <EditorText
                field={ref(approach, 'headingAccent')}
                value={value(
                  approach,
                  'headingAccent',
                  DEFAULT_HOME.approach.headingAccent,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </em>
          </h2>
          <div className="intro-copy">
            <p>
              <EditorText
                field={ref(approach, 'body')}
                value={value(approach, 'body', DEFAULT_HOME.approach.body)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
          </div>
        </div>
      </section>
      <section
        className="solutions-section section-pad visual-section"
        onClick={() => solutionsHeading && onSelectDocument(solutionsHeading)}
      >
        <div className="solutions-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(solutionsHeading, 'kicker')}
                value={value(
                  solutionsHeading,
                  'kicker',
                  DEFAULT_HOME.solutionsHeading.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2 className="display-heading">
              <EditorText
                field={ref(solutionsHeading, 'heading')}
                value={value(
                  solutionsHeading,
                  'heading',
                  DEFAULT_HOME.solutionsHeading.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(solutionsHeading, 'body')}
              value={value(
                solutionsHeading,
                'body',
                DEFAULT_HOME.solutionsHeading.body,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="solutions-grid">
          {(solutions.length ? solutions : solutionFallbacks).map(
            (item, index) => {
              const document = 'id' in item ? (item as CmsDocument) : undefined;
              const fallback = document ? undefined : (item as SolutionContent);
              return (
                <article
                  key={document?.id ?? fallback?.title}
                  className={`solution-card visual-repeater ${draggedId === document?.id ? 'dragging' : ''}`}
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('solution', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <div className="solution-topline">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <GripVertical size={18} />
                  </div>
                  <h3>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback?.title ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </h3>
                  <p>
                    <EditorText
                      field={ref(document, 'description')}
                      value={value(
                        document,
                        'description',
                        fallback?.description ?? '',
                      )}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </p>
                </article>
              );
            },
          )}
        </div>
      </section>
      <section
        className="continuity-panel section-pad visual-section"
        onClick={() => continuity && onSelectDocument(continuity)}
      >
        <div className="continuity-art" />
        <div className="continuity-copy">
          <p className="eyebrow">
            <EditorText
              field={ref(continuity, 'eyebrow')}
              value={value(
                continuity,
                'eyebrow',
                DEFAULT_HOME.continuity.eyebrow,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2>
            <EditorText
              field={ref(continuity, 'heading')}
              value={value(
                continuity,
                'heading',
                DEFAULT_HOME.continuity.heading,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
          <p>
            <EditorText
              field={ref(continuity, 'body')}
              value={value(continuity, 'body', DEFAULT_HOME.continuity.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
      </section>
      <section
        className="services-section section-pad visual-section"
        onClick={() => servicesHeading && onSelectDocument(servicesHeading)}
      >
        <div className="services-head">
          <p className="section-kicker">
            <EditorText
              field={ref(servicesHeading, 'kicker')}
              value={value(
                servicesHeading,
                'kicker',
                DEFAULT_HOME.servicesHead.kicker,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2 className="display-heading">
            <EditorText
              field={ref(servicesHeading, 'heading')}
              value={value(
                servicesHeading,
                'heading',
                DEFAULT_HOME.servicesHead.heading,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
        </div>
        <div className="service-list">
          {(services.length ? services : serviceFallbacks).map(
            (item, index) => {
              const document =
                typeof item === 'object' ? (item as CmsDocument) : undefined;
              const fallback = typeof item === 'string' ? item : '';
              return (
                <div
                  key={document?.id ?? fallback}
                  className="service-row visual-repeater"
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('service', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback)}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </strong>
                  <GripVertical size={18} />
                </div>
              );
            },
          )}
        </div>
      </section>
      <section
        className="sectors section-pad visual-section"
        onClick={() => sectors && onSelectDocument(sectors)}
      >
        <div className="sectors-copy">
          <p className="section-kicker">
            <EditorText
              field={ref(sectors, 'kicker')}
              value={value(sectors, 'kicker', DEFAULT_HOME.sectors.kicker)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2 className="display-heading">
            <EditorText
              field={ref(sectors, 'heading')}
              value={value(sectors, 'heading', DEFAULT_HOME.sectors.heading)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
        </div>
      </section>
      <section
        className="contact-panel visual-section"
        onClick={() => contact && onSelectDocument(contact)}
      >
        <div className="contact-content">
          <p className="eyebrow">
            <EditorText
              field={ref(contact, 'eyebrow')}
              value={value(contact, 'eyebrow', DEFAULT_HOME.contact.eyebrow)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
          <h2>
            <EditorText
              field={ref(contact, 'heading')}
              value={value(contact, 'heading', DEFAULT_HOME.contact.heading)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </h2>
          <p>
            <EditorText
              field={ref(contact, 'body')}
              value={value(contact, 'body', DEFAULT_HOME.contact.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
      </section>
    </div>
  );
}

function PartnersPreview(props: PreviewProps) {
  const {
    documents,
    selected,
    onSelect,
    onChange,
    onSelectDocument,
    draggedId,
    setDraggedId,
    onDropRepeater,
  } = props;
  const get = (type: string, slug: string) =>
    findDocument(documents, type, slug);
  const ref = (
    document: CmsDocument | undefined,
    key: string,
  ): FieldRef | undefined =>
    document ? { documentId: document.id, key } : undefined;
  const value = (
    document: CmsDocument | undefined,
    key: string,
    fallback: string,
  ) =>
    document
      ? key === '__title'
        ? document.title
        : text(document.data[key], fallback)
      : fallback;
  const hero = get('page_section', 'partners-hero');
  const navigation = get('navigation', 'main');
  const site = get('site_settings', 'global');
  const directory = get('page_section', 'partners-directory');
  const clientsHead = get('page_section', 'partners-clients');
  const partners = documents.filter((document) => document.type === 'partner');
  const clients = documents.filter((document) => document.type === 'client');
  const partnerFallbacks = DEFAULT_PARTNERS.partners;
  const clientFallbacks = DEFAULT_PARTNERS.clients;
  const navLinks = headerLinks(navigation?.data.items).length
    ? headerLinks(navigation?.data.items)
    : DEFAULT_PARTNERS.navItems;
  return (
    <div className="partner-page visual-public-preview">
      <section
        className="partner-hero visual-section"
        onClick={() => hero && onSelectDocument(hero)}
      >
        <nav
          className="nav-wrap visual-header-preview"
          onClick={(event) => {
            event.stopPropagation();
            if (navigation) onSelectDocument(navigation);
          }}
        >
          <span
            className="brand"
            role={site ? 'button' : undefined}
            tabIndex={site ? 0 : undefined}
            onClick={(event) => {
              event.stopPropagation();
              if (site) onSelectDocument(site, 'logo');
            }}
          >
            INFOStorage
          </span>
          <div className="desktop-links">
            {navLinks
              .filter((item) => item.enabled)
              .map((item) => <span key={item.id}>{item.label}</span>)}
          </div>
          <span className="nav-cta">
            <EditorText
              field={ref(navigation, 'ctaLabel')}
              value={value(navigation, 'ctaLabel', 'Start a conversation')}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </span>
        </nav>
        <div className="partner-hero-inner section-pad">
          <div className="partner-hero-copy">
            <p className="eyebrow">
              <EditorText
                field={ref(hero, 'eyebrow')}
                value={value(hero, 'eyebrow', DEFAULT_PARTNERS.hero.eyebrow)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h1 className="partner-title">
              <EditorText
                field={ref(hero, 'titleA')}
                value={value(hero, 'titleA', DEFAULT_PARTNERS.hero.titleA)}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />{' '}
              <span>
                <EditorText
                  field={ref(hero, 'titleAccent')}
                  value={value(
                    hero,
                    'titleAccent',
                    DEFAULT_PARTNERS.hero.titleAccent,
                  )}
                  selected={selected}
                  onSelect={onSelect}
                  onChange={onChange}
                />
              </span>
            </h1>
            <p className="partner-description">
              <EditorText
                field={ref(hero, 'description')}
                value={value(
                  hero,
                  'description',
                  DEFAULT_PARTNERS.hero.description,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
          </div>
        </div>
      </section>
      <section
        className="partner-directory section-pad visual-section"
        onClick={() => directory && onSelectDocument(directory)}
      >
        <div className="partner-directory-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(directory, 'kicker')}
                value={value(
                  directory,
                  'kicker',
                  DEFAULT_PARTNERS.directory.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2 className="display-heading">
              <EditorText
                field={ref(directory, 'heading')}
                value={value(
                  directory,
                  'heading',
                  DEFAULT_PARTNERS.directory.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(directory, 'body')}
              value={value(directory, 'body', DEFAULT_PARTNERS.directory.body)}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="partner-grid">
          {(partners.length ? partners : partnerFallbacks).map(
            (item, index) => {
              const document = 'id' in item ? (item as CmsDocument) : undefined;
              const fallback = document ? undefined : (item as PartnerContent);
              return (
                <article
                  key={document?.id ?? fallback?.name}
                  className="partner-card visual-repeater"
                  draggable={Boolean(document)}
                  onDragStart={() => document && setDraggedId(document.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() =>
                    document && onDropRepeater('partner', document.id)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (document) onSelectDocument(document);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>
                    <EditorText
                      field={ref(document, '__title')}
                      value={value(document, '__title', fallback?.name ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </h3>
                  <p>
                    <EditorText
                      field={ref(document, 'focus')}
                      value={value(document, 'focus', fallback?.focus ?? '')}
                      selected={selected}
                      onSelect={onSelect}
                      onChange={onChange}
                    />
                  </p>
                  <GripVertical size={16} />
                </article>
              );
            },
          )}
        </div>
      </section>
      <section
        className="partner-clients section-pad visual-section"
        onClick={() => clientsHead && onSelectDocument(clientsHead)}
      >
        <div className="partner-clients-heading">
          <div>
            <p className="section-kicker">
              <EditorText
                field={ref(clientsHead, 'kicker')}
                value={value(
                  clientsHead,
                  'kicker',
                  DEFAULT_PARTNERS.clientsHead.kicker,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </p>
            <h2>
              <EditorText
                field={ref(clientsHead, 'heading')}
                value={value(
                  clientsHead,
                  'heading',
                  DEFAULT_PARTNERS.clientsHead.heading,
                )}
                selected={selected}
                onSelect={onSelect}
                onChange={onChange}
              />
            </h2>
          </div>
          <p>
            <EditorText
              field={ref(clientsHead, 'body')}
              value={value(
                clientsHead,
                'body',
                DEFAULT_PARTNERS.clientsHead.body,
              )}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
            />
          </p>
        </div>
        <div className="partner-clients-grid">
          {(clients.length ? clients : clientFallbacks).map((item, index) => {
            const document = 'id' in item ? (item as CmsDocument) : undefined;
            const fallback = document ? undefined : (item as ClientContent);
            return (
              <article
                key={document?.id ?? fallback?.name}
                className={`partner-client-card visual-repeater ${draggedId === document?.id ? 'dragging' : ''}`}
                draggable={Boolean(document)}
                onDragStart={() => document && setDraggedId(document.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => document && onDropRepeater('client', document.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  if (document) onSelectDocument(document);
                }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {text(document?.data.logo, fallback?.logo ?? '') ? (
                  <img
                    src={text(document?.data.logo, fallback?.logo ?? '')}
                    alt="Client logo"
                  />
                ) : (
                  <ImageIcon size={30} />
                )}
                <small>
                  <EditorText
                    field={ref(document, '__title')}
                    value={value(document, '__title', fallback?.name ?? '')}
                    selected={selected}
                    onSelect={onSelect}
                    onChange={onChange}
                  />
                </small>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

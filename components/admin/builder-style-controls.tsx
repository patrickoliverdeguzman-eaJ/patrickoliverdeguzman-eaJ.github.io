'use client';

import { RotateCcw } from 'lucide-react';
import { type BuilderAdvancedStyleKey, type BuilderAdvancedStyles, type BuilderNode } from '@/lib/page-builder';

type Device = 'desktop' | 'tablet' | 'mobile';
type MediaAsset = { id: string; filename: string; url: string; mimeType: string };
type Props = {
  node: BuilderNode;
  device: Device;
  media: MediaAsset[];
  onChange: (node: BuilderNode) => void;
};

type Control = {
  key: BuilderAdvancedStyleKey;
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
};

const DISPLAY_OPTIONS = [
  { value: '', label: 'Use component default' }, { value: 'block', label: 'Block' },
  { value: 'flex', label: 'Flex' }, { value: 'grid', label: 'Grid' },
  { value: 'inline-flex', label: 'Inline flex' }, { value: 'none', label: 'Hidden' },
];

const LAYOUT: Control[] = [
  { key: 'display', label: 'Layout type', options: DISPLAY_OPTIONS },
  { key: 'flexDirection', label: 'Direction', options: [{ value: '', label: 'Default' }, { value: 'row', label: 'Across' }, { value: 'column', label: 'Down' }, { value: 'row-reverse', label: 'Across, reversed' }, { value: 'column-reverse', label: 'Down, reversed' }] },
  { key: 'justifyContent', label: 'Horizontal distribution', options: [{ value: '', label: 'Default' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Space between' }, { value: 'space-around', label: 'Space around' }] },
  { key: 'alignItems', label: 'Vertical alignment', options: [{ value: '', label: 'Default' }, { value: 'stretch', label: 'Stretch' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Centre' }, { value: 'flex-end', label: 'End' }] },
  { key: 'flexWrap', label: 'Wrapping', options: [{ value: '', label: 'Default' }, { value: 'nowrap', label: 'No wrap' }, { value: 'wrap', label: 'Wrap' }] },
  { key: 'gridTemplateColumns', label: 'Grid columns', placeholder: 'repeat(3, minmax(0, 1fr))' },
  { key: 'gridTemplateRows', label: 'Grid rows', placeholder: 'auto or 170px 170px' },
  { key: 'position', label: 'Position', options: [{ value: '', label: 'Default' }, { value: 'relative', label: 'Relative' }, { value: 'absolute', label: 'Absolute' }, { value: 'sticky', label: 'Sticky' }, { value: 'fixed', label: 'Fixed' }] },
];

const SPACING: Control[] = [
  { key: 'marginTop', label: 'Space above', placeholder: '0, 24px, or 2rem' },
  { key: 'marginRight', label: 'Space right', placeholder: '0, auto, or 2rem' },
  { key: 'marginBottom', label: 'Space below', placeholder: '0, 24px, or 2rem' },
  { key: 'marginLeft', label: 'Space left', placeholder: '0, auto, or 2rem' },
  { key: 'paddingTop', label: 'Inside space above', placeholder: '24px or 2rem' },
  { key: 'paddingRight', label: 'Inside space right', placeholder: '24px or 2rem' },
  { key: 'paddingBottom', label: 'Inside space below', placeholder: '24px or 2rem' },
  { key: 'paddingLeft', label: 'Inside space left', placeholder: '24px or 2rem' },
  { key: 'gap', label: 'Gap between children', placeholder: '16px or 1rem' },
];

const SIZE: Control[] = [
  { key: 'customWidth', label: 'Width', placeholder: '100%, 720px, or auto' },
  { key: 'minWidth', label: 'Minimum width', placeholder: '0 or 240px' },
  { key: 'maxWidth', label: 'Maximum width', placeholder: '1200px or none' },
  { key: 'height', label: 'Height', placeholder: 'auto, 420px, or 70vh' },
  { key: 'minHeight', label: 'Minimum height', placeholder: '0 or 420px' },
  { key: 'maxHeight', label: 'Maximum height', placeholder: 'none or 80vh' },
];

const APPEARANCE: Control[] = [
  { key: 'backgroundColor', label: 'Background colour', placeholder: '#ffffff or transparent' },
  { key: 'backgroundGradient', label: 'Background gradient', placeholder: 'linear-gradient(135deg, #280817, #820040)' },
  { key: 'color', label: 'Text colour', placeholder: '#2a0d1c' },
  { key: 'borderStyle', label: 'Border style', options: [{ value: '', label: 'Default' }, { value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }] },
  { key: 'borderWidth', label: 'Border width', placeholder: '1px' },
  { key: 'borderColor', label: 'Border colour', placeholder: '#d9a7bc' },
  { key: 'borderRadius', label: 'Corner radius', placeholder: '12px or 999px' },
  { key: 'boxShadow', label: 'Shadow', placeholder: '0 20px 50px rgba(0,0,0,.15)' },
  { key: 'opacity', label: 'Opacity', placeholder: '0 to 1' },
];

const TYPOGRAPHY: Control[] = [
  { key: 'fontFamily', label: 'Font family', placeholder: 'Arial, sans-serif' },
  { key: 'fontSize', label: 'Font size', placeholder: '18px or clamp(2rem, 5vw, 5rem)' },
  { key: 'fontWeight', label: 'Font weight', placeholder: '400, 600, or 700' },
  { key: 'lineHeight', label: 'Line height', placeholder: '1.5' },
  { key: 'letterSpacing', label: 'Letter spacing', placeholder: '0 or -0.02em' },
  { key: 'textAlign', label: 'Text alignment', options: [{ value: '', label: 'Default' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }] },
  { key: 'textTransform', label: 'Letter case', options: [{ value: '', label: 'Default' }, { value: 'none', label: 'Keep original' }, { value: 'uppercase', label: 'Uppercase' }, { value: 'lowercase', label: 'Lowercase' }, { value: 'capitalize', label: 'Capitalise' }] },
];

function controls(values: BuilderAdvancedStyles, fields: Control[], change: (key: BuilderAdvancedStyleKey, value: string) => void) {
  return <div className="visual-advanced-grid">{fields.map((field) => <label className="visual-field" key={field.key}><span>{field.label}</span>{field.options ? <select value={values[field.key] ?? ''} onChange={(event) => change(field.key, event.target.value)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input value={values[field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => change(field.key, event.target.value)} />}</label>)}</div>;
}

export function BuilderStyleControls({ node, device, media, onChange }: Props) {
  const values = device === 'desktop' ? node.styles.advanced : node.responsive[device];
  const change = (key: BuilderAdvancedStyleKey, value: string) => {
    const next = { ...values };
    if (value.trim()) next[key] = value;
    else delete next[key];
    onChange(device === 'desktop'
      ? { ...node, styles: { ...node.styles, advanced: next } }
      : { ...node, responsive: { ...node.responsive, [device]: next } });
  };
  const reset = () => onChange(device === 'desktop'
    ? { ...node, styles: { ...node.styles, advanced: {} } }
    : { ...node, responsive: { ...node.responsive, [device]: {} } });

  return <section className="visual-advanced-styles">
    <div className="visual-advanced-heading"><div><h3>{device[0].toUpperCase() + device.slice(1)} design controls</h3><p>Only values set for this device override the component or global theme.</p></div><button type="button" onClick={reset} disabled={!Object.keys(values).length}><RotateCcw size={14} /> Reset device</button></div>
    <details open><summary>Layout and size</summary>{controls(values, [...LAYOUT, ...SIZE], change)}</details>
    <details><summary>Spacing</summary>{controls(values, SPACING, change)}</details>
    <details><summary>Colour, background and border</summary>{controls(values, APPEARANCE, change)}<label className="visual-field"><span>Background image</span><input value={values.backgroundImage ?? ''} placeholder="Image URL" onChange={(event) => change('backgroundImage', event.target.value)} />{media.some((asset) => asset.mimeType.startsWith('image/')) && <select value="" onChange={(event) => event.target.value && change('backgroundImage', event.target.value)}><option value="">Choose from media…</option>{media.filter((asset) => asset.mimeType.startsWith('image/')).map((asset) => <option value={asset.url} key={asset.id}>{asset.filename}</option>)}</select>}</label></details>
    <details><summary>Typography</summary>{controls(values, TYPOGRAPHY, change)}</details>
    <details><summary>Advanced</summary><div className="visual-advanced-grid"><label className="visual-field"><span>Custom CSS classes</span><input value={node.styles.customClass} placeholder="feature-card highlighted" onChange={(event) => onChange({ ...node, styles: { ...node.styles, customClass: event.target.value } })} /></label><label className="visual-field"><span>Element ID</span><input value={node.styles.elementId} placeholder="contact-form" onChange={(event) => onChange({ ...node, styles: { ...node.styles, elementId: event.target.value } })} /></label></div><p className="visual-help-text">For selectors, pseudo-elements, or uncommon properties, use Element CSS. Normal editing does not require code.</p></details>
  </section>;
}

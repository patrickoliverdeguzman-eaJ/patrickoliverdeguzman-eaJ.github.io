type JsonValue = string | number | boolean | null | JsonValue[] | JsonRecord;
interface JsonRecord {
  [key: string]: JsonValue;
}
type Role = 'admin' | 'editor' | 'viewer';
type DocumentStatus = 'draft' | 'published' | 'archived';
type CmsEnv = Env & { CMS_ADMIN_SETUP_TOKEN?: string };

type CmsUser = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
};

type DocumentRow = {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: DocumentStatus;
  sort_order: number;
  data_json: string;
  published_data_json: string | null;
  current_revision: number;
  published_revision: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  scheduled_at: string | null;
};

type RevisionRow = {
  id: string;
  document_id: string;
  revision_number: number;
  title: string;
  slug: string;
  data_json: string;
  note: string | null;
  created_at: string;
  created_by: string;
};

type MediaRow = {
  id: string;
  object_key: string;
  filename: string;
  alt_text: string;
  title_text: string;
  caption: string;
  mime_type: string;
  byte_size: number;
  created_at: string;
};

type ChatSender = 'visitor' | 'admin';

type ChatConversationRow = {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  status: 'open' | 'closed';
  last_message_preview: string;
  last_sender_type: ChatSender;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  admin_read_at: string | null;
};

type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_type: ChatSender;
  sender_name: string;
  body: string;
  created_at: string;
};

const MAX_JSON_BYTES = 512 * 1024;
const MAX_PAGE_CSS_CHARS = 80_000;
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_CHAT_MESSAGE_CHARS = 2_000;
const MAX_CHAT_CONVERSATIONS = 100;
const SESSION_DAYS = 1;
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_SECONDS = 5 * 60;
const CHAT_CREATE_RATE_LIMIT = 12;
const CHAT_MESSAGE_RATE_LIMIT = 60;
const CHAT_RATE_WINDOW_SECONDS = 10 * 60;
// Cloudflare Workers currently supports at most 100,000 PBKDF2 iterations.
const PASSWORD_ITERATIONS = 100_000;
const ALLOWED_MEDIA_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
};
const BUILDER_NODE_TYPES = new Set([
  'section', 'container', 'row', 'columns', 'column', 'grid', 'card', 'heading', 'text', 'rich_text',
  'image', 'video', 'icon', 'button', 'link', 'list', 'divider', 'spacer',
  'badge', 'accordion', 'tabs', 'modal', 'alert', 'tooltip', 'cta',
  'feature_grid', 'testimonials', 'statistics', 'pricing', 'faq',
  'site_header', 'menu', 'breadcrumb', 'site_footer', 'form', 'input',
  'textarea_field', 'select_field', 'checkbox', 'radio_group', 'submit',
  'brand_hero', 'split_intro',
  'principle_grid', 'solution_grid', 'solution_card', 'continuity_panel', 'service_list', 'service_row',
  'tag_band', 'contact_panel', 'partner_directory', 'logo_grid', 'method_list',
  'home_intro', 'partner_contact',
]);
const BUILDER_PROP_KEYS: Record<string, ReadonlySet<string>> = {
  section: new Set(['label']),
  container: new Set(['label']),
  row: new Set(['label']),
  columns: new Set(['columns']),
  column: new Set(['label']),
  grid: new Set(['columns', 'label']),
  card: new Set(['label']),
  heading: new Set(['text', 'level']),
  text: new Set(['text']),
  rich_text: new Set(['text']),
  image: new Set(['src', 'alt', 'title', 'caption']),
  video: new Set(['src', 'title', 'poster', 'controls']),
  icon: new Set(['name', 'label', 'size']),
  button: new Set(['label', 'href', 'variant']),
  link: new Set(['label', 'href', 'external']),
  list: new Set(['items', 'ordered']),
  divider: new Set(['label']),
  spacer: new Set(['size']),
  badge: new Set(['text']),
  accordion: new Set(['items']),
  tabs: new Set(['items']),
  modal: new Set(['triggerLabel', 'title', 'body']),
  alert: new Set(['title', 'body', 'variant']),
  tooltip: new Set(['label', 'tip']),
  cta: new Set(['eyebrow', 'heading', 'body', 'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref']),
  feature_grid: new Set(['kicker', 'heading', 'body', 'items']),
  testimonials: new Set(['kicker', 'heading', 'items']),
  statistics: new Set(['kicker', 'heading', 'items']),
  pricing: new Set(['kicker', 'heading', 'items']),
  faq: new Set(['kicker', 'heading', 'items']),
  site_header: new Set(['useGlobal', 'logo', 'mobileLogo', 'logoAlt', 'logoWidth', 'mobileLogoWidth', 'logoAlignment', 'logoSpacing', 'links', 'ctaLabel', 'ctaHref']),
  menu: new Set(['label', 'items']),
  breadcrumb: new Set(['items']),
  site_footer: new Set(['useGlobal', 'logo', 'logoAlt', 'address', 'copyright', 'links']),
  form: new Set(['title', 'action', 'method', 'successMessage']),
  input: new Set(['label', 'name', 'placeholder', 'inputType', 'required']),
  textarea_field: new Set(['label', 'name', 'placeholder', 'required', 'rows']),
  select_field: new Set(['label', 'name', 'options', 'required']),
  checkbox: new Set(['label', 'name', 'required']),
  radio_group: new Set(['label', 'name', 'options', 'required']),
  submit: new Set(['label']),
  brand_hero: new Set(['variant', 'eyebrow', 'title', 'accent', 'body', 'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref', 'logo', 'capabilities']),
  home_intro: new Set(['kicker', 'heading', 'accent', 'body', 'linkLabel', 'linkHref', 'items']),
  split_intro: new Set(['kicker', 'heading', 'accent', 'body', 'linkLabel', 'linkHref']),
  principle_grid: new Set(['items']),
  solution_grid: new Set(['kicker', 'heading', 'body', 'items']),
  solution_card: new Set(['title', 'body', 'features', 'href']),
  continuity_panel: new Set(['eyebrow', 'heading', 'body', 'ctaLabel', 'ctaHref']),
  service_list: new Set(['kicker', 'heading', 'body', 'items', 'href']),
  service_row: new Set(['text', 'href']),
  tag_band: new Set(['kicker', 'heading', 'tags']),
  contact_panel: new Set(['eyebrow', 'heading', 'body', 'primaryLabel', 'primaryHref', 'secondaryLabel', 'secondaryHref']),
  partner_directory: new Set(['kicker', 'heading', 'body', 'note', 'items']),
  logo_grid: new Set(['kicker', 'heading', 'body', 'items']),
  method_list: new Set(['kicker', 'heading', 'items']),
  partner_contact: new Set(['eyebrow', 'heading', 'body', 'ctaLabel', 'ctaHref']),
};
const BUILDER_CONTAINER_TYPES = new Set([
  'section', 'container', 'row', 'columns', 'column', 'grid', 'card', 'form',
  'site_header', 'site_footer', 'solution_grid', 'service_list',
]);
const BUILDER_ADVANCED_STYLE_KEYS = new Set([
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap',
  'gridTemplateColumns', 'gridTemplateRows', 'position',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap',
  'customWidth', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight',
  'backgroundColor', 'backgroundImage', 'backgroundGradient', 'color',
  'borderStyle', 'borderWidth', 'borderColor', 'borderRadius', 'boxShadow', 'opacity',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform',
]);
const BUILDER_SLOTS = new Set([
  'afterHero', 'afterApproach', 'afterSolutions', 'afterServices', 'beforeContact', 'afterContent',
]);
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const encoder = new TextEncoder();

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'request_error',
    readonly issues?: readonly string[],
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${label} must be text.`, 'invalid_input');
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new HttpError(400, `${label} must be between 1 and ${maxLength} characters.`, 'invalid_input');
  }

  return trimmed;
}

function asOptionalString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new HttpError(400, 'This value must be text.', 'invalid_input');
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `This value cannot be longer than ${maxLength} characters.`, 'invalid_input');
  }

  return trimmed;
}

function validateEmail(value: unknown): string {
  const email = asString(value, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Enter a valid email address.', 'invalid_input');
  }
  return email;
}

function validateOptionalEmail(value: unknown): string | undefined {
  const email = asOptionalString(value, 254);
  if (!email) return undefined;
  const normalized = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpError(400, 'Enter a valid email address.', 'invalid_input');
  }
  return normalized;
}

function validateChatMessage(value: unknown): string {
  return asString(value, 'Message', MAX_CHAT_MESSAGE_CHARS);
}

function validateConversationId(value: unknown): string {
  const id = asString(value, 'Conversation', 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(400, 'Conversation is invalid.', 'invalid_input');
  }
  return id;
}

function validatePassword(value: unknown): string {
  const password = asString(value, 'Password', 256);
  if (password.length < 12) {
    throw new HttpError(400, 'Use a password with at least 12 characters.', 'invalid_input');
  }
  return password;
}

function validateRole(value: unknown): Role {
  if (value === 'admin' || value === 'editor' || value === 'viewer') return value;
  throw new HttpError(400, 'Role must be admin, editor, or viewer.', 'invalid_input');
}

function validateType(value: unknown): string {
  const type = asString(value, 'Content type', 40).toLowerCase();
  if (!/^[a-z][a-z0-9_]*$/.test(type)) {
    throw new HttpError(400, 'Content type can use lowercase letters, numbers, and underscores.', 'invalid_input');
  }
  return type;
}

function validateSlug(value: unknown): string {
  const slug = asString(value, 'Slug', 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(400, 'Slug can use lowercase letters, numbers, and single hyphens.', 'invalid_input');
  }
  return slug;
}

function validateAdvancedStyles(value: unknown): void {
  if (value === undefined) return;
  if (!isRecord(value) || Object.keys(value).length > BUILDER_ADVANCED_STYLE_KEYS.size) {
    throw new HttpError(400, 'Advanced builder styles are invalid.', 'invalid_input');
  }
  for (const [key, styleValue] of Object.entries(value)) {
    if (!BUILDER_ADVANCED_STYLE_KEYS.has(key) || typeof styleValue !== 'string' || styleValue.length > 240 || /[{};<>]/.test(styleValue)) {
      throw new HttpError(400, 'An advanced builder style is invalid.', 'invalid_input');
    }
  }
}

function validateBuilderNode(value: unknown, depth: number, ids: Set<string>): void {
  if (!isRecord(value) || depth > 8) throw new HttpError(400, 'A builder block has an invalid structure.', 'invalid_input');
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.id)) throw new HttpError(400, 'A builder block id is invalid.', 'invalid_input');
  if (ids.has(value.id)) throw new HttpError(400, 'Builder block ids must be unique.', 'invalid_input');
  ids.add(value.id);
  if (!Number.isInteger(value.sortIndex) || (value.sortIndex as number) < 0 || (value.sortIndex as number) > 10_000) throw new HttpError(400, 'A builder block sort index is invalid.', 'invalid_input');
  if (typeof value.type !== 'string' || !BUILDER_NODE_TYPES.has(value.type)) throw new HttpError(400, 'A builder block type is not supported.', 'invalid_input');
  const type = value.type;
  if (!isRecord(value.props) || Object.keys(value.props).length > 20) throw new HttpError(400, 'Builder block properties are invalid.', 'invalid_input');
  for (const [key, property] of Object.entries(value.props)) {
    if (!BUILDER_PROP_KEYS[type].has(key)) throw new HttpError(400, 'A builder property is not supported for this block.', 'invalid_input');
    if (!(typeof property === 'string' || typeof property === 'boolean' || (typeof property === 'number' && Number.isFinite(property))) || (typeof property === 'string' && property.length > 10_000)) throw new HttpError(400, 'A builder property value is invalid.', 'invalid_input');
  }
  if (type === 'heading' && value.props.level !== undefined && (!Number.isInteger(value.props.level) || (value.props.level as number) < 1 || (value.props.level as number) > 4)) throw new HttpError(400, 'A heading level is invalid.', 'invalid_input');
  if ((type === 'columns' || type === 'grid') && value.props.columns !== undefined && (!Number.isInteger(value.props.columns) || (value.props.columns as number) < 1 || (value.props.columns as number) > 6)) throw new HttpError(400, 'A column count is invalid.', 'invalid_input');
  if (type === 'button' && value.props.variant !== undefined && !['primary', 'secondary'].includes(value.props.variant as string)) throw new HttpError(400, 'A button variant is invalid.', 'invalid_input');
  if (type === 'spacer' && value.props.size !== undefined && !['compact', 'regular', 'spacious'].includes(value.props.size as string)) throw new HttpError(400, 'A spacer size is invalid.', 'invalid_input');
  if (type === 'alert' && value.props.variant !== undefined && !['info', 'warning', 'success'].includes(value.props.variant as string)) throw new HttpError(400, 'An alert variant is invalid.', 'invalid_input');
  if (type === 'form' && value.props.method !== undefined && !['get', 'post'].includes(value.props.method as string)) throw new HttpError(400, 'A form method is invalid.', 'invalid_input');
  if (!isRecord(value.styles) || !isRecord(value.responsive)) throw new HttpError(400, 'Builder styles are invalid.', 'invalid_input');
  if (!['default', 'muted', 'brand', 'gradient'].includes(value.styles.tone as string) || !['inherit', 'compact', 'regular', 'spacious'].includes(value.styles.padding as string) || !['inherit', 'left', 'center', 'right'].includes(value.styles.align as string) || !['inherit', 'content', 'wide', 'full'].includes(value.styles.width as string) || !['none', 'sm', 'md', 'lg'].includes(value.styles.radius as string) || !['none', 'soft', 'strong'].includes(value.styles.border as string) || !['none', 'soft', 'lifted'].includes(value.styles.shadow as string) || !['inherit', 'compact', 'regular', 'spacious'].includes(value.styles.gap as string) || !['none', 'reveal', 'float'].includes(value.styles.motion as string) || !['none', 'lift'].includes(value.styles.hover as string) || !['all', 'desktop', 'mobile'].includes(value.responsive.visibility as string) || !['inherit', 1, 2, 3, 4].includes(value.responsive.tabletColumns as string | number) || !['inherit', 1, 2, 3, 4].includes(value.responsive.mobileColumns as string | number) || !['inherit', 'left', 'center', 'right'].includes(value.responsive.tabletAlign as string) || !['inherit', 'left', 'center', 'right'].includes(value.responsive.mobileAlign as string) || !['inherit', 'compact', 'regular', 'spacious'].includes(value.responsive.tabletPadding as string) || !['inherit', 'compact', 'regular', 'spacious'].includes(value.responsive.mobilePadding as string)) throw new HttpError(400, 'A builder layout setting is not supported.', 'invalid_input');
  validateAdvancedStyles(value.styles.advanced);
  validateAdvancedStyles(value.responsive.tablet);
  validateAdvancedStyles(value.responsive.mobile);
  if (value.styles.customClass !== undefined && (typeof value.styles.customClass !== 'string' || value.styles.customClass.length > 520 || value.styles.customClass.split(/\s+/).filter(Boolean).some((item) => !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(item)))) throw new HttpError(400, 'A custom class is invalid.', 'invalid_input');
  if (value.styles.elementId !== undefined && (typeof value.styles.elementId !== 'string' || (value.styles.elementId !== '' && !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value.styles.elementId)))) throw new HttpError(400, 'An element id is invalid.', 'invalid_input');
  if (!Array.isArray(value.children) || value.children.length > 30) throw new HttpError(400, 'Builder block children are invalid.', 'invalid_input');
  if (!BUILDER_CONTAINER_TYPES.has(type) && value.children.length > 0) throw new HttpError(400, 'This builder block cannot contain child blocks.', 'invalid_input');
  for (const child of value.children) validateBuilderNode(child, depth + 1, ids);
}

function validateBuilderPage(value: JsonRecord): void {
  if (value.version !== 1 || !isRecord(value.slots)) throw new HttpError(400, 'The builder page schema is invalid.', 'invalid_input');
  if (value.settings !== undefined) {
    if (!isRecord(value.settings)) throw new HttpError(400, 'Page settings are invalid.', 'invalid_input');
    const allowed = new Set(['seoTitle', 'seoDescription', 'socialImage', 'hideDefaultHeader', 'hideDefaultFooter']);
    for (const [key, setting] of Object.entries(value.settings)) {
      if (!allowed.has(key)) throw new HttpError(400, 'A page setting is not supported.', 'invalid_input');
      if (key === 'hideDefaultHeader' || key === 'hideDefaultFooter') {
        if (typeof setting !== 'boolean') throw new HttpError(400, 'Page visibility settings must be true or false.', 'invalid_input');
      } else if (typeof setting !== 'string' || setting.length > (key === 'seoTitle' ? 160 : key === 'seoDescription' ? 320 : 2_000)) {
        throw new HttpError(400, 'A page setting is invalid.', 'invalid_input');
      }
    }
  }
  if (value.customCss !== undefined) {
    if (typeof value.customCss !== 'string' || value.customCss.length > MAX_PAGE_CSS_CHARS) {
      throw new HttpError(400, 'Page CSS must be plain text shorter than 80,000 characters.', 'invalid_input');
    }
    if (/<\s*\/?\s*style\b/i.test(value.customCss)) {
      throw new HttpError(400, 'Paste CSS rules only, without style tags.', 'invalid_input');
    }
  }
  const ids = new Set<string>();
  for (const [slot, nodes] of Object.entries(value.slots)) {
    if (!BUILDER_SLOTS.has(slot) || !Array.isArray(nodes) || nodes.length > 30) throw new HttpError(400, 'A builder page slot is invalid.', 'invalid_input');
    for (const node of nodes) validateBuilderNode(node, 0, ids);
  }
}

function parseData(value: unknown, type?: string): { value: JsonRecord; serialized: string } {
  if (!isRecord(value)) {
    throw new HttpError(400, 'Content data must be a JSON object.', 'invalid_input');
  }

  if (type === 'builder_page') validateBuilderPage(value as JsonRecord);

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new HttpError(400, 'Content data must be valid JSON.', 'invalid_input');
  }

  if (serialized.length > MAX_JSON_BYTES) {
    throw new HttpError(413, 'Content data is too large.', 'payload_too_large');
  }

  return { value: value as JsonRecord, serialized };
}

function parseStoredData(value: string): JsonRecord {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) throw new Error('not an object');
    return parsed as JsonRecord;
  } catch {
    throw new HttpError(500, 'Stored content is invalid.', 'storage_error');
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function derivePasswordHash(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(encoder.encode(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

async function createPasswordRecord(password: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return { salt: toBase64(saltBytes), hash: await derivePasswordHash(password, saltBytes) };
}

async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const actualHash = await derivePasswordHash(password, fromBase64(salt));
  return timingSafeEqual(actualHash, expectedHash);
}

function now(): string {
  return new Date().toISOString();
}

function futureDate(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function json(data: JsonValue, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', JSON_HEADERS['content-type']);
  return new Response(JSON.stringify(data), { ...init, headers });
}

function publicOrigins(env: CmsEnv): Set<string> {
  return new Set(env.PUBLIC_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean));
}

function withCors(response: Response, request: Request, env: CmsEnv): Response {
  const origin = request.headers.get('origin');
  if (!origin || !publicOrigins(env).has(origin)) return response;

  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  headers.set('access-control-allow-headers', 'Authorization, Content-Type, X-File-Name, X-Alt-Text, X-Title, X-Caption, X-Visitor-Token');
  headers.set('access-control-max-age', '600');
  headers.append('vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'Use application/json for this request.', 'unsupported_media_type');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new HttpError(413, 'Request body is too large.', 'payload_too_large');
  }

  const body = await request.text();
  if (body.length > MAX_JSON_BYTES) {
    throw new HttpError(413, 'Request body is too large.', 'payload_too_large');
  }

  try {
    const parsed: unknown = JSON.parse(body);
    if (!isRecord(parsed)) throw new Error('not an object');
    return parsed;
  } catch {
    throw new HttpError(400, 'Request body must be a JSON object.', 'invalid_json');
  }
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function readVisitorToken(request: Request): string | null {
  const token = request.headers.get('x-visitor-token')?.trim() ?? '';
  return /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : null;
}

async function sessionUser(request: Request, env: CmsEnv): Promise<CmsUser | null> {
  const token = readBearerToken(request);
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  return env.CMS_DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.role
     FROM cms_sessions s
     INNER JOIN cms_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
  )
    .bind(tokenHash)
    .first<CmsUser>();
}

async function requireUser(request: Request, env: CmsEnv): Promise<CmsUser> {
  const user = await sessionUser(request, env);
  if (!user) throw new HttpError(401, 'Sign in is required.', 'unauthenticated');
  return user;
}

function requireRole(user: CmsUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, 'Your role does not allow this action.', 'forbidden');
  }
}

type AuditEntry = {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  detail?: string;
};

async function logAudit(env: CmsEnv, entry: AuditEntry): Promise<void> {
  try {
    await env.CMS_DB.prepare(
      `INSERT INTO cms_audit_log (id, user_id, action, resource_type, resource_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId ?? null,
        entry.detail ?? '',
        now(),
      )
      .run();
  } catch (error) {
    console.error(JSON.stringify({
      message: 'CMS audit log write failed',
      action: entry.action,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

async function listAudit(request: Request, env: CmsEnv): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? '50'), 1), 100);
  const result = await env.CMS_DB.prepare(
    `SELECT a.id, a.user_id, a.action, a.resource_type, a.resource_id, a.detail, a.created_at,
       u.email AS user_email, u.display_name AS user_name
     FROM cms_audit_log a LEFT JOIN cms_users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT ?`,
  )
    .bind(limit)
    .all<{
      id: string;
      user_id: string | null;
      action: string;
      resource_type: string;
      resource_id: string | null;
      detail: string;
      created_at: string;
      user_email: string | null;
      user_name: string | null;
    }>();
  return json({
    audit: result.results.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      detail: row.detail,
      createdAt: row.created_at,
    })),
  });
}

function requestClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('cf-connecting-ip') ?? (forwarded || 'unknown');
}

async function consumeRateLimit(
  env: CmsEnv,
  rawKey: string,
  limit: number,
  windowSeconds: number,
  message: string,
): Promise<string> {
  const keyHash = await sha256Hex(rawKey);
  const timestamp = Math.floor(Date.now() / 1000);
  const resetBefore = timestamp - windowSeconds;
  const result = await env.CMS_DB.prepare(
    `INSERT INTO cms_rate_limits (key_hash, window_started_at, attempt_count, updated_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(key_hash) DO UPDATE SET
       window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END,
       attempt_count = CASE WHEN window_started_at <= ? THEN 1 ELSE attempt_count + 1 END,
       updated_at = excluded.updated_at
     RETURNING attempt_count`,
  )
    .bind(keyHash, timestamp, now(), resetBefore, resetBefore)
    .first<{ attempt_count: number }>();
  if (Number(result?.attempt_count ?? limit + 1) > limit) {
    throw new HttpError(429, message, 'rate_limited');
  }
  return keyHash;
}

async function clearRateLimit(env: CmsEnv, keyHash: string): Promise<void> {
  await env.CMS_DB.prepare('DELETE FROM cms_rate_limits WHERE key_hash = ?').bind(keyHash).run();
}

function formatUser(user: CmsUser): JsonRecord {
  return { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
}

function formatDocument(document: DocumentRow): JsonRecord {
  return {
    id: document.id,
    type: document.type,
    slug: document.slug,
    title: document.title,
    status: document.status,
    data: parseStoredData(document.data_json),
    publishedData: document.published_data_json ? parseStoredData(document.published_data_json) : null,
    currentRevision: document.current_revision,
    publishedRevision: document.published_revision,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    publishedAt: document.published_at,
    scheduledAt: document.scheduled_at,
  };
}

function formatRevision(revision: RevisionRow): JsonRecord {
  return {
    id: revision.id,
    documentId: revision.document_id,
    revisionNumber: revision.revision_number,
    title: revision.title,
    slug: revision.slug,
    data: parseStoredData(revision.data_json),
    note: revision.note,
    createdAt: revision.created_at,
  };
}

function formatMedia(media: MediaRow, request: Request): JsonRecord {
  const url = new URL(`/v1/media/${media.id}`, request.url).toString();
  return {
    id: media.id,
    filename: media.filename,
    altText: media.alt_text,
    title: media.title_text,
    caption: media.caption,
    mimeType: media.mime_type,
    byteSize: media.byte_size,
    createdAt: media.created_at,
    url,
  };
}

function formatChatConversation(conversation: ChatConversationRow, includeContact = false): JsonRecord {
  const result: JsonRecord = {
    id: conversation.id,
    visitorName: conversation.visitor_name,
    status: conversation.status,
    lastMessagePreview: conversation.last_message_preview,
    lastSenderType: conversation.last_sender_type,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    unread: conversation.last_sender_type === 'visitor' && (!conversation.admin_read_at || conversation.admin_read_at < conversation.last_message_at),
  };
  if (includeContact) result.visitorEmail = conversation.visitor_email;
  return result;
}

function formatChatMessage(message: ChatMessageRow): JsonRecord {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderType: message.sender_type,
    senderName: message.sender_name,
    body: message.body,
    createdAt: message.created_at,
  };
}

async function getDocument(id: string, env: CmsEnv): Promise<DocumentRow> {
  const document = await env.CMS_DB.prepare(
    `SELECT id, type, slug, title, status, data_json, published_data_json,
      current_revision, published_revision, created_at, updated_at, published_at, scheduled_at
     FROM cms_documents WHERE id = ?`,
  )
    .bind(id)
    .first<DocumentRow>();
  if (!document) throw new HttpError(404, 'Content entry was not found.', 'not_found');
  return document;
}

function isUniqueError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed');
}

async function createSession(user: CmsUser, env: CmsEnv): Promise<JsonRecord> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = futureDate(SESSION_DAYS);
  await env.CMS_DB.prepare(
    `INSERT INTO cms_sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt)
    .run();
  return { token, user: formatUser(user), expiresAt };
}

async function bootstrap(request: Request, env: CmsEnv): Promise<Response> {
  if (!env.CMS_ADMIN_SETUP_TOKEN) {
    throw new HttpError(503, 'CMS setup is not configured yet.', 'setup_unavailable');
  }

  const body = await readJson(request);
  const setupToken = asString(body.setupToken, 'Setup token', 512);
  const validToken = await timingSafeEqual(setupToken, env.CMS_ADMIN_SETUP_TOKEN);
  if (!validToken) throw new HttpError(401, 'The setup token is not valid.', 'invalid_setup_token');

  const existing = await env.CMS_DB.prepare('SELECT COUNT(*) AS total FROM cms_users').first<{ total: number }>();
  if (Number(existing?.total ?? 0) > 0) {
    throw new HttpError(409, 'An administrator already exists. Sign in instead.', 'already_initialized');
  }

  const email = validateEmail(body.email);
  const displayName = asString(body.displayName, 'Display name', 80);
  const password = validatePassword(body.password);
  const passwordRecord = await createPasswordRecord(password);
  const user: CmsUser = { id: crypto.randomUUID(), email, display_name: displayName, role: 'admin' };

  try {
    await env.CMS_DB.prepare(
      `INSERT INTO cms_users (id, email, display_name, role, password_salt, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(user.id, user.email, user.display_name, user.role, passwordRecord.salt, passwordRecord.hash)
      .run();
  } catch (error) {
    if (isUniqueError(error)) throw new HttpError(409, 'That email is already in use.', 'email_in_use');
    throw error;
  }

  return json(await createSession(user, env), { status: 201 });
}

async function login(request: Request, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const rateLimitKey = await consumeRateLimit(
    env,
    `login:${requestClientKey(request)}:${email}`,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_SECONDS,
    'Too many sign-in attempts. Try again in a few minutes.',
  );
  const account = await env.CMS_DB.prepare(
    `SELECT id, email, display_name, role, password_salt, password_hash
     FROM cms_users WHERE email = ?`,
  )
    .bind(email)
    .first<CmsUser & { password_salt: string; password_hash: string }>();

  if (!account || !(await verifyPassword(password, account.password_salt, account.password_hash))) {
    throw new HttpError(401, 'Email or password is not correct.', 'invalid_credentials');
  }

  const user: CmsUser = account;
  await clearRateLimit(env, rateLimitKey);
  const session = await createSession(user, env);
  await logAudit(env, { userId: user.id, action: 'login', resourceType: 'user', resourceId: user.id, detail: user.email });
  return json(session);
}

async function changePassword(request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const currentPassword = validatePassword(body.currentPassword);
  const newPassword = validatePassword(body.newPassword);
  if (currentPassword === newPassword) {
    throw new HttpError(400, 'Choose a new password that is different from the current password.', 'invalid_input');
  }
  const account = await env.CMS_DB.prepare(
    'SELECT password_salt, password_hash FROM cms_users WHERE id = ?',
  ).bind(user.id).first<{ password_salt: string; password_hash: string }>();
  if (!account || !(await verifyPassword(currentPassword, account.password_salt, account.password_hash))) {
    throw new HttpError(401, 'The current password is not correct.', 'invalid_credentials');
  }
  const passwordRecord = await createPasswordRecord(newPassword);
  const updatedAt = now();
  await env.CMS_DB.batch([
    env.CMS_DB.prepare(
      'UPDATE cms_users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE id = ?',
    ).bind(passwordRecord.salt, passwordRecord.hash, updatedAt, user.id),
    env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE user_id = ?').bind(user.id),
  ]);
  const session = await createSession(user, env);
  await logAudit(env, { userId: user.id, action: 'user.password.change', resourceType: 'user', resourceId: user.id });
  return json(session);
}

async function recoverPassword(request: Request, env: CmsEnv): Promise<Response> {
  if (!env.CMS_ADMIN_SETUP_TOKEN) {
    throw new HttpError(503, 'CMS recovery is not configured. Contact the site administrator.', 'recovery_unavailable');
  }
  const body = await readJson(request);
  const email = validateEmail(body.email);
  const setupToken = asString(body.setupToken, 'Recovery token', 512);
  const newPassword = validatePassword(body.newPassword);
  await consumeRateLimit(
    env,
    `password-recovery:${requestClientKey(request)}:${email}`,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_SECONDS,
    'Too many recovery attempts. Try again in a few minutes.',
  );
  if (!(await timingSafeEqual(setupToken, env.CMS_ADMIN_SETUP_TOKEN))) {
    throw new HttpError(401, 'The recovery token is not valid.', 'invalid_recovery_token');
  }
  const account = await env.CMS_DB.prepare(
    'SELECT id, email, display_name, role FROM cms_users WHERE email = ?',
  ).bind(email).first<CmsUser>();
  if (!account) throw new HttpError(404, 'No CMS account uses that email address.', 'not_found');
  const passwordRecord = await createPasswordRecord(newPassword);
  const updatedAt = now();
  await env.CMS_DB.batch([
    env.CMS_DB.prepare(
      'UPDATE cms_users SET password_salt = ?, password_hash = ?, updated_at = ? WHERE id = ?',
    ).bind(passwordRecord.salt, passwordRecord.hash, updatedAt, account.id),
    env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE user_id = ?').bind(account.id),
  ]);
  await logAudit(env, { userId: account.id, action: 'user.password.recover', resourceType: 'user', resourceId: account.id });
  return json({ reset: true });
}

async function listDocuments(request: Request, env: CmsEnv): Promise<Response> {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? '50'), 1), 100);

  if (type && !/^[a-z][a-z0-9_]{0,39}$/.test(type)) {
    throw new HttpError(400, 'Content type is invalid.', 'invalid_input');
  }
  if (status && status !== 'draft' && status !== 'published' && status !== 'archived') {
    throw new HttpError(400, 'Content status is invalid.', 'invalid_input');
  }

  const filters: string[] = [];
  const values: (string | number)[] = [];
  if (type) {
    filters.push('type = ?');
    values.push(type);
  }
  if (status) {
    filters.push('status = ?');
    values.push(status);
  }
  values.push(limit);
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await env.CMS_DB.prepare(
    `SELECT id, type, slug, title, status, data_json, published_data_json,
      current_revision, published_revision, sort_order, created_at, updated_at, published_at, scheduled_at
     FROM cms_documents ${where} ORDER BY sort_order ASC, updated_at DESC LIMIT ?`,
  )
    .bind(...values)
    .all<DocumentRow>();
  return json({ documents: result.results.map(formatDocument) });
}

async function createDocument(request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const type = validateType(body.type);
  const title = asString(body.title, 'Title', 160);
  const slug = validateSlug(body.slug);
  const data = parseData(body.data, type);
  const note = asOptionalString(body.note, 240);
  const id = crypto.randomUUID();
  const createdAt = now();
  const orderRow = await env.CMS_DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM cms_documents',
  ).first<{ next_order: number }>();
  const sortOrder = Number(orderRow?.next_order ?? 0);

  try {
    await env.CMS_DB.batch([
      env.CMS_DB.prepare(
        `INSERT INTO cms_documents (
          id, type, slug, title, status, data_json, current_revision, sort_order,
          created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'draft', ?, 1, ?, ?, ?, ?, ?)`,
      ).bind(id, type, slug, title, data.serialized, sortOrder, user.id, user.id, createdAt, createdAt),
      env.CMS_DB.prepare(
        `INSERT INTO cms_document_revisions (
          id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      ).bind(crypto.randomUUID(), id, title, slug, data.serialized, note ?? 'Created', user.id, createdAt),
    ]);
  } catch (error) {
    if (isUniqueError(error)) throw new HttpError(409, 'This content type already uses that slug.', 'slug_in_use');
    throw error;
  }

  const created = await getDocument(id, env);
  await logAudit(env, { userId: user.id, action: 'document.create', resourceType: 'document', resourceId: id, detail: `${type}/${slug}` });
  return json({ document: formatDocument(created) }, { status: 201 });
}

async function updateDocument(id: string, request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const existing = await getDocument(id, env);
  if (existing.status === 'archived') {
    throw new HttpError(409, 'Restore this archived entry before editing it.', 'archived');
  }

  const title = body.title === undefined ? existing.title : asString(body.title, 'Title', 160);
  const slug = body.slug === undefined ? existing.slug : validateSlug(body.slug);
  const data = body.data === undefined ? { serialized: existing.data_json } : parseData(body.data, existing.type);
  const note = asOptionalString(body.note, 240);
  const revision = existing.current_revision + 1;
  const updatedAt = now();

  try {
    await env.CMS_DB.batch([
      env.CMS_DB.prepare(
        `UPDATE cms_documents
         SET title = ?, slug = ?, data_json = ?, current_revision = ?, updated_by = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(title, slug, data.serialized, revision, user.id, updatedAt, id),
      env.CMS_DB.prepare(
        `INSERT INTO cms_document_revisions (
          id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(crypto.randomUUID(), id, revision, title, slug, data.serialized, note ?? 'Draft updated', user.id, updatedAt),
    ]);
  } catch (error) {
    if (isUniqueError(error)) throw new HttpError(409, 'This content type already uses that slug.', 'slug_in_use');
    throw error;
  }

  await logAudit(env, { userId: user.id, action: 'document.update', resourceType: 'document', resourceId: id, detail: `${title} (${slug})` });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function publishDocument(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  const document = await getDocument(id, env);
  if (document.status === 'archived') {
    throw new HttpError(409, 'Restore this archived entry before publishing it.', 'archived');
  }
  assertPublishable(document);

  const publishedAt = now();
  await env.CMS_DB.prepare(
    `UPDATE cms_documents
     SET status = 'published', published_data_json = data_json, published_revision = current_revision,
       published_by = ?, published_at = ?, scheduled_at = NULL, updated_at = ?
     WHERE id = ?`,
  )
    .bind(user.id, publishedAt, publishedAt, id)
      .run();
  await logAudit(env, { userId: user.id, action: 'document.publish', resourceType: 'document', resourceId: id, detail: document.title });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function unpublishDocument(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  await getDocument(id, env);
  const updatedAt = now();
  await env.CMS_DB.prepare(
    `UPDATE cms_documents
     SET status = 'draft', published_data_json = NULL, published_revision = NULL,
       published_by = NULL, published_at = NULL, scheduled_at = NULL, updated_by = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(user.id, updatedAt, id)
      .run();
  await logAudit(env, { userId: user.id, action: 'document.unpublish', resourceType: 'document', resourceId: id });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function archiveDocument(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  await getDocument(id, env);
  const updatedAt = now();
  await env.CMS_DB.prepare(
    `UPDATE cms_documents
     SET status = 'archived', published_data_json = NULL, published_revision = NULL,
       published_by = NULL, published_at = NULL, scheduled_at = NULL, updated_by = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(user.id, updatedAt, id)
      .run();
  await logAudit(env, { userId: user.id, action: 'document.archive', resourceType: 'document', resourceId: id });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function restoreArchivedDocument(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  const document = await getDocument(id, env);
  if (document.status !== 'archived') {
    throw new HttpError(409, 'Only archived entries can be restored.', 'not_archived');
  }
  const updatedAt = now();
  await env.CMS_DB.prepare(
    `UPDATE cms_documents
     SET status = 'draft', updated_by = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(user.id, updatedAt, id)
    .run();
  await logAudit(env, { userId: user.id, action: 'document.restore', resourceType: 'document', resourceId: id, detail: document.title });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function scheduleDocument(id: string, request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const document = await getDocument(id, env);
  if (document.status === 'archived') {
    throw new HttpError(409, 'Restore this archived entry before scheduling it.', 'archived');
  }
  const body = await readJson(request);
  if (body.publishAt === null) {
    const updatedAt = now();
    await env.CMS_DB.prepare(
      'UPDATE cms_documents SET scheduled_at = NULL, updated_by = ?, updated_at = ? WHERE id = ?',
    ).bind(user.id, updatedAt, id).run();
    await logAudit(env, { userId: user.id, action: 'document.schedule.cancel', resourceType: 'document', resourceId: id, detail: document.title });
    return json({ document: formatDocument(await getDocument(id, env)) });
  }

  assertPublishable(document);

  const requested = asString(body.publishAt, 'Publication time', 64);
  const publishAt = new Date(requested);
  if (Number.isNaN(publishAt.getTime()) || publishAt.getTime() <= Date.now() + 60_000) {
    throw new HttpError(400, 'Choose a valid publication time at least one minute in the future.', 'invalid_input');
  }
  const scheduledAt = publishAt.toISOString();
  const updatedAt = now();
  await env.CMS_DB.prepare(
    'UPDATE cms_documents SET scheduled_at = ?, updated_by = ?, updated_at = ? WHERE id = ?',
  ).bind(scheduledAt, user.id, updatedAt, id).run();
  await logAudit(env, { userId: user.id, action: 'document.schedule', resourceType: 'document', resourceId: id, detail: `${document.title} at ${scheduledAt}` });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function publishScheduledDocuments(env: CmsEnv): Promise<void> {
  const publishedAt = now();
  await env.CMS_DB.batch([
    env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE expires_at <= ?').bind(publishedAt),
    env.CMS_DB.prepare("DELETE FROM cms_rate_limits WHERE updated_at <= datetime('now', '-2 days')"),
  ]);
  const due = await env.CMS_DB.prepare(
    `SELECT id, type, slug, title, status, data_json, published_data_json,
       current_revision, published_revision, sort_order, created_at, updated_at, published_at, scheduled_at
     FROM cms_documents
     WHERE scheduled_at IS NOT NULL AND scheduled_at <= ? AND status != 'archived'`,
  ).bind(publishedAt).all<DocumentRow>();
  if (!due.results.length) return;
  for (const document of due.results) {
    const issues = publishIssues(document);
    if (issues.length) {
      await env.CMS_DB.prepare(
        'UPDATE cms_documents SET scheduled_at = NULL, updated_at = ? WHERE id = ?',
      ).bind(publishedAt, document.id).run();
      await logAudit(env, {
        userId: null,
        action: 'document.publish.scheduled.blocked',
        resourceType: 'document',
        resourceId: document.id,
        detail: issues.slice(0, 3).join(' | '),
      });
      continue;
    }
    await env.CMS_DB.prepare(
      `UPDATE cms_documents
       SET status = 'published', published_data_json = data_json, published_revision = current_revision,
         published_by = updated_by, published_at = ?, scheduled_at = NULL, updated_at = ?
       WHERE id = ?`,
    ).bind(publishedAt, publishedAt, document.id).run();
    await logAudit(env, { userId: null, action: 'document.publish.scheduled', resourceType: 'document', resourceId: document.id, detail: publishedAt });
  }
}

function publishText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholderText(value: unknown): boolean {
  const normalized = publishText(value).replace(/[.!]+$/, '').trim();
  return /^(?:test|todo|tbd|untitled|lorem ipsum|new(?:\s+[a-z0-9_-]+)?)$/i.test(normalized);
}

function publishRows(value: unknown): string[] {
  return publishText(value)
    .replaceAll('\\n', '\n')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);
}

function isSafePublishUrl(value: unknown, allowEmpty = false): boolean {
  const url = publishText(value);
  if (!url) return allowEmpty;
  return /^(?:https:\/\/|\/|#|mailto:|tel:)[^\s<>]*$/i.test(url);
}

function validatePublishableBuilderNode(node: unknown, path: string, issues: string[]): void {
  if (!isRecord(node) || !isRecord(node.props)) return;
  const type = publishText(node.type);
  const props = node.props;
  const needText = (key: string, label: string) => {
    const value = props[key];
    if (!publishText(value)) issues.push(`${path}: ${label} is required.`);
    else if (isPlaceholderText(value)) issues.push(`${path}: replace the placeholder ${label.toLowerCase()} “${publishText(value)}”.`);
  };
  const needUrl = (key: string, label: string, allowEmpty = false) => {
    if (!isSafePublishUrl(props[key], allowEmpty)) issues.push(`${path}: ${label} must be a valid HTTPS, site, anchor, email, or phone link.`);
  };
  const validateRecords = (label: string, columns: number, requiredColumns: number, featureColumn = -1) => {
    const rows = publishRows(props.items);
    if (!rows.length) {
      issues.push(`${path}: add at least one ${label.toLowerCase()}.`);
      return;
    }
    rows.forEach((row, index) => {
      const values = row.split('|').map((value) => value.trim());
      const itemPath = `${path}, ${label} ${index + 1}`;
      if (values.length < columns) issues.push(`${itemPath}: complete all required fields.`);
      for (let column = 0; column < requiredColumns; column += 1) {
        if (!values[column]) issues.push(`${itemPath}: field ${column + 1} is required.`);
        else if (isPlaceholderText(values[column])) issues.push(`${itemPath}: replace “${values[column]}” before publishing.`);
      }
      if (featureColumn >= 0 && !values[featureColumn]?.split(';').some((value) => value.trim())) {
        issues.push(`${itemPath}: add at least one feature.`);
      }
    });
  };

  if (type === 'brand_hero') {
    needText('eyebrow', 'Eyebrow');
    needText('title', 'Title');
    needText('body', 'Description');
    needText('primaryLabel', 'Primary button label');
    needUrl('primaryHref', 'Primary button link');
  } else if (type === 'solution_grid') {
    needText('heading', 'Heading');
    needText('body', 'Description');
    validateRecords('Solution', 3, 2, 2);
  } else if (type === 'service_list') {
    needText('heading', 'Heading');
    needText('body', 'Description');
    const rows = publishRows(props.items);
    if (!rows.length) issues.push(`${path}: add at least one service.`);
    rows.forEach((row, index) => {
      if (isPlaceholderText(row)) issues.push(`${path}, Service ${index + 1}: replace “${row}” before publishing.`);
    });
    needUrl('href', 'Service link');
  } else if (type === 'partner_directory') {
    needText('heading', 'Heading');
    needText('body', 'Description');
    validateRecords('Partner', 2, 2);
  } else if (type === 'logo_grid') {
    needText('heading', 'Heading');
    needText('body', 'Description');
    const rows = publishRows(props.items);
    if (!rows.length) issues.push(`${path}: add at least one client.`);
    rows.forEach((row, index) => {
      const [name = '', logo = ''] = row.split('|').map((value) => value.trim());
      const itemPath = `${path}, Client ${index + 1}`;
      if (!name || isPlaceholderText(name)) issues.push(`${itemPath}: enter a real client name.`);
      if (!isSafePublishUrl(logo)) issues.push(`${itemPath}: choose or enter a valid logo URL.`);
    });
  } else if (type === 'method_list' || type === 'feature_grid' || type === 'testimonials' || type === 'statistics' || type === 'pricing' || type === 'faq') {
    needText('heading', 'Heading');
    validateRecords('Item', 2, 2);
  } else if (type === 'heading') {
    needText('text', 'Heading');
  } else if (type === 'text' || type === 'rich_text') {
    needText('text', 'Text');
  } else if (type === 'image') {
    needUrl('src', 'Image URL');
    needText('alt', 'Alternative text');
  } else if (type === 'button' || type === 'link') {
    needText('label', 'Label');
    needUrl('href', 'Link');
  } else if (type === 'contact_panel' || type === 'partner_contact' || type === 'continuity_panel' || type === 'cta') {
    needText('heading', 'Heading');
    needText('body', 'Description');
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child, index) => validatePublishableBuilderNode(child, `${path} > block ${index + 1}`, issues));
  }
}

function publishIssues(document: DocumentRow): string[] {
  const issues: string[] = [];
  if (isPlaceholderText(document.title)) issues.push(`Document title “${document.title}” is still a placeholder.`);
  const data = parseStoredData(document.data_json);

  if (document.type === 'builder_page') {
    const settings = isRecord(data.settings) ? data.settings : {};
    if (!publishText(settings.seoTitle)) issues.push('Page settings: add a search title.');
    if (publishText(settings.seoDescription) && isPlaceholderText(settings.seoDescription)) {
      issues.push('Page settings: replace the placeholder search description.');
    }
    if (isRecord(data.slots)) {
      for (const [slot, nodes] of Object.entries(data.slots)) {
        if (!Array.isArray(nodes)) continue;
        nodes.forEach((node, index) => validatePublishableBuilderNode(node, `${slot}, block ${index + 1}`, issues));
      }
    }
  } else if (document.type === 'solution') {
    if (!publishText(data.description)) issues.push('Solution description is required.');
    if (!Array.isArray(data.items) || !data.items.some((item) => publishText(item))) issues.push('Add at least one solution feature.');
  } else if (document.type === 'partner') {
    if (!publishText(data.focus)) issues.push('Partner focus is required.');
  } else if (document.type === 'client') {
    if (!isSafePublishUrl(data.logo)) issues.push('Choose or enter a valid client logo URL.');
  } else if (document.type === 'navigation') {
    if (!Array.isArray(data.items) || !data.items.length) issues.push('Add at least one navigation link.');
    for (const [index, item] of (Array.isArray(data.items) ? data.items : []).entries()) {
      if (!isRecord(item) || !publishText(item.label) || isPlaceholderText(item.label)) issues.push(`Navigation item ${index + 1}: enter a real label.`);
      if (!isRecord(item) || !isSafePublishUrl(item.href)) issues.push(`Navigation item ${index + 1}: enter a valid link.`);
    }
  }

  return [...new Set(issues)].slice(0, 40);
}

function assertPublishable(document: DocumentRow): void {
  const issues = publishIssues(document);
  if (issues.length) {
    throw new HttpError(422, `Fix ${issues.length} publishing issue${issues.length === 1 ? '' : 's'} before this content can go live.`, 'publish_validation_failed', issues);
  }
}

async function validateDocumentForPublish(id: string, env: CmsEnv): Promise<Response> {
  assertPublishable(await getDocument(id, env));
  return json({ valid: true });
}

async function listRevisions(id: string, env: CmsEnv): Promise<Response> {
  await getDocument(id, env);
  const revisions = await env.CMS_DB.prepare(
    `SELECT id, document_id, revision_number, title, slug, data_json, note, created_at, created_by
     FROM cms_document_revisions WHERE document_id = ? ORDER BY revision_number DESC`,
  )
    .bind(id)
    .all<RevisionRow>();
  return json({ revisions: revisions.results.map(formatRevision) });
}

async function restoreRevision(
  id: string,
  revisionNumber: number,
  user: CmsUser,
  env: CmsEnv,
): Promise<Response> {
  const document = await getDocument(id, env);
  if (document.status === 'archived') {
    throw new HttpError(409, 'Restore this archived entry before editing it.', 'archived');
  }

  const revision = await env.CMS_DB.prepare(
    `SELECT id, document_id, revision_number, title, slug, data_json, note, created_at, created_by
     FROM cms_document_revisions WHERE document_id = ? AND revision_number = ?`,
  )
    .bind(id, revisionNumber)
    .first<RevisionRow>();
  if (!revision) throw new HttpError(404, 'Revision was not found.', 'not_found');

  const nextRevision = document.current_revision + 1;
  const updatedAt = now();
  try {
    await env.CMS_DB.batch([
      env.CMS_DB.prepare(
        `UPDATE cms_documents
         SET title = ?, slug = ?, data_json = ?, current_revision = ?, updated_by = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(revision.title, revision.slug, revision.data_json, nextRevision, user.id, updatedAt, id),
      env.CMS_DB.prepare(
        `INSERT INTO cms_document_revisions (
          id, document_id, revision_number, title, slug, data_json, note, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        id,
        nextRevision,
        revision.title,
        revision.slug,
        revision.data_json,
        `Restored revision ${revisionNumber}`,
        user.id,
        updatedAt,
      ),
    ]);
  } catch (error) {
    if (isUniqueError(error)) throw new HttpError(409, 'That revision conflicts with an existing slug.', 'slug_in_use');
    throw error;
  }

  await logAudit(env, { userId: user.id, action: 'document.restore', resourceType: 'document', resourceId: id, detail: `Restored revision ${revisionNumber}` });
  return json({ document: formatDocument(await getDocument(id, env)) });
}

async function reorderDocuments(request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const rawIds: unknown = body.ids;
  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 100) {
    throw new HttpError(400, 'Provide 1 to 100 document ids in order.', 'invalid_input');
  }
  const ids = rawIds.map((id) => (typeof id === 'string' ? id : ''));
  if (ids.some((id) => !id)) throw new HttpError(400, 'Document ids must be text.', 'invalid_input');
  const placeholders = ids.map(() => '?').join(', ');
  const existing = await env.CMS_DB.prepare(
    `SELECT id FROM cms_documents WHERE id IN (${placeholders})`,
  ).bind(...ids).all<{ id: string }>();
  if (existing.results.length !== ids.length) {
    throw new HttpError(404, 'One or more documents were not found.', 'not_found');
  }
  const updatedAt = now();
  await env.CMS_DB.batch(
    ids.map((id, index) =>
      env.CMS_DB.prepare('UPDATE cms_documents SET sort_order = ?, updated_at = ? WHERE id = ?').bind(index, updatedAt, id),
    ),
  );
  await logAudit(env, { userId: user.id, action: 'document.reorder', resourceType: 'document', detail: `${ids.length} documents reordered` });
  return json({ reordered: ids.length });
}

async function deleteUser(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  if (id === user.id) throw new HttpError(400, 'You cannot delete your own account.', 'invalid_input');
  const target = await env.CMS_DB.prepare(
    'SELECT id, email, display_name, role FROM cms_users WHERE id = ?',
  ).bind(id).first<CmsUser>();
  if (!target) throw new HttpError(404, 'User was not found.', 'not_found');
  const owned = await env.CMS_DB.prepare(
    'SELECT COUNT(*) AS total FROM cms_documents WHERE created_by = ? OR updated_by = ?',
  ).bind(id, id).first<{ total: number }>();
  if (Number(owned?.total ?? 0) > 0) {
    throw new HttpError(409, 'Reassign or remove the content owned by this user before deleting them.', 'has_content');
  }
  await env.CMS_DB.prepare('DELETE FROM cms_users WHERE id = ?').bind(id).run();
  await logAudit(env, { userId: user.id, action: 'user.delete', resourceType: 'user', resourceId: id, detail: target.email });
  return json({ deleted: true });
}

async function getChatConversation(id: string, env: CmsEnv): Promise<ChatConversationRow> {
  const conversation = await env.CMS_DB.prepare(
    `SELECT id, visitor_name, visitor_email, status, last_message_preview, last_sender_type,
      created_at, updated_at, last_message_at, admin_read_at
     FROM cms_chat_conversations WHERE id = ?`,
  )
    .bind(id)
    .first<ChatConversationRow>();
  if (!conversation) throw new HttpError(404, 'Conversation was not found.', 'not_found');
  return conversation;
}

async function getConversationMessages(id: string, env: CmsEnv): Promise<ChatMessageRow[]> {
  const messages = await env.CMS_DB.prepare(
    `SELECT id, conversation_id, sender_type, sender_name, body, created_at
     FROM cms_chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
  )
    .bind(id)
    .all<ChatMessageRow>();
  return messages.results;
}

async function requireVisitorConversation(id: string, request: Request, env: CmsEnv): Promise<ChatConversationRow> {
  const token = readVisitorToken(request);
  if (!token) throw new HttpError(401, 'This chat session is not available on this device.', 'visitor_unauthenticated');
  const tokenHash = await sha256Hex(token);
  const conversation = await env.CMS_DB.prepare(
    `SELECT id, visitor_name, visitor_email, status, last_message_preview, last_sender_type,
      created_at, updated_at, last_message_at, admin_read_at
     FROM cms_chat_conversations WHERE id = ? AND visitor_token_hash = ?`,
  )
    .bind(id, tokenHash)
    .first<ChatConversationRow>();
  if (!conversation) throw new HttpError(404, 'Conversation was not found.', 'not_found');
  return conversation;
}

async function createVisitorConversation(request: Request, env: CmsEnv): Promise<Response> {
  await consumeRateLimit(
    env,
    `chat-create:${requestClientKey(request)}`,
    CHAT_CREATE_RATE_LIMIT,
    CHAT_RATE_WINDOW_SECONDS,
    'Too many new conversations were started from this connection. Try again later.',
  );
  const body = await readJson(request);
  const visitorName = asOptionalString(body.visitorName, 80) || 'Website visitor';
  const visitorEmail = validateOptionalEmail(body.visitorEmail) ?? null;
  const message = validateChatMessage(body.message);
  const id = crypto.randomUUID();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const createdAt = now();
  const messageRow: ChatMessageRow = {
    id: crypto.randomUUID(),
    conversation_id: id,
    sender_type: 'visitor',
    sender_name: visitorName,
    body: message,
    created_at: createdAt,
  };

  await env.CMS_DB.batch([
    env.CMS_DB.prepare(
      `INSERT INTO cms_chat_conversations (
        id, visitor_token_hash, visitor_name, visitor_email, status, last_message_preview,
        last_sender_type, created_at, updated_at, last_message_at
      ) VALUES (?, ?, ?, ?, 'open', ?, 'visitor', ?, ?, ?)`,
    ).bind(id, tokenHash, visitorName, visitorEmail, message.slice(0, 180), createdAt, createdAt, createdAt),
    env.CMS_DB.prepare(
      `INSERT INTO cms_chat_messages (id, conversation_id, sender_type, sender_name, body, created_at)
       VALUES (?, ?, 'visitor', ?, ?, ?)`,
    ).bind(messageRow.id, id, visitorName, message, createdAt),
  ]);

  return json({
    conversation: formatChatConversation(await getChatConversation(id, env)),
    messages: [formatChatMessage(messageRow)],
    visitorToken: token,
  }, { status: 201 });
}

async function addVisitorMessage(id: string, request: Request, env: CmsEnv): Promise<Response> {
  await consumeRateLimit(
    env,
    `chat-message:${requestClientKey(request)}`,
    CHAT_MESSAGE_RATE_LIMIT,
    CHAT_RATE_WINDOW_SECONDS,
    'Too many messages were sent from this connection. Try again later.',
  );
  const body = await readJson(request);
  const message = validateChatMessage(body.message);
  const conversation = await requireVisitorConversation(id, request, env);
  if (conversation.status === 'closed') throw new HttpError(409, 'This conversation is closed.', 'conversation_closed');

  const createdAt = now();
  const messageRow: ChatMessageRow = {
    id: crypto.randomUUID(),
    conversation_id: id,
    sender_type: 'visitor',
    sender_name: conversation.visitor_name,
    body: message,
    created_at: createdAt,
  };
  await env.CMS_DB.batch([
    env.CMS_DB.prepare(
      `INSERT INTO cms_chat_messages (id, conversation_id, sender_type, sender_name, body, created_at)
       VALUES (?, ?, 'visitor', ?, ?, ?)`,
    ).bind(messageRow.id, id, conversation.visitor_name, message, createdAt),
    env.CMS_DB.prepare(
      `UPDATE cms_chat_conversations
       SET last_message_preview = ?, last_sender_type = 'visitor', updated_at = ?, last_message_at = ?
       WHERE id = ?`,
    ).bind(message.slice(0, 180), createdAt, createdAt, id),
  ]);
  return json({ message: formatChatMessage(messageRow) }, { status: 201 });
}

async function getVisitorConversation(id: string, request: Request, env: CmsEnv): Promise<Response> {
  const conversation = await requireVisitorConversation(id, request, env);
  const messages = await getConversationMessages(id, env);
  return json({ conversation: formatChatConversation(conversation), messages: messages.map(formatChatMessage) });
}

async function publicChat(parts: string[], request: Request, env: CmsEnv): Promise<Response> {
  if (parts[0] !== 'conversations') throw new HttpError(404, 'Route was not found.', 'not_found');
  if (parts.length === 1 && request.method === 'POST') return createVisitorConversation(request, env);
  const id = parts[1] ? validateConversationId(decodeURIComponent(parts[1])) : '';
  if (!id) throw new HttpError(404, 'Route was not found.', 'not_found');
  if (parts.length === 2 && request.method === 'GET') return getVisitorConversation(id, request, env);
  if (parts.length === 3 && parts[2] === 'messages' && request.method === 'POST') return addVisitorMessage(id, request, env);
  throw new HttpError(404, 'Route was not found.', 'not_found');
}

async function listConversations(env: CmsEnv): Promise<Response> {
  const conversations = await env.CMS_DB.prepare(
    `SELECT id, visitor_name, visitor_email, status, last_message_preview, last_sender_type,
      created_at, updated_at, last_message_at, admin_read_at
     FROM cms_chat_conversations ORDER BY last_message_at DESC LIMIT ?`,
  )
    .bind(MAX_CHAT_CONVERSATIONS)
    .all<ChatConversationRow>();
  return json({ conversations: conversations.results.map((conversation) => formatChatConversation(conversation, true)) });
}

async function getAdminConversation(id: string, env: CmsEnv): Promise<Response> {
  const [conversation, messages] = await Promise.all([getChatConversation(id, env), getConversationMessages(id, env)]);
  return json({ conversation: formatChatConversation(conversation, true), messages: messages.map(formatChatMessage) });
}

async function markConversationRead(id: string, env: CmsEnv): Promise<Response> {
  await getChatConversation(id, env);
  const readAt = now();
  await env.CMS_DB.prepare(
    'UPDATE cms_chat_conversations SET admin_read_at = ? WHERE id = ?',
  ).bind(readAt, id).run();
  return json({ read: true, readAt });
}

async function updateConversationStatus(id: string, request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const conversation = await getChatConversation(id, env);
  const body = await readJson(request);
  if (body.status !== 'open' && body.status !== 'closed') {
    throw new HttpError(400, 'Conversation status must be open or closed.', 'invalid_input');
  }
  const status = body.status;
  const updatedAt = now();
  await env.CMS_DB.prepare(
    'UPDATE cms_chat_conversations SET status = ?, admin_read_at = ?, updated_at = ? WHERE id = ?',
  ).bind(status, updatedAt, updatedAt, id).run();
  await logAudit(env, {
    userId: user.id,
    action: `conversation.${status}`,
    resourceType: 'conversation',
    resourceId: id,
    detail: `${conversation.visitor_name} marked ${status}`,
  });
  return json({ conversation: formatChatConversation(await getChatConversation(id, env), true) });
}

async function addAdminMessage(id: string, request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const message = validateChatMessage(body.message);
  const conversation = await getChatConversation(id, env);
  if (conversation.status === 'closed') throw new HttpError(409, 'Reopen this conversation before replying.', 'conversation_closed');

  const createdAt = now();
  const messageRow: ChatMessageRow = {
    id: crypto.randomUUID(),
    conversation_id: id,
    sender_type: 'admin',
    sender_name: user.display_name,
    body: message,
    created_at: createdAt,
  };
  await env.CMS_DB.batch([
    env.CMS_DB.prepare(
      `INSERT INTO cms_chat_messages (id, conversation_id, sender_type, sender_name, body, created_at)
       VALUES (?, ?, 'admin', ?, ?, ?)`,
    ).bind(messageRow.id, id, user.display_name, message, createdAt),
    env.CMS_DB.prepare(
      `UPDATE cms_chat_conversations
       SET last_message_preview = ?, last_sender_type = 'admin', admin_read_at = ?, updated_at = ?, last_message_at = ?
       WHERE id = ?`,
    ).bind(message.slice(0, 180), createdAt, createdAt, createdAt, id),
  ]);
  return json({ message: formatChatMessage(messageRow) }, { status: 201 });
}

async function listUsers(env: CmsEnv): Promise<Response> {
  const result = await env.CMS_DB.prepare(
    'SELECT id, email, display_name, role FROM cms_users ORDER BY created_at ASC',
  ).all<CmsUser>();
  return json({ users: result.results.map(formatUser) });
}

async function createUser(request: Request, actor: CmsUser, env: CmsEnv): Promise<Response> {
  const body = await readJson(request);
  const email = validateEmail(body.email);
  const displayName = asString(body.displayName, 'Display name', 80);
  const password = validatePassword(body.password);
  const role = validateRole(body.role);
  const passwordRecord = await createPasswordRecord(password);
  const user: CmsUser = { id: crypto.randomUUID(), email, display_name: displayName, role };

  try {
    await env.CMS_DB.prepare(
      `INSERT INTO cms_users (id, email, display_name, role, password_salt, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(user.id, user.email, user.display_name, user.role, passwordRecord.salt, passwordRecord.hash)
      .run();
  } catch (error) {
    if (isUniqueError(error)) throw new HttpError(409, 'That email is already in use.', 'email_in_use');
    throw error;
  }

  await logAudit(env, { userId: actor.id, action: 'user.create', resourceType: 'user', resourceId: user.id, detail: email });
  return json({ user: formatUser(user) }, { status: 201 });
}

async function listMedia(request: Request, env: CmsEnv): Promise<Response> {
  const search = new URL(request.url).searchParams.get('search')?.trim().slice(0, 120) ?? '';
  const query = search
    ? env.CMS_DB.prepare(
      `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
       FROM cms_media
       WHERE filename LIKE ? ESCAPE '\\' OR alt_text LIKE ? ESCAPE '\\' OR title_text LIKE ? ESCAPE '\\' OR caption LIKE ? ESCAPE '\\'
       ORDER BY created_at DESC LIMIT 100`,
    )
    : env.CMS_DB.prepare(
      `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
       FROM cms_media ORDER BY created_at DESC LIMIT 100`,
    );
  const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  const result = search ? await query.bind(escaped, escaped, escaped, escaped).all<MediaRow>() : await query.all<MediaRow>();
  return json({ media: result.results.map((media) => formatMedia(media, request)) });
}

function sanitizeFilename(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  if (!cleaned || cleaned.length > 160) {
    throw new HttpError(400, 'File name is invalid.', 'invalid_input');
  }
  return cleaned;
}

function validateMediaFile(filename: string, mimeType: string): void {
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : undefined;
  const permittedExtensions = ALLOWED_MEDIA_EXTENSIONS[mimeType];
  if (!extension || !permittedExtensions?.includes(extension)) {
    throw new HttpError(
      415,
      'Use a JPEG, PNG, WebP, AVIF, GIF, or PDF file with a matching file extension.',
      'unsupported_media_type',
    );
  }
}

async function uploadMedia(request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const filename = sanitizeFilename(asString(request.headers.get('x-file-name'), 'File name', 160));
  const altText = asOptionalString(request.headers.get('x-alt-text') ?? '', 240) ?? '';
  const titleText = asOptionalString(request.headers.get('x-title') ?? '', 240) ?? '';
  const caption = asOptionalString(request.headers.get('x-caption') ?? '', 500) ?? '';
  const mimeType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  validateMediaFile(filename, mimeType);

  const contentLength = Number(request.headers.get('content-length') ?? '');
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    throw new HttpError(411, 'Upload size is required.', 'length_required');
  }
  if (contentLength > MAX_MEDIA_BYTES) {
    throw new HttpError(413, 'Files must be 10 MB or smaller.', 'payload_too_large');
  }
  if (!request.body) throw new HttpError(400, 'Upload body is required.', 'invalid_input');

  const id = crypto.randomUUID();
  const objectKey = `media/${id}/${filename}`;
  const object = await env.CMS_MEDIA.put(objectKey, request.body, {
    httpMetadata: { contentType: mimeType, contentDisposition: `inline; filename="${filename}"` },
    customMetadata: { mediaId: id, uploadedBy: user.id },
  });
  if (!object) throw new HttpError(500, 'The media file could not be stored.', 'storage_error');

  try {
    await env.CMS_DB.prepare(
      `INSERT INTO cms_media (id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, objectKey, filename, altText, titleText, caption, mimeType, contentLength, user.id)
      .run();
  } catch (error) {
    await env.CMS_MEDIA.delete(objectKey);
    throw error;
  }

  const media = await env.CMS_DB.prepare(
    `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
     FROM cms_media WHERE id = ?`,
  )
    .bind(id)
    .first<MediaRow>();
  if (!media) throw new HttpError(500, 'Media metadata could not be stored.', 'storage_error');
  await logAudit(env, { userId: user.id, action: 'media.upload', resourceType: 'media', resourceId: id, detail: filename });
  return json({ media: formatMedia(media, request) }, { status: 201 });
}

async function serveMedia(id: string, env: CmsEnv): Promise<Response> {
  const media = await env.CMS_DB.prepare(
    `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
     FROM cms_media WHERE id = ?`,
  )
    .bind(id)
    .first<MediaRow>();
  if (!media) throw new HttpError(404, 'Media was not found.', 'not_found');

  const object = await env.CMS_MEDIA.get(media.object_key);
  if (!object) throw new HttpError(404, 'Media file was not found.', 'not_found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}

async function deleteMedia(id: string, user: CmsUser, env: CmsEnv): Promise<Response> {
  const media = await env.CMS_DB.prepare(
    `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
     FROM cms_media WHERE id = ?`,
  )
    .bind(id)
    .first<MediaRow>();
  if (!media) throw new HttpError(404, 'Media was not found.', 'not_found');
  await env.CMS_MEDIA.delete(media.object_key);
  await env.CMS_DB.prepare('DELETE FROM cms_media WHERE id = ?').bind(id).run();
  await logAudit(env, { userId: user.id, action: 'media.delete', resourceType: 'media', resourceId: id, detail: media.filename });
  return json({ deleted: true });
}

async function updateMedia(id: string, request: Request, user: CmsUser, env: CmsEnv): Promise<Response> {
  const existing = await env.CMS_DB.prepare(
    `SELECT id, object_key, filename, alt_text, title_text, caption, mime_type, byte_size, created_at
     FROM cms_media WHERE id = ?`,
  ).bind(id).first<MediaRow>();
  if (!existing) throw new HttpError(404, 'Media was not found.', 'not_found');
  const body = await readJson(request);
  const altText = body.altText === undefined ? existing.alt_text : (asOptionalString(body.altText, 240) ?? '');
  const titleText = body.title === undefined ? existing.title_text : (asOptionalString(body.title, 240) ?? '');
  const caption = body.caption === undefined ? existing.caption : (asOptionalString(body.caption, 500) ?? '');
  await env.CMS_DB.prepare(
    'UPDATE cms_media SET alt_text = ?, title_text = ?, caption = ? WHERE id = ?',
  ).bind(altText, titleText, caption, id).run();
  const updated = { ...existing, alt_text: altText, title_text: titleText, caption };
  await logAudit(env, { userId: user.id, action: 'media.update', resourceType: 'media', resourceId: id, detail: existing.filename });
  return json({ media: formatMedia(updated, request) });
}

async function publicContent(parts: string[], request: Request, env: CmsEnv): Promise<Response> {
  if (request.method !== 'GET') throw new HttpError(405, 'Method is not allowed.', 'method_not_allowed');
  if (parts.length === 1) {
    const type = new URL(request.url).searchParams.get('type');
    if (type && !/^[a-z][a-z0-9_]{0,39}$/.test(type)) {
      throw new HttpError(400, 'Content type is invalid.', 'invalid_input');
    }
    const statement = type
      ? env.CMS_DB.prepare(
        `SELECT id, type, slug, title, published_data_json, published_revision, sort_order, published_at
         FROM cms_documents WHERE status = 'published' AND type = ? ORDER BY sort_order ASC, published_at DESC`,
      ).bind(type)
      : env.CMS_DB.prepare(
        `SELECT id, type, slug, title, published_data_json, published_revision, sort_order, published_at
         FROM cms_documents WHERE status = 'published' ORDER BY sort_order ASC, published_at DESC`,
      );
    const result = await statement.all<Pick<DocumentRow, 'id' | 'type' | 'slug' | 'title' | 'published_data_json' | 'published_revision' | 'sort_order' | 'published_at'>>();
    return json({
      documents: result.results.map((document) => ({
        id: document.id,
        type: document.type,
        slug: document.slug,
        title: document.title,
        data: document.published_data_json ? parseStoredData(document.published_data_json) : {},
        revision: document.published_revision,
        order: document.sort_order,
        publishedAt: document.published_at,
      })),
    });
  }

  if (parts.length !== 3) throw new HttpError(404, 'Route was not found.', 'not_found');
  const type = validateType(decodeURIComponent(parts[1]));
  const slug = validateSlug(decodeURIComponent(parts[2]));
  const document = await env.CMS_DB.prepare(
    `SELECT id, type, slug, title, published_data_json, published_revision, sort_order, published_at
     FROM cms_documents WHERE status = 'published' AND type = ? AND slug = ?`,
  )
    .bind(type, slug)
    .first<Pick<DocumentRow, 'id' | 'type' | 'slug' | 'title' | 'published_data_json' | 'published_revision' | 'sort_order' | 'published_at'>>();
  if (!document || !document.published_data_json) throw new HttpError(404, 'Published content was not found.', 'not_found');
  return json({
    document: {
      id: document.id,
      type: document.type,
      slug: document.slug,
      title: document.title,
      data: parseStoredData(document.published_data_json),
      revision: document.published_revision,
      order: document.sort_order,
      publishedAt: document.published_at,
    },
  });
}

async function route(request: Request, env: CmsEnv): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'v1') throw new HttpError(404, 'Route was not found.', 'not_found');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  if (parts[1] === 'health' && request.method === 'GET') {
    try {
      const count = await env.CMS_DB.prepare('SELECT COUNT(*) AS total FROM cms_users').first<{ total: number }>();
      return json({
        ready: true,
        version: '1',
        setupConfigured: Boolean(env.CMS_ADMIN_SETUP_TOKEN),
        initialized: Number(count?.total ?? 0) > 0,
      });
    } catch (error) {
      console.error(JSON.stringify({ message: 'CMS health check failed', error: error instanceof Error ? error.message : String(error) }));
      return json({ ready: false, version: '1', migrationRequired: true }, { status: 503 });
    }
  }

  if (parts[1] === 'content') return publicContent(parts.slice(1), request, env);
  if (parts[1] === 'chat') return publicChat(parts.slice(2), request, env);
  if (parts[1] === 'media' && parts.length === 3 && request.method === 'GET') {
    return serveMedia(decodeURIComponent(parts[2]), env);
  }
  if (parts[1] !== 'admin') throw new HttpError(404, 'Route was not found.', 'not_found');

  const adminRoute = parts.slice(2);
  if (adminRoute[0] === 'bootstrap' && request.method === 'POST') return bootstrap(request, env);
  if (adminRoute[0] === 'login' && request.method === 'POST') return login(request, env);
  if (adminRoute[0] === 'recover-password' && request.method === 'POST') return recoverPassword(request, env);
  if (adminRoute[0] === 'logout' && request.method === 'POST') {
    const token = readBearerToken(request);
    if (token) await env.CMS_DB.prepare('DELETE FROM cms_sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
    return json({ signedOut: true });
  }

  const user = await requireUser(request, env);
  if (adminRoute[0] === 'me' && request.method === 'GET') return json({ user: formatUser(user) });
  if (adminRoute[0] === 'change-password' && request.method === 'POST') return changePassword(request, user, env);

  if (adminRoute[0] === 'users') {
    requireRole(user, 'admin');
    if (request.method === 'GET' && adminRoute.length === 1) return listUsers(env);
    if (request.method === 'POST' && adminRoute.length === 1) return createUser(request, user, env);
    if (request.method === 'DELETE' && adminRoute.length === 2) return deleteUser(decodeURIComponent(adminRoute[1]), user, env);
  }

  if (adminRoute[0] === 'audit' && request.method === 'GET') {
    requireRole(user, 'admin');
    return listAudit(request, env);
  }

  if (adminRoute[0] === 'conversations') {
    requireRole(user, 'admin');
    if (adminRoute.length === 1 && request.method === 'GET') return listConversations(env);
    const conversationId = adminRoute[1] ? validateConversationId(decodeURIComponent(adminRoute[1])) : '';
    if (!conversationId) throw new HttpError(404, 'Route was not found.', 'not_found');
    if (adminRoute.length === 2 && request.method === 'GET') return getAdminConversation(conversationId, env);
    if (adminRoute.length === 2 && request.method === 'PATCH') return updateConversationStatus(conversationId, request, user, env);
    if (adminRoute.length === 3 && adminRoute[2] === 'read' && request.method === 'POST') {
      return markConversationRead(conversationId, env);
    }
    if (adminRoute.length === 3 && adminRoute[2] === 'messages' && request.method === 'POST') {
      return addAdminMessage(conversationId, request, user, env);
    }
  }

  if (adminRoute[0] === 'documents') {
    if (adminRoute.length === 1 && request.method === 'GET') return listDocuments(request, env);
    const documentId = adminRoute[1] ? decodeURIComponent(adminRoute[1]) : '';
    if (documentId === 'reorder' && adminRoute.length === 2 && request.method === 'PATCH') {
      requireRole(user, 'admin', 'editor');
      return reorderDocuments(request, user, env);
    }
    if (adminRoute.length === 2 && request.method === 'GET') {
      if (!documentId) throw new HttpError(404, 'Route was not found.', 'not_found');
      return json({ document: formatDocument(await getDocument(documentId, env)) });
    }
    if (adminRoute[2] === 'revisions' && request.method === 'GET') {
      if (!documentId) throw new HttpError(404, 'Route was not found.', 'not_found');
      return listRevisions(documentId, env);
    }
    requireRole(user, 'admin', 'editor');
    if (adminRoute.length === 1 && request.method === 'POST') return createDocument(request, user, env);
    if (!documentId) throw new HttpError(404, 'Route was not found.', 'not_found');
    if (adminRoute.length === 2 && request.method === 'PATCH') return updateDocument(documentId, request, user, env);
    if (adminRoute.length === 2 && request.method === 'DELETE') return archiveDocument(documentId, user, env);
    if (adminRoute[2] === 'validate-publish' && request.method === 'POST') return validateDocumentForPublish(documentId, env);
    if (adminRoute[2] === 'publish' && request.method === 'POST') return publishDocument(documentId, user, env);
    if (adminRoute[2] === 'unpublish' && request.method === 'POST') return unpublishDocument(documentId, user, env);
    if (adminRoute[2] === 'schedule' && request.method === 'POST') return scheduleDocument(documentId, request, user, env);
    if (adminRoute[2] === 'restore-archived' && request.method === 'POST') return restoreArchivedDocument(documentId, user, env);
    if (adminRoute[2] === 'restore' && adminRoute[3] && request.method === 'POST') {
      const revisionNumber = Number(adminRoute[3]);
      if (!Number.isInteger(revisionNumber) || revisionNumber < 1) {
        throw new HttpError(400, 'Revision number is invalid.', 'invalid_input');
      }
      return restoreRevision(documentId, revisionNumber, user, env);
    }
  }

  if (adminRoute[0] === 'media') {
    if (request.method === 'GET' && adminRoute.length === 1) return listMedia(request, env);
    requireRole(user, 'admin', 'editor');
    if (request.method === 'POST' && adminRoute.length === 1) return uploadMedia(request, user, env);
    if (request.method === 'PATCH' && adminRoute.length === 2) return updateMedia(decodeURIComponent(adminRoute[1]), request, user, env);
    if (request.method === 'DELETE' && adminRoute.length === 2) return deleteMedia(decodeURIComponent(adminRoute[1]), user, env);
  }

  throw new HttpError(404, 'Route was not found.', 'not_found');
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      const response = await route(request, env);
      return withCors(response, request, env);
    } catch (error) {
      const url = new URL(request.url);
      if (error instanceof HttpError) {
        return withCors(json({ error: error.message, code: error.code, ...(error.issues ? { issues: [...error.issues] } : {}) }, { status: error.status }), request, env);
      }
      console.error(JSON.stringify({
        message: 'Unhandled CMS request error',
        method: request.method,
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
      }));
      return withCors(json({ error: 'The CMS could not complete this request.', code: 'internal_error' }, { status: 500 }), request, env);
    }
  },
  async scheduled(_controller, env, context): Promise<void> {
    context.waitUntil(publishScheduledDocuments(env));
  },
} satisfies ExportedHandler<CmsEnv>;

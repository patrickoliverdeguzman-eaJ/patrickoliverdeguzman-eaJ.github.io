/**
 * GitHub Pages serves Next static-export routes as .html files. Sites serves
 * the same routes with clean URLs. Keeping the rule here prevents admin links
 * from working in one deployment but not the other.
 */
export function adminPath(path: string): string {
  if (process.env.NEXT_PUBLIC_GITHUB_PAGES !== 'true') return path;

  const [pathname, query = ''] = path.split('?');
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return `${normalized}.html${query ? `?${query}` : ''}`;
}

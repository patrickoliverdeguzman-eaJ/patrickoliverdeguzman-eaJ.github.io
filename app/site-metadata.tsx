'use client';

import { useEffect } from 'react';
import { fetchPublishedDoc } from '@/lib/site-content';

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

function setIcon(rel: 'icon' | 'apple-touch-icon', href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export default function SiteMetadata() {
  useEffect(() => {
    let cancelled = false;
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/cms')) return;
    void (async () => {
      const settings = await fetchPublishedDoc('site_settings', 'global');
      if (cancelled) return;
      const routeSlug = pathname.split('/').filter(Boolean)[0]?.replace(/\.html$/i, '') ?? '';
      let pageSlug = routeSlug === 'custom'
        ? new URLSearchParams(window.location.search).get('page') ?? ''
        : routeSlug || 'home';
      if (pageSlug === 'home') pageSlug = text(settings?.homepageSlug) ?? 'home';
      const page = pageSlug ? await fetchPublishedDoc('builder_page', pageSlug) : null;
      const pageSettings = page && typeof page.settings === 'object' && page.settings !== null ? page.settings as Record<string, unknown> : null;
      if (cancelled) return;

      const title = text(pageSettings?.seoTitle) ?? text(settings?.defaultSeoTitle);
      const description = text(pageSettings?.seoDescription) ?? text(settings?.defaultSeoDescription);
      const image = text(pageSettings?.socialImage) ?? text(settings?.ogImage);
      const favicon = text(settings?.favicon);
      const appIcon = text(settings?.appIcon);

      if (title) {
        document.title = title;
        setMeta('property', 'og:title', title);
        setMeta('name', 'twitter:title', title);
      }
      if (description) {
        setMeta('name', 'description', description);
        setMeta('property', 'og:description', description);
        setMeta('name', 'twitter:description', description);
      }
      if (image) {
        setMeta('property', 'og:image', image);
        setMeta('name', 'twitter:image', image);
      }
      if (favicon) setIcon('icon', favicon);
      if (appIcon) setIcon('apple-touch-icon', appIcon);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

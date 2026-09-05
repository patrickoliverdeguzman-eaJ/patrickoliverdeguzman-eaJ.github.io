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

export default function SiteMetadata() {
  useEffect(() => {
    let cancelled = false;
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/cms')) return;
    void fetchPublishedDoc('site_settings', 'global').then((settings) => {
      if (cancelled || !settings) return;

      const title = text(settings.defaultSeoTitle);
      const description = text(settings.defaultSeoDescription);
      const image = text(settings.ogImage);

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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

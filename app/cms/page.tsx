import type { Metadata } from 'next';
import CmsWorkspace from './cms-workspace';

export const metadata: Metadata = {
  title: 'Content Studio | INFOStorage',
  description: 'Secure content management for INFOStorage.',
};

export default function CmsPage() {
  return <CmsWorkspace />;
}

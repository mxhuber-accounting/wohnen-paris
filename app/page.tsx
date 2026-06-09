import { notFound } from 'next/navigation';

// The middleware rewrites / → /[locale]/. This page should never render.
export default function RootPage() {
  notFound();
}

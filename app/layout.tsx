import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prompt Library — Matt Pocock’s daily prompts',
  description: 'Browse Matt Pocock’s Prompt of the Day series. Find a prompt, read its original source, and copy available original text.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

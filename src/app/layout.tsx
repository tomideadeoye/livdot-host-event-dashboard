import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIV DOT · Host Event Dashboard',
  description:
    'Host event dashboard for managing an event and preparing it for broadcast.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

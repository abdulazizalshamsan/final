import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NBB Financial Crime · Mission Control',
  description: 'NBB Financial Crime Mission Control — case management demo for the National Bank of Bahrain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TCG Label Generator',
  description: 'Generate shipping labels from your TCGplayer CSV files.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

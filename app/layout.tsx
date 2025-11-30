import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Browser AI Model',
  description: 'Fully functional AI model running in your browser',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

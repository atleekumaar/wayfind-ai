import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WAYFIND AI — Visual Intelligence for Accessible Places',
  description: 'AI-powered physical accessibility intelligence system that analyzes street and entrance imagery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}

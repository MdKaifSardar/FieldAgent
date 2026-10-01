import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FieldGuard — Weather-Aware Irrigation Decision Support',
  description: 'Preventing agricultural groundwater depletion through resource-aware, FAO-56 crop-water decision support. Autonomous agronomic decision support and field telemetry.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased selection:bg-emerald-500 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

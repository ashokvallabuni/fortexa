import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'FORTEXA | Network Attack Forecasting', description: 'Production network state forecasting and SOC intelligence.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
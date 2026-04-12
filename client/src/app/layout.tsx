import { AuthGuard } from '@/components/auth-guard';
import { NavigationProgress } from '@/components/shared/navigation-progress';
import { AuthProvider } from '@/contexts/auth-context';
import { ConfirmProvider } from '@/contexts/confirm-context';
import { ThemeProvider } from '@/contexts/theme-context';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'My Squad',
  description: 'Team management tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex overflow-x-hidden">
        <NavigationProgress />
        <ThemeProvider>
          <ConfirmProvider>
            <AuthProvider>
              <AuthGuard>{children}</AuthGuard>
            </AuthProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

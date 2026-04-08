import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { NavigationProgress } from "@/components/navigation-progress";
import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { ConfirmProvider } from "@/contexts/confirm-context";
import { ThemeProvider } from "@/contexts/theme-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Squad",
  description: "Team management tool",
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
              <AuthGuard>
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
                  <Header />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
                </div>
              </AuthGuard>
            </AuthProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

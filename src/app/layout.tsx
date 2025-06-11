"use client"; // Add "use client" for usePathname

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/hooks/useAuth'; // AuthProvider to wrap the app
import { usePathname } from 'next/navigation'; // Import usePathname

// Metadata cannot be used in a Client Component, so we export it separately
// if you need dynamic metadata based on route, you'd use generateMetadata
export const metadataObject: Metadata = {
  title: 'Nakliyeci Dünyası',
  description: 'Türkiye\'nin Nakliye Platformu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AuthProvider>
          {!isAdminPage && <Header />} {/* Conditionally render Header for non-admin pages */}
          <main className={`flex-grow ${!isAdminPage ? 'container mx-auto px-4 py-8' : ''}`}>
            {children}
          </main>
          {!isAdminPage && <Footer />} {/* Conditionally render Footer */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}


"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
      if (isAuthenticated) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/login');
      }
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <p className="text-foreground">Yönetici Alanı Yükleniyor...</p>
    </div>
  );
}

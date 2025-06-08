"use client";

import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-xl rounded-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Giriş Yap</h1>
          <p className="text-muted-foreground mt-2">Hesabınıza erişmek için bilgilerinizi girin.</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{' '}
          <Button variant="link" asChild className="text-primary p-0 h-auto">
            <Link href="/auth/kayit">Kayıt Olun</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}

// Dummy import for Button to be available in the context
import { Button } from '@/components/ui/button';

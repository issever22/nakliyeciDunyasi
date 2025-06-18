
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CompanyRegisterForm from '@/components/auth/CompanyRegisterForm';
import { Building } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8">
      <div className="w-full max-w-xl p-8 space-y-6 bg-card shadow-xl rounded-lg border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <Building size={30}/> Firma Hesabı Oluşturun
          </h1>
          <p className="text-muted-foreground mt-2">Nakliyeci Dünyası'na firma olarak katılın!</p>
        </div>
        
        <CompanyRegisterForm />

        <p className="text-center text-sm text-muted-foreground pt-4">
          Zaten bir firma hesabınız var mı?{' '}
          <Button variant="link" asChild className="text-primary p-0 h-auto">
            <Link href="/auth/giris">Giriş Yapın</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}

    
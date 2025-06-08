
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegisterForm from '@/components/auth/RegisterForm';
import CompanyRegisterForm from '@/components/auth/CompanyRegisterForm'; // New form
import { User, Building } from 'lucide-react';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8">
      <div className="w-full max-w-xl p-8 space-y-6 bg-card shadow-xl rounded-lg border">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Hesap Oluşturun</h1>
          <p className="text-muted-foreground mt-2">Nakliyeci Dünyası'na katılın!</p>
        </div>

        <Tabs value={accountType} onValueChange={(value) => setAccountType(value as 'individual' | 'company')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User size={18} /> Bireysel Hesap
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building size={18} /> Firma Hesabı
            </TabsTrigger>
          </TabsList>
          <TabsContent value="individual">
            <RegisterForm />
          </TabsContent>
          <TabsContent value="company">
            <CompanyRegisterForm />
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Zaten bir hesabınız var mı?{' '}
          <Button variant="link" asChild className="text-primary p-0 h-auto">
            <Link href="/auth/giris">Giriş Yapın</Link>
          </Button>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useRequireAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, User, Edit3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-32 mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profilim</h1>
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person avatar" />
            <AvatarFallback className="text-3xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>Profil bilgilerinizi buradan görüntüleyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center p-3 bg-muted/30 rounded-md">
            <User className="h-5 w-5 text-primary mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">Ad Soyad / Firma Adı</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-muted/30 rounded-md">
            <Mail className="h-5 w-5 text-primary mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">E-posta Adresi</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          {/* Add more profile fields here as needed */}
          <div className="pt-4">
            <Button variant="outline" className="w-full sm:w-auto">
              <Edit3 className="mr-2 h-4 w-4" /> Profili Düzenle (Yakında)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

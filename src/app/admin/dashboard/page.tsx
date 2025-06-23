
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Package, Handshake, MessageSquare, PlusCircle, Megaphone, ShieldCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';

interface DashboardStats {
  totalCompanies: number;
  pendingCompanies: number;
  activeListings: number;
  recentListingsCount: number;
  totalMembershipRequests: number;
  newMembershipRequests: number;
  unreadMessages: number;
  totalMessages: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  initial: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersRef = collection(db, 'users');
        const listingsRef = collection(db, 'listings');
        const requestsRef = collection(db, 'membershipRequests');
        const messagesRef = collection(db, 'messages');

        const allCompaniesQuery = query(usersRef, where('role', '==', 'company'));
        const pendingCompaniesQuery = query(usersRef, where('role', '==', 'company'), where('isActive', '==', false));
        const recentCompaniesQuery = query(usersRef, where('role', '==', 'company'), orderBy('createdAt', 'desc'), limit(5));

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeListingsQuery = query(listingsRef, where('isActive', '==', true));
        const recentListingsQuery = query(listingsRef, where('postedAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)));
        
        const allRequestsQuery = query(requestsRef);
        const newRequestsQuery = query(requestsRef, where('status', '==', 'new'));

        const unreadMessagesQuery = query(messagesRef, where('isRead', '==', false));
        const allMessagesQuery = query(messagesRef);

        const [
          allCompaniesSnap,
          pendingCompaniesSnap,
          recentCompaniesSnap,
          activeListingsSnap,
          recentListingsSnap,
          allRequestsSnap,
          newRequestsSnap,
          unreadMessagesSnap,
          allMessagesSnap
        ] = await Promise.all([
          getDocs(allCompaniesQuery),
          getDocs(pendingCompaniesQuery),
          getDocs(recentCompaniesQuery),
          getDocs(activeListingsQuery),
          getDocs(recentListingsQuery),
          getDocs(allRequestsQuery),
          getDocs(newRequestsQuery),
          getDocs(unreadMessagesQuery),
          getDocs(allMessagesQuery)
        ]);

        const fetchedRecentUsers = recentCompaniesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'İsimsiz Firma',
                email: data.email || 'E-posta yok',
                initial: (data.name || 'F').charAt(0).toUpperCase()
            };
        });

        setStats({
          totalCompanies: allCompaniesSnap.size,
          pendingCompanies: pendingCompaniesSnap.size,
          activeListings: activeListingsSnap.size,
          recentListingsCount: recentListingsSnap.size,
          totalMembershipRequests: allRequestsSnap.size,
          newMembershipRequests: newRequestsSnap.size,
          unreadMessages: unreadMessagesSnap.size,
          totalMessages: allMessagesSnap.size,
        });

        setRecentUsers(fetchedRecentUsers);
        
      } catch (e: any) {
        console.error("Error fetching dashboard data: ", e);
        setError("Kontrol paneli verileri yüklenirken bir hata oluştu. Gerekli veritabanı dizinleri eksik olabilir.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, subtext, icon, isLoading }: { title: string; value?: number | string; subtext?: string; icon: React.ReactNode; isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary"/> Yönetici Paneli
        </h1>
        <p className="text-muted-foreground mt-1">
          Nakliyeci Dünyası admin paneline hoş geldiniz. Uygulamanızı buradan yönetin.
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-md text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Firma"
          value={stats?.totalCompanies}
          subtext={stats ? `Onay bekleyen: ${stats.pendingCompanies}` : '...'}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          isLoading={loading}
        />
        <StatCard
          title="Aktif İlanlar"
          value={stats?.activeListings}
          subtext={stats ? `Son 24 saatte: +${stats.recentListingsCount}` : '...'}
          icon={<Package className="h-5 w-5 text-muted-foreground" />}
          isLoading={loading}
        />
        <StatCard
          title="Üyelik Talepleri"
          value={stats?.totalMembershipRequests}
          subtext={stats ? `Yeni talep: ${stats.newMembershipRequests}` : '...'}
          icon={<Handshake className="h-5 w-5 text-muted-foreground" />}
          isLoading={loading}
        />
        <StatCard
          title="Okunmamış Mesaj"
          value={stats?.unreadMessages}
          subtext={stats ? `Toplam mesaj: ${stats.totalMessages}` : '...'}
          icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Son Eklenen Firmalar</CardTitle>
                <CardDescription>Platforma yeni katılan son 5 firma.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        ))}
                    </div>
                ) : recentUsers.length > 0 ? (
                    <div className="space-y-4">
                        {recentUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{user.initial}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/users">İncele</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Henüz kayıtlı firma bulunmamaktadır.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Hızlı Eylemler</CardTitle>
                <CardDescription>Sık kullanılan işlemlere hızlıca erişin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                    <Link href="/admin/users/add">
                        <PlusCircle className="mr-2 h-4 w-4"/> Yeni Firma Ekle
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/listings">
                        <Package className="mr-2 h-4 w-4"/> İlanları Yönet
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/settings/announcements">
                        <Megaphone className="mr-2 h-4 w-4"/> Duyuru Yayınla
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/membership-requests">
                        <Handshake className="mr-2 h-4 w-4"/> Üyelik Taleplerini Gör
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

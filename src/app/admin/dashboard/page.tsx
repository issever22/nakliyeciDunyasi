import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Nakliyeci Dünyası admin panel. Manage your application from here.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+12 since last hour</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/listings">Manage Listings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Settings</CardTitle>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Configuration</div>
            <p className="text-xs text-muted-foreground">General & Advanced</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-10 p-4 border-l-4 border-destructive bg-destructive/10 rounded-md">
        <h3 className="text-lg font-semibold text-destructive mb-1">Security Warning</h3>
        <p className="text-sm text-destructive/80">
          This admin panel currently uses client-side authentication which is for <strong>demonstration purposes only</strong>. 
          It is <strong>NOT secure for production use</strong>. 
          Implement robust server-side authentication and authorization for a real application.
        </p>
      </div>
    </div>
  );
}

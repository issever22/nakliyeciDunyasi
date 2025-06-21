
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createCompanyUser as createCompanyUserServerAction } from '@/services/authService';
import { COMPANY_CATEGORIES } from '@/lib/constants';
import type { CompanyCategory, CompanyRegisterData } from '@/types';
import { Loader2, PlusCircle, Building } from 'lucide-react';
import Link from 'next/link';

export default function AddCompanyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<CompanyRegisterData>>({
    role: 'company',
    name: '',
    email: '',
    password: '',
    isActive: true, // Default to active when admin creates a company
    category: 'Nakliyeci',
    username: '',
    companyTitle: '',
    contactFullName: '',
    mobilePhone: '',
    companyType: 'local',
    addressCity: '',
    fullAddress: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: string, value: string) => {
     setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    const requiredFields: (keyof CompanyRegisterData)[] = [
        'name', 'username', 'email', 'password', 'category', 'contactFullName', 'mobilePhone'
    ];

    for (const field of requiredFields) {
        if (!formData[field]) {
            toast({ title: "Eksik Bilgi", description: `Lütfen "${field}" alanını doldurun.`, variant: "destructive" });
            setFormSubmitting(false);
            return;
        }
    }
    if (formData.password && formData.password.length < 6) {
        toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır.", variant: "destructive" });
        setFormSubmitting(false);
        return;
    }

    try {
        const result = await createCompanyUserServerAction(formData as CompanyRegisterData);
        if (result.profile) {
            toast({ title: "Başarılı", description: `Firma "${result.profile.name}" başarıyla oluşturuldu.` });
            router.push('/admin/users');
        } else {
            toast({ title: "Hata", description: result.error || "Firma oluşturulurken bir hata oluştu.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Beklenmedik Hata", description: error.message || "Bir sorun oluştu.", variant: "destructive" });
    } finally {
        setFormSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Yeni Firma Ekle</CardTitle>
                <CardDescription>Yeni bir firma profili oluşturmak için aşağıdaki formu doldurun.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Firma Adı (*)</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="username">Kullanıcı Adı (*)</Label>
                        <Input id="username" value={formData.username} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="category">Firma Kategorisi (*)</Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(value) => handleSelectChange('category', value as CompanyCategory)}
                        >
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {COMPANY_CATEGORIES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="contactFullName">Yetkili Adı Soyadı (*)</Label>
                    <Input id="contactFullName" value={formData.contactFullName} onChange={handleInputChange} required />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">E-posta Adresi (*)</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="mobilePhone">Cep Telefonu (*)</Label>
                        <Input id="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password">Şifre (*)</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required placeholder="En az 6 karakter" />
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))} />
                    <Label htmlFor="isActive" className="font-medium cursor-pointer">Firma Onay Durumu (Aktif/Pasif)</Label>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                    <Link href="/admin/users">İptal</Link>
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                    {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Firmayı Kaydet
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

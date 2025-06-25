
"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Banknote, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function BankAccountPage() {
  const { toast } = useToast();

  const accounts = [
    { bank: 'Türkiye İş Bankası', branch: 'Pendik', iban: 'TR00 0000 0000 0000 0000 0000', accountHolder: 'İssever Bilişim Danışmanlık ve Pazarlama Ticaret Limited Şirketi' },
    { bank: 'Garanti BBVA', branch: 'Teknopark Şubesi', iban: 'TR00 0000 0000 0000 0000 0001', accountHolder: 'İssever Bilişim Danışmanlık ve Pazarlama Ticaret Limited Şirketi' },
    { bank: 'Ziraat Bankası', branch: 'İstanbul', iban: 'TR00 0000 0000 0000 0000 0002', accountHolder: 'İssever Bilişim Danışmanlık ve Pazarlama Ticaret Limited Şirketi' },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Kopyalandı!",
        description: "IBAN panonuza kopyalandı.",
      });
    }).catch(err => {
      console.error("Kopyalama başarısız:", err);
      toast({
        title: "Hata",
        description: "Panoya kopyalama başarısız oldu.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Banka Hesap Numaraları</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Üyelik ve diğer ödemeleriniz için kullanabileceğiniz hesap bilgilerimiz.
            </p>
          </div>
          <div className="relative h-64 md:h-full hidden md:block">
            <Image
              src="https://issever.co/wp-content/uploads/2025/06/n-kamyon.svg"
              alt="Banka işlemleri illüstrasyonu"
              layout="fill"
              objectFit="cover"
              data-ai-hint="finance payment"
            />
          </div>
        </div>
      </Card>
      
      {/* Main Content Section */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
            <CardHeader className="text-center px-0">
                <CardTitle className="text-3xl">Hesap Bilgilerimiz</CardTitle>
                <CardDescription>Lütfen açıklama kısmına firma adınızı veya fatura numaranızı belirtmeyi unutmayın.</CardDescription>
            </CardHeader>
            {accounts.map((account, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-xl text-primary flex items-center gap-3">
                            <Banknote className="h-6 w-6"/> {account.bank} - {account.branch}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="font-semibold text-muted-foreground">Hesap Sahibi</p>
                            <p className="text-base font-medium">{account.accountHolder}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-muted-foreground">IBAN</p>
                            <div className="flex items-center justify-between">
                                <p className="text-base font-mono tracking-wider">{account.iban}</p>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(account.iban)} title={`Kopyala: ${account.iban}`}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </section>
    </div>
  );
}

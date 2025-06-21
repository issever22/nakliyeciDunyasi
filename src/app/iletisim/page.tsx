
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Building, Banknote } from "lucide-react";
import Link from 'next/link';

// Simple contact form component for this page
function ContactForm() {
    // This would need state and a server action to be fully functional.
    // For this prototype, it's a visual component.
    return (
        <form className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="name">Adınız Soyadınız</Label>
                <Input id="name" placeholder="Adınız Soyadınız" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="email">E-posta Adresiniz</Label>
                <Input id="email" type="email" placeholder="ornek@mail.com" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" placeholder="Mesajınızın konusu" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="message">Mesajınız</Label>
                <Textarea id="message" placeholder="Bize iletmek istediğiniz mesajı yazın..." rows={5} />
            </div>
            <Button type="submit" className="w-full">Mesajı Gönder</Button>
        </form>
    );
}


export default function ContactPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">İletişim</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Soru, görüş ve önerileriniz için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.
            </p>
          </div>
          <div className="relative h-64 md:h-full hidden md:block">
            <Image
              src="https://issever.co/wp-content/uploads/2025/06/nakliye-iletisim.svg"
              alt="İletişim illüstrasyonu"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Section */}
      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Contact Info */}
          <div className="md:col-span-5 lg:col-span-4">
            <Card className="p-6 h-full shadow-md">
                <h2 className="text-2xl font-bold text-primary mb-4">İletişim Bilgilerimiz</h2>
                <div className="space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-foreground">Adres</h3>
                            <p>Teknopark İstanbul, Sanayi Mah. Teknopark Bul. No:1/4A 34906 Pendik/İSTANBUL</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Phone className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-foreground">Telefon</h3>
                            <p>+90 555 123 45 67</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Mail className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-foreground">E-posta</h3>
                            <p>info@nakliyecidunyasi.com</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Building className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-foreground">Firma Bilgileri</h3>
                            <p>İssever Bilişim Danışmanlık ve Pazarlama Ticaret Limited Şirketi</p>
                        </div>
                    </div>
                </div>
            </Card>
          </div>
          
          {/* Right Column: Contact Form */}
          <div className="md:col-span-7 lg:col-span-8">
            <Card className="p-6 shadow-md">
                <h2 className="text-2xl font-bold text-primary mb-4">Bize Mesaj Gönderin</h2>
                <ContactForm />
            </Card>
          </div>
        </div>
      </section>

      {/* Bank Account Section */}
      <section className="container mx-auto px-4">
        <div className="bg-muted/30 rounded-xl shadow-lg p-8 md:p-12 text-center">
            <Banknote className="h-12 w-12 text-primary mx-auto mb-4"/>
            <h2 className="text-2xl font-bold mb-2">Banka Hesap Bilgileri</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Üyelik ödemeleri ve diğer finansal işlemleriniz için kullanabileceğiniz banka hesap numaralarımıza ulaşmak için aşağıdaki butona tıklayın.
            </p>
            <Button asChild size="lg">
                <Link href="/banka-hesap-no">Hesap Bilgilerini Görüntüle</Link>
            </Button>
        </div>
      </section>

    </div>
  );
}

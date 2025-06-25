
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Target, Eye, Truck, CheckCircle } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Hakkımızda</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Nakliye deneyimini dijitalleştirerek herkes için daha kolay ve güvenilir hale getiriyoruz.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center p-8">
            <Image
              src="https://issever.co/wp-content/uploads/2025/06/n-logo-white.svg"
              alt="Nakliyeci Dünyası Beyaz Logo"
              width={300}
              height={80}
              className="object-contain"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Section */}
      <section className="container mx-auto px-4">
        <div className="bg-[#f1f5fd] dark:bg-muted/30 rounded-xl shadow-lg p-8 md:p-12">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <h2 className="text-3xl font-bold text-primary mb-2">Farklı ve Özgün</h2>
              <p className="text-muted-foreground">
                Geleneksel nakliye süreçlerinin zorluklarını ortadan kaldırarak, teknolojiyi herkesin hizmetine sunuyoruz.
              </p>
            </div>
            <div className="md:col-span-8 space-y-4 text-lg text-foreground/80">
              <p>
                <strong>Nakliyeci Dünyası</strong> olarak, eşya taşıma deneyimini yeniden tanımlayarak, sizlerin en değerli varlıklarını sorunsuz, güvenli ve uygun fiyatlı bir şekilde yer değiştirmelerini sağlamak için buradayız!
              </p>
              <p>
                Amacımız, modern çağın getirdiği kolaylık ve teknolojiyi lojistik sektörüne entegre ederek, hem yük sahipleri hem de nakliyeciler için şeffaf, verimli ve güvenilir bir pazar yeri oluşturmaktır. Geleneksel yöntemlerin karmaşıklığını ve belirsizliğini bir kenara bırakın; şimdi dijital dönüşümün getirdiği kolaylıklarla tanışmanın tam zamanı!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
        <Card className="bg-card shadow-md">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-full">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Misyonumuz</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              En güncel teknolojiyi kullanarak, yük sahipleri ile güvenilir nakliyecileri en verimli şekilde buluşturmak, lojistik süreçleri basitleştirmek ve sektördeki tüm paydaşlar için değer yaratan, şeffaf bir dijital ekosistem oluşturmak.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-md">
          <CardHeader className="flex flex-row items-center gap-4">
             <div className="bg-accent/10 p-3 rounded-full">
              <Eye className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Vizyonumuz</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Türkiye'nin ve bölgenin lider dijital lojistik platformu olmak; inovasyon, güven ve müşteri memnuniyeti temelinde nakliye sektörünün geleceğini şekillendirmek.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
       <section className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Temel Değerlerimiz</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
                Platformumuzu geliştirirken ve hizmetlerimizi sunarken bu değerlere sıkı sıkıya bağlı kalırız.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg mt-2">Güvenilirlik</h4>
                    <p className="text-sm text-muted-foreground">Onaylanmış profiller ve şeffaf değerlendirme sistemi ile güvenli bir ortam sağlarız.</p>
                </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Truck className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg mt-2">Verimlilik</h4>
                    <p className="text-sm text-muted-foreground">Doğru yükü doğru nakliyeciyle buluşturarak zaman ve maliyet tasarrufu sağlarız.</p>
                </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-4 rounded-full">
                         <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg mt-2">İnovasyon</h4>
                    <p className="text-sm text-muted-foreground">Sektörün ihtiyaçlarına yönelik teknolojik çözümler üreterek sürekli gelişiriz.</p>
                </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Eye className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg mt-2">Şeffaflık</h4>
                    <p className="text-sm text-muted-foreground">Net bilgi akışı ve açık iletişim ile tüm süreçleri anlaşılır kılarız.</p>
                </div>
            </div>
        </section>

    </div>
  );
}

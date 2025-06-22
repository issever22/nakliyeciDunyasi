
'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import type { HeroSlide, CenteredHeroSlide, LeftAlignedHeroSlide, WithInputHeroSlide, SplitHeroSlide, TitleOnlyHeroSlide, VideoBackgroundHeroSlide } from '@/types';
import { getActiveHeroSlides } from '@/services/heroSlidesService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Helper component for rendering individual slide content based on type
const SlideRenderer = ({ slide }: { slide: HeroSlide }) => {
    const router = useRouter();

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (slide.type === 'with-input') {
            const typedSlide = slide as WithInputHeroSlide;
            const formData = new FormData(e.currentTarget);
            const query = formData.get('query');
            if (query && typedSlide.formActionUrl) {
                router.push(`${typedSlide.formActionUrl}?q=${encodeURIComponent(query as string)}`);
            }
        }
    };
    
    const contentWrapperBaseStyles = "relative z-20 flex flex-col h-full text-center p-6 md:p-8 ";

    switch (slide.type) {
        case 'centered':
            const centeredSlide = slide as CenteredHeroSlide;
            return (
                <div className="relative w-full h-full">
                    {centeredSlide.backgroundImageUrl && <Image src={centeredSlide.backgroundImageUrl} alt={centeredSlide.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{centeredSlide.title}</h1>
                        {centeredSlide.subtitle && <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">{centeredSlide.subtitle}</p>}
                        {centeredSlide.buttonText && centeredSlide.buttonUrl && <Button asChild size="lg"><Link href={centeredSlide.buttonUrl}>{centeredSlide.buttonText}</Link></Button>}
                    </div>
                </div>
            );

        case 'left-aligned':
            const leftAlignedSlide = slide as LeftAlignedHeroSlide;
            return (
                 <div className="relative w-full h-full">
                    {leftAlignedSlide.backgroundImageUrl && <Image src={leftAlignedSlide.backgroundImageUrl} alt={leftAlignedSlide.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${leftAlignedSlide.overlayOpacity || 0.5})` }} />
                    <div className={cn(contentWrapperBaseStyles, "items-start justify-center text-left")}>
                        <div className="max-w-2xl" style={{ color: leftAlignedSlide.textColor || '#FFFFFF' }}>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{leftAlignedSlide.title}</h1>
                            {leftAlignedSlide.subtitle && <p className="text-lg sm:text-xl md:text-2xl mb-8 drop-shadow-md">{leftAlignedSlide.subtitle}</p>}
                            {leftAlignedSlide.buttonText && leftAlignedSlide.buttonUrl && <Button asChild size="lg"><Link href={leftAlignedSlide.buttonUrl}>{leftAlignedSlide.buttonText}</Link></Button>}
                        </div>
                    </div>
                </div>
            );
        
        case 'with-input':
            const withInputSlide = slide as WithInputHeroSlide;
            return (
                <div className="relative w-full h-full">
                    {withInputSlide.backgroundImageUrl && <Image src={withInputSlide.backgroundImageUrl} alt={withInputSlide.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg">{withInputSlide.title}</h1>
                        {withInputSlide.subtitle && <p className="text-lg text-neutral-200 mb-6 max-w-2xl drop-shadow-md">{withInputSlide.subtitle}</p>}
                        <form onSubmit={handleFormSubmit} className="flex w-full max-w-lg items-center gap-2 bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-sm">
                            <Input name="query" placeholder={withInputSlide.inputPlaceholder || "Arama yap..."} className="bg-transparent text-white placeholder:text-neutral-300 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base" />
                            <Button type="submit" size="lg" className="rounded-full"><Search className="mr-2 h-4 w-4"/> {withInputSlide.buttonText}</Button>
                        </form>
                    </div>
                </div>
            );

        case 'split':
            const splitSlide = slide as SplitHeroSlide;
            return (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2" style={{ backgroundColor: splitSlide.backgroundColor || '#FFFFFF' }}>
                    <div className="flex flex-col justify-center p-8 md:p-12 text-left">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">{splitSlide.title}</h1>
                        {splitSlide.subtitle && <p className="text-lg text-muted-foreground mb-8">{splitSlide.subtitle}</p>}
                        {splitSlide.buttonText && splitSlide.buttonUrl && <Button asChild size="lg" className="self-start"><Link href={splitSlide.buttonUrl}>{splitSlide.buttonText}</Link></Button>}
                    </div>
                    <div className="relative h-64 md:h-full">
                        {splitSlide.mediaType === 'image' && splitSlide.mediaUrl ? (
                            <Image src={splitSlide.mediaUrl} alt={splitSlide.title} fill style={{ objectFit: 'cover' }} />
                        ) : splitSlide.mediaType === 'video' && splitSlide.mediaUrl ? (
                            <video src={splitSlide.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : null}
                    </div>
                </div>
            );
        
        case 'title-only':
            const titleOnlySlide = slide as TitleOnlyHeroSlide;
            return (
                <div className="relative w-full h-full">
                    {titleOnlySlide.backgroundImageUrl && <Image src={titleOnlySlide.backgroundImageUrl} alt={titleOnlySlide.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-end pb-16")}>
                         <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">{titleOnlySlide.title}</h1>
                        {titleOnlySlide.subtitle && <p className="text-md text-neutral-200 max-w-3xl drop-shadow-md">{titleOnlySlide.subtitle}</p>}
                    </div>
                </div>
            );

        case 'video-background':
            const videoSlide = slide as VideoBackgroundHeroSlide;
            return (
                 <div className="relative w-full h-full">
                    {videoSlide.videoUrl && <video src={videoSlide.videoUrl} autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0" />}
                    <div className="absolute inset-0 bg-black/50 z-10" />
                     <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{videoSlide.title}</h1>
                        {videoSlide.subtitle && <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">{videoSlide.subtitle}</p>}
                        {videoSlide.buttonText && videoSlide.buttonUrl && <Button asChild size="lg"><Link href={videoSlide.buttonUrl}>{videoSlide.buttonText}</Link></Button>}
                    </div>
                </div>
            );

        default:
            return <div className="flex items-center justify-center h-full bg-gray-200">Unknown Slide Type</div>;
    }
};

export default function HeroSlider() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSlides = async () => {
            setLoading(true);
            setError(null);
            const result = await getActiveHeroSlides();
            
            if (result.error) {
                console.error("[HeroSlider] Error fetching slides:", result.error.message);
                const errorMessage = result.error.indexCreationUrl 
                    ? `Eksik bir Firestore dizini var. Lütfen tarayıcı konsolundaki bağlantıyı kullanarak dizini oluşturun.`
                    : result.error.message;
                
                toast({
                    title: "Hero Alanı Yüklenemedi",
                    description: errorMessage,
                    variant: "destructive",
                    duration: result.error.indexCreationUrl ? 20000 : 5000
                });

                if (result.error.indexCreationUrl) {
                    console.error(`!!! EKSİK FIRESTORE INDEX (HeroSlider): ${result.error.indexCreationUrl}`);
                }
                setError(errorMessage);
                setSlides([]);
            } else {
                setSlides(result.slides);
            }
            setLoading(false);
        };
        fetchSlides();
    }, [toast]);

    if (loading) {
        return <Skeleton className="h-[400px] md:h-[450px] w-full rounded-xl" />;
    }

    if (error && slides.length === 0) {
        return (
             <section className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group bg-destructive/10 flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-destructive-foreground">Hero Alanı Yüklenemedi</h2>
                <p className="mt-2 text-sm text-destructive-foreground/80 max-w-md">{error}</p>
                <p className="mt-1 text-xs text-destructive-foreground/60">Eksik bir veritabanı dizini olabilir. Detaylar için tarayıcı konsolunu kontrol edin.</p>
            </section>
        );
    }

    if (slides.length === 0) {
        // Fallback to a default static banner if no slides are configured
        return (
             <section className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-primary/30 mix-blend-multiply z-10" />
                <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                    Türkiye'nin Nakliye Dünyası
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">
                    Yüklerinizi güvenle taşıtın, taşıma ihtiyaçlarınıza en uygun çözümleri burada bulun.
                  </p>
                </div>
            </section>
        );
    }
    
    return (
        <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            pagination={{ clickable: true }}
            loop={slides.length > 1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            effect="fade"
            className="h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group [&_.swiper-pagination]:!bottom-4 [&_.swiper-pagination-bullet]:!bg-primary/30 [&_.swiper-pagination-bullet-active]:!bg-primary"
        >
            {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                    <SlideRenderer slide={slide} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

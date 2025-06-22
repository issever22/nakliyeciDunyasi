
'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

import type { HeroSlide, CenteredHeroSlide, LeftAlignedHeroSlide, WithInputHeroSlide, SplitHeroSlide, TitleOnlyHeroSlide, VideoBackgroundHeroSlide } from '@/types';
import { getActiveHeroSlides } from '@/services/heroSlidesService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, AlertTriangle, icons, ChevronLeft, ChevronRight  } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const Icon = ({ name, className, ...props }: { name?: string; className?: string }) => {
    if (!name) return null;
    const formattedName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const LucideIcon = icons[formattedName as keyof typeof icons];
  
    if (!LucideIcon) {
      console.warn(`[HeroSlider] Icon '${name}' not found in lucide-react. Check the icon name.`);
      return null;
    }
  
    return <LucideIcon className={className} {...props} />;
};

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
    
    const contentWrapperBaseStyles = "relative z-20 flex flex-col h-full p-6 md:p-8 ";

    const renderButton = (s: CenteredHeroSlide | LeftAlignedHeroSlide | WithInputHeroSlide | SplitHeroSlide | VideoBackgroundHeroSlide) => {
        if (!s.buttonText || !s.buttonUrl) return null;

        const buttonStyles = {
            backgroundColor: s.buttonColor ? s.buttonColor : undefined,
            color: s.buttonTextColor ? s.buttonTextColor : undefined,
        };

        return (
            <Button asChild size="lg" style={buttonStyles} className={cn(s.buttonShape === 'rounded' && 'rounded-full')}>
                <Link href={s.buttonUrl}>
                    <Icon name={s.buttonIcon} className="mr-2 h-5 w-5"/>
                    {s.buttonText}
                </Link>
            </Button>
        );
    };


    switch (slide.type) {
        case 'centered': {
            const s = slide as CenteredHeroSlide;
            return (
                <div className="relative w-full h-full">
                    {s.backgroundImageUrl && <Image src={s.backgroundImageUrl} alt={s.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity ?? 0.5})` }} />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center text-center")} style={{ color: s.textColor || 'white' }}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{s.title}</h1>
                        {s.subtitle && <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl drop-shadow-md">{s.subtitle}</p>}
                        {renderButton(s)}
                    </div>
                </div>
            );
        }

        case 'left-aligned': {
            const s = slide as LeftAlignedHeroSlide;
            return (
                 <div className="relative w-full h-full">
                    {s.backgroundImageUrl && <Image src={s.backgroundImageUrl} alt={s.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity || 0.5})` }} />
                    <div className={cn(contentWrapperBaseStyles, "items-start justify-center text-left")}>
                        <div className="max-w-2xl" style={{ color: s.textColor || '#FFFFFF' }}>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{s.title}</h1>
                            {s.subtitle && <p className="text-lg sm:text-xl md:text-2xl mb-8 drop-shadow-md">{s.subtitle}</p>}
                            {renderButton(s)}
                        </div>
                    </div>
                </div>
            );
        }
        
        case 'with-input': {
            const s = slide as WithInputHeroSlide;
             const buttonStyles = {
                backgroundColor: s.buttonColor ? s.buttonColor : undefined,
                color: s.buttonTextColor ? s.buttonTextColor : undefined,
            };
            return (
                <div className="relative w-full h-full">
                    {s.backgroundImageUrl && <Image src={s.backgroundImageUrl} alt={s.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity ?? 0.6})` }}/>
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center text-center")} style={{ color: s.textColor || 'white' }}>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-2 drop-shadow-lg">{s.title}</h1>
                        {s.subtitle && <p className="text-lg text-neutral-200 mb-6 max-w-2xl drop-shadow-md">{s.subtitle}</p>}
                        <form onSubmit={handleFormSubmit} className={cn("flex w-full max-w-lg items-center gap-2 bg-white/20 p-2 border border-white/30 backdrop-blur-sm", s.buttonShape === 'rounded' ? 'rounded-full' : 'rounded-lg')}>
                            <Input name="query" placeholder={s.inputPlaceholder || "Arama yap..."} className="bg-transparent text-white placeholder:text-neutral-300 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base" />
                            <Button type="submit" size="lg" className={cn(s.buttonShape === 'rounded' && 'rounded-full')} style={buttonStyles}><Icon name={s.buttonIcon || 'Search'} className="mr-2 h-4 w-4"/> {s.buttonText}</Button>
                        </form>
                    </div>
                </div>
            );
        }

        case 'split': {
            const s = slide as SplitHeroSlide;
            const textColumnStyle: React.CSSProperties = {
                backgroundColor: !s.backgroundImageUrl ? (s.backgroundColor || '#FFFFFF') : undefined,
                color: s.textColor || undefined,
            };
            return (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2">
                    <div className="relative flex flex-col justify-center p-8 md:p-12 text-left" style={textColumnStyle}>
                         {s.backgroundImageUrl && (
                            <>
                                <Image src={s.backgroundImageUrl} alt={s.title} layout="fill" objectFit="cover" className="z-0" />
                                <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity ?? 0.3})` }} />
                            </>
                        )}
                        <div className="relative z-20">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{s.title}</h1>
                            {s.subtitle && <p className="text-lg text-muted-foreground mb-8">{s.subtitle}</p>}
                            {renderButton(s)}
                        </div>
                    </div>
                    <div className="relative h-64 md:h-full">
                        {s.mediaType === 'image' && s.mediaUrl ? (
                            <Image src={s.mediaUrl} alt={s.title} fill style={{ objectFit: 'cover' }} />
                        ) : s.mediaType === 'video' && s.mediaUrl ? (
                            <video src={s.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : null}
                    </div>
                </div>
            );
        }
        
        case 'title-only': {
            const s = slide as TitleOnlyHeroSlide;
            return (
                <div className="relative w-full h-full">
                    {s.backgroundImageUrl && <Image src={s.backgroundImageUrl} alt={s.title} fill style={{ objectFit: 'cover' }} className="z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity ?? 0.4})` }}/>
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-end pb-16 text-center")} style={{ color: s.textColor || 'white' }}>
                         <h1 className="text-3xl sm:text-4xl font-bold mb-1 drop-shadow-lg">{s.title}</h1>
                        {s.subtitle && <p className="text-md text-neutral-200 max-w-3xl drop-shadow-md">{s.subtitle}</p>}
                    </div>
                </div>
            );
        }

        case 'video-background': {
            const s = slide as VideoBackgroundHeroSlide;
            return (
                 <div className="relative w-full h-full">
                    {s.videoUrl && <video src={s.videoUrl} autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0" />}
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${s.overlayOpacity ?? 0.5})` }}/>
                     <div className={cn(contentWrapperBaseStyles, "items-center justify-center text-center")} style={{ color: s.textColor || 'white' }}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{s.title}</h1>
                        {s.subtitle && <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">{s.subtitle}</p>}
                        {renderButton(s)}
                    </div>
                </div>
            );
        }

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
            modules={[Pagination, Autoplay, EffectFade, Navigation]}
            navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            }}
            spaceBetween={0}
            slidesPerView={1}
            pagination={{ clickable: true }}
            loop={slides.length > 1}
            autoplay={{ 
                delay: 5000, 
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            }}
            effect="fade"
            className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group [&_.swiper-pagination]:!bottom-4 [&_.swiper-pagination-bullet]:!bg-white/50 [&_.swiper-pagination-bullet-active]:!bg-primary"
        >
            {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                    <SlideRenderer slide={slide} />
                </SwiperSlide>
            ))}
            <div className="swiper-button-prev absolute top-1/2 -translate-y-1/2 left-4 z-30 
                            w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronLeft className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>

            <div className="swiper-button-next absolute top-1/2 -translate-y-1/2 right-4 z-30 
                            w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-pointer 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronRight className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
        </Swiper>
    );
}

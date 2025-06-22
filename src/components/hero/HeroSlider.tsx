
'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import type { HeroSlide } from '@/types';
import { getActiveHeroSlides } from '@/services/heroSlidesService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper component for rendering individual slide content based on type
const SlideRenderer = ({ slide }: { slide: HeroSlide }) => {
    const router = useRouter();

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (slide.type === 'with-input') {
            const formData = new FormData(e.currentTarget);
            const query = formData.get('query');
            if (query) {
                router.push(`${slide.formActionUrl}?q=${encodeURIComponent(query as string)}`);
            }
        }
    };
    
    // Base styles for content wrappers
    const contentWrapperBaseStyles = "relative z-20 flex flex-col h-full text-center p-6 md:p-8 ";

    switch (slide.type) {
        case 'centered':
            return (
                <div className="relative w-full h-full">
                    <Image src={slide.backgroundImageUrl} alt={slide.title} fill style={{ objectFit: 'cover' }} className="z-0" />
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{slide.title}</h1>
                        {slide.subtitle && <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">{slide.subtitle}</p>}
                        {slide.buttonText && slide.buttonUrl && <Button asChild size="lg"><Link href={slide.buttonUrl}>{slide.buttonText}</Link></Button>}
                    </div>
                </div>
            );

        case 'left-aligned':
            return (
                 <div className="relative w-full h-full">
                    <Image src={slide.backgroundImageUrl} alt={slide.title} fill style={{ objectFit: 'cover' }} className="z-0" />
                    <div className="absolute inset-0 z-10" style={{ backgroundColor: `rgba(0, 0, 0, ${slide.overlayOpacity || 0.5})` }} />
                    <div className={cn(contentWrapperBaseStyles, "items-start justify-center text-left")}>
                        <div className="max-w-2xl" style={{ color: slide.textColor || '#FFFFFF' }}>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">{slide.title}</h1>
                            {slide.subtitle && <p className="text-lg sm:text-xl md:text-2xl mb-8 drop-shadow-md">{slide.subtitle}</p>}
                            {slide.buttonText && slide.buttonUrl && <Button asChild size="lg"><Link href={slide.buttonUrl}>{slide.buttonText}</Link></Button>}
                        </div>
                    </div>
                </div>
            );
        
        case 'with-input':
            return (
                <div className="relative w-full h-full">
                    <Image src={slide.backgroundImageUrl} alt={slide.title} fill style={{ objectFit: 'cover' }} className="z-0" />
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg">{slide.title}</h1>
                        {slide.subtitle && <p className="text-lg text-neutral-200 mb-6 max-w-2xl drop-shadow-md">{slide.subtitle}</p>}
                        <form onSubmit={handleFormSubmit} className="flex w-full max-w-lg items-center gap-2 bg-white/20 p-2 rounded-full border border-white/30 backdrop-blur-sm">
                            <Input name="query" placeholder={slide.inputPlaceholder || "Arama yap..."} className="bg-transparent text-white placeholder:text-neutral-300 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base" />
                            <Button type="submit" size="lg" className="rounded-full"><Search className="mr-2 h-4 w-4"/> {slide.buttonText}</Button>
                        </form>
                    </div>
                </div>
            );

        case 'split':
            return (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2" style={{ backgroundColor: slide.backgroundColor || '#FFFFFF' }}>
                    <div className="flex flex-col justify-center p-8 md:p-12 text-left">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">{slide.title}</h1>
                        {slide.subtitle && <p className="text-lg text-muted-foreground mb-8">{slide.subtitle}</p>}
                        {slide.buttonText && slide.buttonUrl && <Button asChild size="lg" className="self-start"><Link href={slide.buttonUrl}>{slide.buttonText}</Link></Button>}
                    </div>
                    <div className="relative h-64 md:h-full">
                        {slide.mediaType === 'image' ? (
                            <Image src={slide.mediaUrl} alt={slide.title} fill style={{ objectFit: 'cover' }} />
                        ) : (
                            <video src={slide.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        )}
                    </div>
                </div>
            );
        
        case 'title-only':
             return (
                <div className="relative w-full h-full">
                    <Image src={slide.backgroundImageUrl} alt={slide.title} fill style={{ objectFit: 'cover' }} className="z-0" />
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <div className={cn(contentWrapperBaseStyles, "items-center justify-end pb-16")}>
                         <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">{slide.title}</h1>
                        {slide.subtitle && <p className="text-md text-neutral-200 max-w-3xl drop-shadow-md">{slide.subtitle}</p>}
                    </div>
                </div>
            );

        case 'video-background':
            return (
                 <div className="relative w-full h-full">
                    <video src={slide.videoUrl} autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0" />
                    <div className="absolute inset-0 bg-black/50 z-10" />
                     <div className={cn(contentWrapperBaseStyles, "items-center justify-center")}>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{slide.title}</h1>
                        {slide.subtitle && <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">{slide.subtitle}</p>}
                        {slide.buttonText && slide.buttonUrl && <Button asChild size="lg"><Link href={slide.buttonUrl}>{slide.buttonText}</Link></Button>}
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

    useEffect(() => {
        const fetchSlides = async () => {
            setLoading(true);
            const activeSlides = await getActiveHeroSlides();
            setSlides(activeSlides);
            setLoading(false);
        };
        fetchSlides();
    }, []);

    if (loading) {
        return <Skeleton className="h-[400px] md:h-[450px] w-full rounded-xl" />;
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
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            loop={slides.length > 1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            effect="fade"
            className="h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group"
        >
            {slides.map((slide) => (
                <SwiperSlide key={slide.id}>
                    <SlideRenderer slide={slide} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

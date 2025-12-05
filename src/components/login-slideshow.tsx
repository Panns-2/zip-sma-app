'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import imageData from '@/lib/placeholder-images.json';
import { cn } from '@/lib/utils';

export function LoginSlideshow() {
    const [currentImage, setCurrentImage] = useState(0);
    const images = imageData.loginSlideshow;

    useEffect(() => {
        const timer = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage + 1) % images.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="relative h-64 md:h-full">
            {images.map((image, index) => (
                <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    className={cn(
                        'object-cover transition-opacity duration-1000',
                        index === currentImage ? 'opacity-100' : 'opacity-0'
                    )}
                    data-ai-hint={image.hint}
                />
            ))}
        </div>
    );
}

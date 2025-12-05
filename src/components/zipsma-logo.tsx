'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ZipSMALogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-10 h-10', className)}>
      <Image
        src="/logo.png?v=2"
        alt="ZipSMA Logo"
        fill
        priority
      />
    </div>
  );
}

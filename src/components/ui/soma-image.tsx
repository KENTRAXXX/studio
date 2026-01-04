"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type SomaImageProps = React.ComponentProps<typeof Image> & {
  containerClassName?: string;
};

export const SomaImage = ({
  src,
  alt,
  className,
  containerClassName,
  ...props
}: SomaImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-yellow-700/20 to-amber-500/20 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-500',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
};

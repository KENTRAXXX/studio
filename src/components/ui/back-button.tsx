'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  label?: string;
  href?: string;
}

export function BackButton({ className, label = 'Back', href }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("gap-2 text-muted-foreground hover:text-primary transition-colors p-0 hover:bg-transparent", className)}
    >
      <div className="flex items-center gap-1.5 group">
        <div className="p-1 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
            <ChevronLeft className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
    </Button>
  );
}

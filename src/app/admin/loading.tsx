'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';

/**
 * @fileOverview Admin Portal Segment Loader.
 * Preserves the layout while sub-pages (Users, Treasury, etc.) are initializing.
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full space-y-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-primary opacity-20" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-full">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Command Terminal</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest animate-pulse">Synchronizing Global Registry...</p>
      </div>
    </div>
  );
}

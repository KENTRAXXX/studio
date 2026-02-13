'use client';

import { motion } from 'framer-motion';
import { Package, Loader2 } from 'lucide-react';

/**
 * @fileOverview Supplier Backstage Segment Loader.
 * Focuses on inventory and financial data initialization.
 */
export default function BackstageLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-2xl relative">
        <Package className="h-8 w-8 text-slate-500" />
        <motion.div 
          className="absolute inset-0 rounded-2xl border border-primary/40"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Supplier Ledger</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Auditing Inventory Assets...</span>
        </div>
      </div>
    </div>
  );
}

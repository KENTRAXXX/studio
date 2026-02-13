'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Loader2 } from 'lucide-react';

/**
 * @fileOverview Mogul Dashboard Segment Loader.
 * Optimized for frequent transitions between Analytics, Catalog, and Wallet.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-full bg-primary/5 border border-primary/10"
      >
        <LayoutDashboard className="h-8 w-8 text-primary/40" />
      </motion.div>
      
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Updating Pulse</span>
        </div>
        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Syncing performance telemetry...</p>
      </div>
    </div>
  );
}

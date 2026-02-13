'use client';

import { motion } from 'framer-motion';
import SomaLogo from '@/components/logo';

/**
 * @fileOverview Boutique Tenant Loader.
 * Shows while the multi-tenancy middleware resolves custom domains and fetches catalog data.
 */
export default function BoutiqueLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full bg-background selection:bg-primary/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 flex flex-col items-center"
      >
        <div className="relative h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/5"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <SomaLogo className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-sm font-headline font-bold uppercase tracking-[0.4em] text-primary mb-2">SOMA BOUTIQUE</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

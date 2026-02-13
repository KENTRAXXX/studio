'use client';

import { motion } from 'framer-motion';
import SomaLogo from '@/components/logo';

/**
 * @fileOverview Global SOMA Root Loader.
 * Triggers during major route transitions to provide a premium wait experience.
 */
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black selection:bg-primary/30">
      <div className="relative">
        {/* Outer spinning ring */}
        <motion.div
          className="h-32 w-32 rounded-full border-2 border-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="absolute inset-0 h-32 w-32 rounded-full border-t-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner pulsing logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [0.9, 1.1, 0.9],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <SomaLogo className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
      </div>

      <div className="mt-12 space-y-2 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-black uppercase tracking-[0.6em] text-primary"
        >
          SOMA STRATEGIC ASSETS
        </motion.p>
        <motion.p
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500"
        >
          Initializing Secure Session...
        </motion.p>
      </div>
    </div>
  );
}

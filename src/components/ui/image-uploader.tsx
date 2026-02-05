'use client';

import { useState, useRef } from 'react';
import { Loader2, UploadCloud, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
  onSuccess: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: string;
}

/**
 * @fileOverview A high-fidelity image upload component for the SOMA ecosystem.
 * Features real-time XHR progress tracking and a premium luxury aesthetic.
 */
export function ImageUploader({ onSuccess, label, className, aspectRatio = "aspect-square" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'SomaDS';

    if (!cloudName) {
      console.error("Cloudinary Cloud Name is missing from environment variables.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    xhr.open('POST', url, true);

    // Track bits-on-the-wire progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        onSuccess(response.secure_url);
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
    };

    xhr.send(formData);
  };

  return (
    <div className={cn("relative group w-full", className)}>
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative overflow-hidden border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-500 flex flex-col items-center justify-center p-6 min-h-[160px]",
          isUploading ? "border-primary/50 bg-primary/5" : "border-primary/20 hover:border-primary/50 bg-slate-900/20 hover:bg-slate-900/40",
          aspectRatio
        )}
      >
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full space-y-6 px-4 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-pulse" />
                </div>
                <motion.p 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-primary"
                >
                  Finalizing Luxury Asset...
                </motion.p>
              </div>
              
              <div className="space-y-2">
                <div className="relative h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(218,165,32,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Secure Uplink</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{uploadProgress}%</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="p-4 rounded-full bg-primary/5 border border-primary/10 group-hover:border-primary/30 transition-colors">
                <UploadCloud className="h-8 w-8 text-slate-500 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">{label || 'Upload Media'}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">SVG, PNG, JPG or WEBP • MAX 10MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }} 
      />
    </div>
  );
}

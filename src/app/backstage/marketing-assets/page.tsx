
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useStorage, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    FolderOpen, 
    UploadCloud, 
    Image as ImageIcon, 
    FileText, 
    Video, 
    X, 
    Loader2, 
    Download, 
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type MarketingAsset = {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    category: 'lifestyle' | 'guidelines';
    userId: string;
    createdAt: any;
};

const CATEGORIES = [
    { id: 'lifestyle', label: 'Lifestyle Imagery', icon: ImageIcon, description: 'High-res photos for boutique banners and social campaigns.' },
    { id: 'guidelines', label: 'Brand Guidelines', icon: FileText, description: 'PDFs and videos detailing your brand vision and standards.' }
];

export default function MarketingAssetsPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'lifestyle' | 'guidelines'>('lifestyle');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch Assets
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'marketing_assets'), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: assets, loading: assetsLoading } = useCollection<MarketingAsset>(assetsQuery);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !user || !storage || !firestore) return;

        setIsUploading(true);
        const uploadPromises = Array.from(files).map(async (file) => {
            const assetId = crypto.randomUUID();
            const storagePath = `marketing/${user.uid}/${activeTab}/${assetId}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(snapshot.ref);

                await setDoc(doc(firestore, 'marketing_assets', assetId), {
                    fileName: file.name,
                    fileUrl: downloadUrl,
                    fileType: file.type,
                    category: activeTab,
                    userId: user.uid,
                    storagePath: storagePath,
                    createdAt: serverTimestamp()
                });

                return true;
            } catch (err) {
                console.error("Upload failed for file:", file.name, err);
                return false;
            }
        });

        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(Boolean).length;

        if (successCount > 0) {
            toast({
                title: 'Assets Secured',
                description: `Successfully uploaded ${successCount} marketing asset(s).`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not upload assets. Please check your connection.',
            });
        }

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (asset: MarketingAsset) => {
        if (!firestore || !storage) return;

        try {
            // Delete from Storage first
            const storageRef = ref(storage, (asset as any).storagePath);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(firestore, 'marketing_assets', asset.id));

            toast({ title: 'Asset Removed', description: `${asset.fileName} has been deleted.` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleUpload(e.dataTransfer.files);
    };

    const filteredAssets = assets?.filter(a => a.category === activeTab) || [];

    if (userLoading || profileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Brand Assets Portal</h1>
                <p className="mt-2 text-lg text-muted-foreground">Distribute premium lifestyle content to your global Mogul network.</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <TabsList className="bg-muted/50 border border-primary/20 h-auto p-1 grid grid-cols-2 w-full md:w-[400px]">
                        {CATEGORIES.map(cat => (
                            <TabsTrigger key={cat.id} value={cat.id} className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <cat.icon className="h-4 w-4 mr-2" />
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading}
                        className="btn-gold-glow bg-primary hover:bg-primary/90"
                    >
                        {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Upload New Content
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={(e) => handleUpload(e.target.files)} 
                    />
                </div>

                {CATEGORIES.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="space-y-8">
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <cat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">{cat.label}</h3>
                                <p className="text-sm text-slate-500">{cat.description}</p>
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div 
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={cn(
                                "relative min-h-[400px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12",
                                isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-slate-800 bg-slate-900/20",
                                filteredAssets.length > 0 && "py-8"
                            )}
                        >
                            <AnimatePresence>
                                {filteredAssets.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className="text-center space-y-4"
                                    >
                                        <div className="mx-auto h-20 w-20 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-6">
                                            <FolderOpen className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400">Empty Folder</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto">
                                            Drag and drop your brand assets here. Moguls will be able to download these to promote your products.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full h-full content-start">
                                        {filteredAssets.map((asset) => (
                                            <motion.div
                                                key={asset.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group relative flex flex-col items-center text-center space-y-3"
                                            >
                                                <div className="relative aspect-square w-full rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary/50 group-hover:bg-slate-800">
                                                    {asset.fileType.startsWith('image/') ? (
                                                        <img src={asset.fileUrl} className="h-full w-full object-cover opacity-80 group-hover:opacity-100" alt={asset.fileName} />
                                                    ) : asset.fileType.includes('pdf') ? (
                                                        <FileText className="h-12 w-12 text-red-400/60 group-hover:text-red-400" />
                                                    ) : asset.fileType.includes('video') ? (
                                                        <Video className="h-12 w-12 text-blue-400/60 group-hover:text-blue-400" />
                                                    ) : (
                                                        <FolderOpen className="h-12 w-12 text-slate-600" />
                                                    )}

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:text-primary" asChild>
                                                            <a href={asset.fileUrl} download={asset.fileName} target="_blank">
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:text-destructive" onClick={() => handleDelete(asset)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="w-full">
                                                    <p className="text-xs font-medium text-slate-400 truncate px-2" title={asset.fileName}>
                                                        {asset.fileName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">
                                                        {new Date(asset.createdAt?.toDate ? asset.createdAt.toDate() : asset.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            {isDragging && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-2xl pointer-events-none">
                                    <div className="flex flex-col items-center gap-2 text-primary animate-bounce">
                                        <UploadCloud className="h-12 w-12" />
                                        <span className="font-bold uppercase tracking-widest text-sm">Release to Upload</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <div className="flex items-center gap-3 p-4 bg-muted/20 border border-slate-800 rounded-lg text-slate-500 text-xs">
                <AlertCircle className="h-4 w-4" />
                <p>Assets uploaded here are visible to all Moguls. Professional guidelines and lifestyle shots significantly increase sync rates for your products.</p>
            </div>
        </div>
    );
}

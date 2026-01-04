
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUserProfile } from '@/firebase/user-profile-provider';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { GraduationCap, PlayCircle, Crown, Loader2, Check, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type TrainingModule = {
  id: string;
  title: string;
  duration: number;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Masterclass';
  thumbnailUrl: string;
  videoUrl: string;
};

const VideoCard = ({ video, onPlay, isWatched }: { video: TrainingModule, onPlay: () => void, isWatched: boolean }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 cursor-pointer"
            onClick={onPlay}
        >
            <Card className="bg-card">
                 <div className="relative w-full aspect-video">
                    {video.thumbnailUrl && <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" data-ai-hint="video thumbnail"/>}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all duration-300">
                        <PlayCircle className="h-16 w-16 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                    </div>
                    {isWatched && (
                         <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                            <Check className="h-4 w-4"/>
                        </div>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-lg truncate group-hover:text-primary">{video.title}</h3>
                    <p className="text-sm font-semibold text-primary">{video.duration} min</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default function TrainingCenterPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const { toast } = useToast();
    const router = useRouter();

    const trainingModulesRef = firestore ? collection(firestore, 'Training_Modules') : null;
    const { data: trainingModules, loading: modulesLoading } = useCollection<TrainingModule>(trainingModulesRef);
    
    const [selectedVideo, setSelectedVideo] = useState<TrainingModule | null>(null);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    
    const isLoading = profileLoading || modulesLoading;
    const canAccess = userProfile?.planTier === 'MOGUL' || userProfile?.planTier === 'SCALER' || userProfile?.planTier === 'ENTERPRISE';
    const completedLessons = userProfile?.completedLessons || [];

    const progress = useMemo(() => {
        if (!trainingModules || trainingModules.length === 0) return 0;
        return (completedLessons.length / trainingModules.length) * 100;
    }, [completedLessons, trainingModules]);

    const categories = useMemo(() => {
        if (!trainingModules) return [];
        return Array.from(new Set(trainingModules.map(v => v.category)));
    }, [trainingModules]);

    const handlePlayVideo = (video: TrainingModule) => {
        // This check is a bit redundant since we gate the whole page, but good for defense-in-depth
        if (!canAccess) {
            setShowUpgradeDialog(true);
            return;
        }
        setSelectedVideo(video);
    };

    const handleMarkAsComplete = async (videoId: string) => {
        if (!user || !firestore || completedLessons.includes(videoId)) return;

        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                completedLessons: arrayUnion(videoId)
            });
            toast({
                title: 'Lesson Completed!',
                description: 'Your progress has been saved.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save your progress. Please try again.',
            });
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!canAccess) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="max-w-lg text-center p-8 border-primary bg-primary/10">
                    <Crown className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold font-headline text-primary">Unlock the Mogul Academy</h2>
                    <p className="text-muted-foreground mt-2 mb-6">Gain exclusive access to masterclass tutorials, traffic secrets, and conversion strategies by upgrading your plan.</p>
                    <Button onClick={() => router.push('/plan-selection')} className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                        Upgrade to Mogul
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <>
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="max-w-4xl bg-card border-primary p-0">
                   {selectedVideo && (
                       <>
                         <div className="aspect-video w-full">
                            <iframe 
                                src={selectedVideo.videoUrl} 
                                title={selectedVideo.title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                         <div className="p-6 space-y-4">
                             <DialogTitle className="text-2xl font-headline text-primary">{selectedVideo.title}</DialogTitle>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">{selectedVideo.category}</span> - {selectedVideo.difficulty}
                                </p>
                                {!completedLessons.includes(selectedVideo.id) && (
                                     <Button onClick={() => handleMarkAsComplete(selectedVideo.id)}>
                                        <Check className="mr-2 h-4 w-4" /> Mark as Completed
                                    </Button>
                                )}
                            </div>
                         </div>
                       </>
                   )}
                </DialogContent>
            </Dialog>

             <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <AlertDialogContent className="bg-card border-primary">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-primary font-headline text-2xl">Upgrade to Unlock</AlertDialogTitle>
                    <AlertDialogDescription>
                        Upgrade to a Mogul account to unlock this advanced lesson and all future content. Master the art of conversion and scale your empire.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/plan-selection')}>
                        Upgrade Now <ExternalLink className="ml-2 h-4 w-4"/>
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold font-headline">Mogul Training Center</h1>
                    </div>
                </div>

                <Card className="border-primary/50">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground mb-2">Course Progress</p>
                        <Progress value={progress} className="h-3 bg-muted border border-primary/20" />
                        <p className="text-sm text-right text-muted-foreground mt-2">{completedLessons.length} of {trainingModules?.length || 0} lessons completed</p>
                    </CardContent>
                </Card>

                <Accordion type="multiple" defaultValue={categories.map(c => c.toLowerCase().replace(/ /g, '-'))} className="w-full space-y-4">
                    {categories.map(category => (
                        <AccordionItem key={category} value={category.toLowerCase().replace(/ /g, '-')} className="border-b-0">
                            <Card className="border-primary/50 overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 bg-card hover:no-underline hover:bg-muted/50">
                                <h2 className="text-2xl font-bold font-headline">{category}</h2>
                            </AccordionTrigger>
                            <AccordionContent className="p-6">
                                {isLoading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {trainingModules?.filter(v => v.category === category).map(video => (
                                            <VideoCard 
                                                key={video.id} 
                                                video={video}
                                                onPlay={() => handlePlayVideo(video)}
                                                isWatched={completedLessons.includes(video.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </>
    );
}

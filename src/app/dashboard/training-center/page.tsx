'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { trainingVideos, type TrainingVideo } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GraduationCap, PlayCircle, Lock, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const VideoCard = ({ video, onPlay, isWatched, isLocked }: { video: TrainingVideo, onPlay: () => void, isWatched: boolean, isLocked: boolean }) => {
    const thumbnail = PlaceHolderImages.find(img => img.id === video.thumbnailId);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            className={cn("group relative rounded-lg overflow-hidden border-2 transition-all duration-300", isLocked ? "border-dashed border-border/50" : "border-transparent hover:border-primary")}
            onClick={onPlay}
        >
            <Card className={cn("bg-card", isLocked ? "cursor-not-allowed" : "cursor-pointer")}>
                 <div className="relative w-full aspect-video">
                    {thumbnail && <Image src={thumbnail.imageUrl} alt={video.title} fill className={cn("object-cover", isLocked && "grayscale")}/>}
                    <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", isLocked ? "bg-black/70" : "bg-black/40 group-hover:bg-black/20")}>
                        {isLocked ? (
                            <Lock className="h-12 w-12 text-white/50" />
                        ) : (
                            <PlayCircle className="h-16 w-16 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                        )}
                    </div>
                    {isWatched && !isLocked && (
                         <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                            <Check className="h-4 w-4"/>
                        </div>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className={cn("font-bold text-lg truncate", !isLocked && "group-hover:text-primary")}>{video.title}</h3>
                    <p className={cn("text-sm font-semibold", isLocked ? "text-muted-foreground" : "text-primary")}>{video.duration} min</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}

const LockedCertificateCard = ({ isUnlocked }: { isUnlocked: boolean }) => (
     <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn("relative rounded-lg overflow-hidden border-2 border-dashed", isUnlocked ? "border-primary cursor-pointer hover:shadow-2xl hover:shadow-primary/20" : "border-border/50")}
    >
        <Card className="bg-card text-center h-full flex flex-col items-center justify-center">
            <CardContent className="p-6">
                {isUnlocked ? (
                    <GraduationCap className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
                ) : (
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                )}
                <h3 className={cn("font-bold text-xl", isUnlocked && "text-primary")}>VIP Mogul Certificate</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    {isUnlocked ? "Congratulations! Download Your Certificate." : "Complete all lessons to unlock."}
                </p>
            </CardContent>
        </Card>
    </motion.div>
);


export default function TrainingCenterPage() {
    const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile } = useDoc(userDocRef);

    const userPlan = userProfile?.plan || 'monthly'; // Default to monthly for safety
    const isLifetime = userPlan === 'lifetime';

    const handlePlayVideo = (video: TrainingVideo, isLocked: boolean) => {
        if (isLocked) {
            setShowUpgradeDialog(true);
            return;
        }
        if (!watchedVideos.includes(video.id)) {
            setWatchedVideos(prev => [...prev, video.id]);
        }
    };
    
    const totalVideos = trainingVideos.length;
    const progress = (watchedVideos.length / totalVideos) * 100;
    const allLessonsCompleted = watchedVideos.length === totalVideos;

    const categories = Array.from(new Set(trainingVideos.map(v => v.category)));

    const isCategoryLocked = (category: string) => {
        if (isLifetime) return false;
        return category === 'Conversion: Turning Visitors into Buyers';
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <GraduationCap className="h-8 w-8 text-primary" />
                     <h1 className="text-3xl font-bold font-headline">Mogul Training Center</h1>
                </div>
                {isLifetime && (
                    <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Crown className="mr-2 h-5 w-5"/>
                        1-on-1 Support
                    </Button>
                )}
            </div>

            <Card className="border-primary/50">
                <CardContent className="p-6">
                    <p className="text-muted-foreground mb-2">Course Progress</p>
                    <Progress value={progress} className="h-3 bg-muted border border-primary/20" />
                    <p className="text-sm text-right text-muted-foreground mt-2">{watchedVideos.length} of {totalVideos} lessons completed</p>
                </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={categories.map(c => c.toLowerCase().replace(/ /g, '-'))} className="w-full space-y-4">
                 {categories.map(category => {
                    const isLocked = isCategoryLocked(category);
                    return (
                        <AccordionItem key={category} value={category.toLowerCase().replace(/ /g, '-')} className="border-b-0">
                            <Card className="border-primary/50 overflow-hidden">
                               <AccordionTrigger className="px-6 py-4 bg-card hover:no-underline hover:bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        {isLocked && <Lock className="h-5 w-5 text-primary" />}
                                        <h2 className="text-2xl font-bold font-headline">{category}</h2>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {trainingVideos.filter(v => v.category === category).map(video => (
                                                <VideoCard 
                                                    key={video.id} 
                                                    video={video}
                                                    onPlay={() => handlePlayVideo(video, isLocked)}
                                                    isWatched={watchedVideos.includes(video.id)}
                                                    isLocked={isLocked}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    )
                })}
                
                <AccordionItem value="certificate" className="border-b-0">
                     <Card className="border-primary/50 overflow-hidden">
                           <AccordionTrigger className="px-6 py-4 bg-card hover:no-underline hover:bg-muted/50">
                                <h2 className="text-2xl font-bold font-headline">Course Completion</h2>
                            </AccordionTrigger>
                            <AccordionContent className="p-6">
                               <LockedCertificateCard isUnlocked={allLessonsCompleted && isLifetime} />
                           </AccordionContent>
                     </Card>
                </AccordionItem>
            </Accordion>
            
            <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <AlertDialogContent className="bg-card border-primary">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="text-primary font-headline text-2xl">Upgrade to Unlock</AlertDialogTitle>
                    <AlertDialogDescription>
                        Upgrade to a Lifetime Mogul account to unlock this advanced lesson and all future content. Master the art of conversion and scale your empire.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/plan-selection?from=training')}>
                        Upgrade Now
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

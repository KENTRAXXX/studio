'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { trainingVideos, type TrainingVideo } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GraduationCap, PlayCircle, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const VideoCard = ({ video, onPlay, isWatched }: { video: TrainingVideo, onPlay: () => void, isWatched: boolean }) => {
    const thumbnail = PlaceHolderImages.find(img => img.id === video.thumbnailId);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -5 }}
            className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300"
            onClick={onPlay}
        >
            <Card className="bg-card cursor-pointer">
                 <div className="relative w-full aspect-video">
                    {thumbnail && <Image src={thumbnail.imageUrl} alt={video.title} fill className="object-cover" />}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
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
                    <p className="text-sm text-primary font-semibold">{video.duration} min</p>
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

    const handlePlayVideo = (videoId: string) => {
        if (!watchedVideos.includes(videoId)) {
            setWatchedVideos(prev => [...prev, videoId]);
        }
    };
    
    const totalVideos = trainingVideos.length;
    const progress = (watchedVideos.length / totalVideos) * 100;
    const allLessonsCompleted = watchedVideos.length === totalVideos;

    const categories = Array.from(new Set(trainingVideos.map(v => v.category)));

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <GraduationCap className="h-8 w-8 text-primary" />
                 <h1 className="text-3xl font-bold font-headline">Mogul Training Center</h1>
            </div>

            <Card className="border-primary/50">
                <CardContent className="p-6">
                    <p className="text-muted-foreground mb-2">Course Progress</p>
                    <Progress value={progress} className="h-3 bg-muted border border-primary/20" />
                    <p className="text-sm text-right text-muted-foreground mt-2">{watchedVideos.length} of {totalVideos} lessons completed</p>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {trainingVideos.filter(v => v.category === category).map(video => (
                                            <VideoCard 
                                                key={video.id} 
                                                video={video}
                                                onPlay={() => handlePlayVideo(video.id)}
                                                isWatched={watchedVideos.includes(video.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
                
                <AccordionItem value="certificate" className="border-b-0">
                     <Card className="border-primary/50 overflow-hidden">
                           <AccordionTrigger className="px-6 py-4 bg-card hover:no-underline hover:bg-muted/50">
                                <h2 className="text-2xl font-bold font-headline">Course Completion</h2>
                            </AccordionTrigger>
                            <AccordionContent className="p-6">
                               <LockedCertificateCard isUnlocked={allLessonsCompleted} />
                           </AccordionContent>
                     </Card>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

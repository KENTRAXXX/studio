"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, DollarSign, Package, ShieldCheck, Banknote } from "lucide-react";

export type TickerEvent = {
  icon: React.ReactNode;
  text: string;
};

const defaultEvents: TickerEvent[] = [
  {
    icon: <Clock className="h-4 w-4 text-primary" />,
    text: "2 mins ago: New store 'GoldVibe' launched in Lagos.",
  },
  {
    icon: <DollarSign className="h-4 w-4 text-green-400" />,
    text: "5 mins ago: $240.00 sale processed for 'EliteWatches' store.",
  },
  {
    icon: <Package className="h-4 w-4 text-blue-400" />,
    text: "12 mins ago: 15 new Luxury Handbags added to the Master Catalog.",
  },
  {
    icon: <Clock className="h-4 w-4 text-primary" />,
    text: "18 mins ago: New store 'Aura Jewels' launched in Paris.",
  },
  {
    icon: <DollarSign className="h-4 w-4 text-green-400" />,
    text: "25 mins ago: $890.00 sale processed for 'Timepiece Emporium'.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-yellow-400" />,
    text: "31 mins ago: New Brand 'Atelier Luxe' joined as a Verified Supplier.",
  },
  {
    icon: <DollarSign className="h-4 w-4 text-green-400" />,
    text: "35 mins ago: $1,250.00 sale processed for 'The Gilded Cage' store in Dubai.",
  },
  {
    icon: <Package className="h-4 w-4 text-blue-400" />,
    text: "42 mins ago: 5 new Diamond Necklaces added to the Master Catalog.",
  },
  {
    icon: <Banknote className="h-4 w-4 text-indigo-400" />,
    text: "48 mins ago: Payout of $2,300.00 sent to a Mogul in New York.",
  },
  {
    icon: <Clock className="h-4 w-4 text-primary" />,
    text: "55 mins ago: New store 'CoutureHaus' launched in Berlin.",
  },
];

const TickerItem = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div className="flex items-center gap-3 mx-6 shrink-0">
    {icon}
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

interface LiveFeedTickerProps {
  events?: TickerEvent[];
  className?: string;
}

export function LiveFeedTicker({ events = defaultEvents, className }: LiveFeedTickerProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className={cn("relative w-full overflow-hidden bg-background border-y border-primary/20 py-4", className)}>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10"></div>
      <motion.div
        className="flex"
        animate={{
          x: ["0%", "-100%"],
        }}
        transition={{
          ease: "linear",
          duration: Math.max(20, events.length * 8), // Dynamic speed based on content
          repeat: Infinity,
        }}
      >
        {/* Render the list twice for a seamless loop */}
        <div className="flex shrink-0">
            {events.map((event, index) => (
                <TickerItem key={index} {...event} />
            ))}
        </div>
        <div className="flex shrink-0">
            {events.map((event, index) => (
                <TickerItem key={`duplicate-${index}`} {...event} />
            ))}
        </div>
      </motion.div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10"></div>
    </div>
  );
}

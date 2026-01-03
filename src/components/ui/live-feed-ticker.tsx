"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, DollarSign, Package } from "lucide-react";

const events = [
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

export function LiveFeedTicker() {
  return (
    <div className="relative w-full overflow-hidden bg-background border-y border-primary/20 py-4">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10"></div>
      <motion.div
        className="flex"
        animate={{
          x: ["0%", "-100%"],
        }}
        transition={{
          ease: "linear",
          duration: 40,
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

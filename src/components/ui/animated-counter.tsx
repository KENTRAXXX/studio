"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function AnimatedCounter({
  from = 0,
  to,
  isInView,
  formatOptions,
}: {
  from?: number;
  to: number;
  isInView: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}) {
  const count = useMotionValue(from);
  const rounded = useSpring(count, {
    stiffness: 100,
    damping: 40, // Increased damping for a smoother, slower stop
    restDelta: 0.001,
  });
  const ref = useRef<HTMLSpanElement>(null);
  const internalIsInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

  const effectiveIsInView = isInView !== undefined ? isInView : internalIsInView;

  useEffect(() => {
    if (effectiveIsInView) {
      count.set(to);
    }
  }, [count, to, effectiveIsInView]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toLocaleString(undefined, formatOptions);
      }
    });
    return unsubscribe;
  }, [rounded, formatOptions]);

  return <span ref={ref} />;
}

    
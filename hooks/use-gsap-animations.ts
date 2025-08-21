"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGSAPAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return ref;
}

export function useGSAPTimeline(dependencies: unknown[] = []) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(
    () => {
      timelineRef.current = gsap.timeline();

      return () => {
        timelineRef.current?.kill();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(dependencies) ? dependencies : []
  );

  return timelineRef.current;
}

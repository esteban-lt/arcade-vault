"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = ".reveal";
const REVEALED_CLASS_NAME = "in";
const VISIBILITY_THRESHOLD = 0.12;

/**
 * Adds the "in" class to every `.reveal` element inside the returned ref's
 * container the first time it enters the viewport.
 */
export function useReveal<ContainerElement extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<ContainerElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(REVEALED_CLASS_NAME);
          observer.unobserve(entry.target);
        });
      },
      { threshold: VISIBILITY_THRESHOLD },
    );

    container.querySelectorAll(REVEAL_SELECTOR).forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

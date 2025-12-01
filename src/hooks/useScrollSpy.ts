"use client";

import { useEffect, useState } from "react";

export function useScrollSpy(ids: string[], rootMargin = "-20% 0px -70% 0px") {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          } else if (entry.target.id === active) {
            // If the active section is no longer intersecting, clear it
            // But only if we're scrolling up (section is below viewport)
            const rect = entry.boundingClientRect;
            if (rect.top > 0) {
              setActive("");
            }
          }
        });
      },
      { rootMargin, threshold: 0.1 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids, rootMargin, active]);

  return active;
}



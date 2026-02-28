"use client";

import { useEffect, useRef, useState } from "react";

type CategoryNavProps = {
  categories: { key: string; label: string; emoji: string }[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mostrar la barra cuando el usuario pasa el hero (primer scroll)
  useEffect(() => {
    const heroSection = document.querySelector("section");
    if (!heroSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(heroSection);
    return () => observer.disconnect();
  }, []);

  // Detectar qué categoría está en el viewport
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach(({ key }) => {
      const el = document.getElementById(key);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategory(key);
          }
        },
        {
          rootMargin: "-20% 0px -70% 0px",
          threshold: 0,
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  const scrollToCategory = (key: string) => {
    const el = document.getElementById(key);
    if (!el) return;
    const offset = 80; // altura de la barra sticky
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveCategory(key);

    // Centrar el pill activo en la barra horizontal
    if (scrollRef.current) {
      const pill = scrollRef.current.querySelector(`[data-key="${key}"]`) as HTMLElement;
      if (pill) {
        const containerWidth = scrollRef.current.offsetWidth;
        const pillLeft = pill.offsetLeft;
        const pillWidth = pill.offsetWidth;
        scrollRef.current.scrollTo({
          left: pillLeft - containerWidth / 2 + pillWidth / 2,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-lg shadow-black/50">
        <div
          ref={scrollRef}
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map(({ key, label, emoji }) => (
            <button
              key={key}
              data-key={key}
              onClick={() => scrollToCategory(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                activeCategory === key
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/40"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

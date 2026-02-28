"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Clock, ChevronDown } from "lucide-react";

const KEYFRAMES = `
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bg-reveal {
  from { opacity: 0; transform: scale(1.06); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes scroll-bounce {
  0%,100% { transform: translateX(-50%) translateY(0);    opacity: .5; }
  50%      { transform: translateX(-50%) translateY(6px); opacity: 1;  }
}
`;

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1800&auto=format&fit=crop&q=85";

interface HeroBurgerProps {
  /** URL de la foto de fondo (full bleed). Por defecto Unsplash; podés usar /images/burger-hero.png o otra. */
  backgroundSrc?: string;
}

export function HeroBurger({ backgroundSrc = DEFAULT_BG }: HeroBurgerProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [bgVisible, setBgVisible] = useState(false);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBgVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const bgShowing = bgVisible && heroInView;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden bg-zinc-950"
      >
        {/* FONDO: foto profesional completa — empieza invisible, aparece con animación */}
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: bgShowing ? 1 : 0,
            transition: "opacity 1.4s cubic-bezier(.4,0,.2,1)",
          }}
        >
          <Image
            src={backgroundSrc}
            alt=""
            fill
            priority
            className="object-cover"
            style={{
              animation: bgShowing ? "bg-reveal 1.6s cubic-bezier(.4,0,.2,1) both" : "none",
              objectPosition: "60% center",
            }}
            sizes="100vw"
          />
        </div>

        {/* Gradiente horizontal: oscuro a la izquierda (texto), transparente a la derecha (burger) */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/20" />

        {/* Gradiente vertical: funde arriba y abajo */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950/50 via-transparent to-zinc-950/90" />

        {/* CONTENIDO */}
        <div className="relative z-20 mx-auto w-full max-w-6xl px-6 py-32">
          <div className="max-w-xl">
            <div style={{ animation: "hero-fade-up .6s .05s ease both", opacity: 0 }}>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-400">
                <Zap className="h-3.5 w-3.5" />
                ENVÍO GRATIS a partir de $5.000
              </span>
            </div>

            <h1
              className="mb-5 text-6xl font-black leading-[.95] tracking-tight text-white md:text-7xl xl:text-8xl"
              style={{ animation: "hero-fade-up .7s .15s ease both", opacity: 0 }}
            >
              LAS MEJORES
              <br />
              <span className="text-orange-500">BURGERS</span>
              <br />
              <span className="text-5xl md:text-6xl xl:text-7xl">de la ciudad</span>
            </h1>

            <p
              className="mb-8 max-w-sm text-lg leading-relaxed text-zinc-300"
              style={{ animation: "hero-fade-up .7s .25s ease both", opacity: 0 }}
            >
              Ingredientes premium, recetas únicas. Carne fresca y panes
              horneados todos los días.
            </p>

            <div
              className="mb-10 flex flex-wrap gap-2"
              style={{ animation: "hero-fade-up .7s .35s ease both", opacity: 0 }}
            >
              {[
                { icon: Clock, text: "30–45 min" },
                { icon: Shield, text: "Pago seguro" },
                { icon: Zap, text: "Sin cargo extra" },
              ].map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-zinc-200 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-orange-400" />
                  {text}
                </span>
              ))}
            </div>

            <div style={{ animation: "hero-fade-up .7s .45s ease both", opacity: 0 }}>
              <Button
                asChild
                size="lg"
                className="bg-orange-600 px-10 py-6 text-lg font-black tracking-wide transition-colors hover:bg-orange-500"
              >
                <a href="#menu">VER MENÚ COMPLETO</a>
              </Button>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 z-20"
          style={{ animation: "scroll-bounce 2s ease-in-out infinite" }}
        >
          <ChevronDown className="h-6 w-6 text-zinc-400" />
        </div>
      </section>
    </>
  );
}

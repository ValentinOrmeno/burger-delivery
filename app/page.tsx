import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";
import { ProductCard } from "@/components/product-card";
import { FloatingCart } from "@/components/floating-cart";
import { SiteFooter } from "@/components/site-footer";
import { CategoryNav } from "@/components/category-nav";
import { whatsappUrl } from "@/lib/store-config";
import Image from "next/image";
import { ChevronDown, Clock, Zap, Star, Shield } from "lucide-react";

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching products:', error.message || error.code || String(error));
      return [];
    }

    return data || [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error fetching products:', message);
    return [];
  }
}

// Emojis por categoría para la barra de navegación
const categoryEmojis: Record<string, string> = {
  promos: '🔥',
  featured: '⭐',
  burger: '🍔',
  veggie: '🥗',
  bondiolita: '🥩',
  pancho: '🌭',
  sides: '🍟',
  dessert: '🍰',
};

export default async function HomePage() {
  const products = await getProducts();

  // Productos en promoción (arriba de todo)
  const promoProducts = products.filter(p => p.promo_active);

  // Separar productos destacados usando el campo is_featured de la DB
  // (que no estén ya en promos para no duplicar)
  const featuredProducts = products.filter(p =>
    p.is_featured && !p.promo_active
  );

  // Hamburguesas normales (no destacadas, no en promo)
  const regularBurgers = products.filter(p =>
    p.category === 'burger' && !p.is_featured && !p.promo_active
  );

  // Agrupar resto de productos por categoría (sin duplicar los que están en promos)
  const productsByCategory: Record<string, Product[]> = {
    promos: promoProducts,
    featured: featuredProducts,
    burger: regularBurgers,
    veggie: products.filter(p => p.category === 'veggie' && !p.promo_active),
    bondiolita: products.filter(p => p.category === 'bondiolita' && !p.promo_active),
    pancho: products.filter(p => p.category === 'pancho' && !p.promo_active),
    sides: products.filter(p => p.category === 'sides' && !p.promo_active),
    dessert: products.filter(p => p.category === 'dessert' && !p.promo_active),
  };

  const categoryTitles: Record<string, string> = {
    promos: 'Promociones',
    featured: 'Destacadas de la Casa',
    burger: 'Hamburguesas Clásicas',
    veggie: 'Opciones Veggie',
    bondiolita: 'Bondiolitas',
    pancho: 'Panchos Alemanes',
    sides: 'Acompañamientos',
    dessert: 'Postres',
  };

  const categoryOrder = ['promos', 'featured', 'burger', 'veggie', 'bondiolita', 'pancho', 'sides', 'dessert'];

  // Solo las categorías que tienen productos (para la barra de navegación)
  const activeCategories = categoryOrder
    .filter(key => productsByCategory[key]?.length > 0)
    .map(key => ({
      key,
      label: categoryTitles[key],
      emoji: categoryEmojis[key] ?? '•',
    }));

  return (
    <main className="min-h-screen">
      {/* Barra de navegación sticky por categorías */}
      <CategoryNav categories={activeCategories} />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80"
            alt="Hero burger"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-zinc-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-600/5 to-transparent animate-pulse" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex animate-bounce items-center gap-2 rounded-full bg-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-600/50">
            <Star className="h-4 w-4 fill-current" />
            ENVÍO GRATIS en pedidos +$20.000
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            LAS MEJORES
            <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              BURGERS
            </span>
            <span className="block text-3xl text-zinc-300 sm:text-4xl md:text-5xl">de la ciudad</span>
          </h1>

          <p className="mb-8 text-base font-semibold text-zinc-300 sm:text-lg md:text-xl">
            🔥 Ingredientes premium · Preparación artesanal · Delivery rápido
          </p>

          <div className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-white">Entrega 30-45 min</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-white">Pago seguro</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="font-semibold text-white">Confirmación instantánea</span>
            </div>
          </div>

          <a
            href="#menu"
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-5 text-lg font-black text-white shadow-2xl shadow-orange-600/50 ring-2 ring-orange-400/50 transition-all duration-300 hover:scale-105 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-600/70 hover:ring-orange-300 sm:px-12 sm:py-6 sm:text-xl"
          >
            VER MENÚ COMPLETO
            <ChevronDown className="h-6 w-6 shrink-0 transition-transform group-hover:translate-y-1 sm:h-7 sm:w-7" />
          </a>

          <p className="mt-6 text-sm text-zinc-500">
            ⚡ Pedidos online con{" "}
            <span className="font-bold text-orange-500">personalización total</span>
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="rounded-full bg-orange-600/20 p-2 backdrop-blur-sm">
            <ChevronDown className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="bg-zinc-950 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Header del menú */}
          <div className="mb-12 text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-600/10 px-4 py-2 text-sm font-bold text-orange-500">
              <Star className="h-4 w-4 fill-current" />
              MENÚ COMPLETO
            </div>
            <h2 className="mb-4 bg-gradient-to-r from-white via-zinc-200 to-white bg-clip-text text-4xl font-black text-transparent sm:text-5xl md:text-6xl">
              Nuestras Creaciones
            </h2>
            <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg md:text-xl">
              Cada burger es una obra maestra. Personalizá tu experiencia y disfrutá
              de sabores únicos.
            </p>
          </div>

          {/* Productos por categoría */}
          <div className="space-y-16 sm:space-y-20 lg:space-y-24">
            {categoryOrder.map((category) => {
              const items = productsByCategory[category];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category} id={category} className="scroll-mt-20">
                  {/* Header de categoría */}
                  <div className="mb-8 text-center sm:mb-10">
                    <div className="inline-block">
                      <h3 className="relative text-3xl font-black text-orange-600 sm:text-4xl md:text-5xl">
                        {categoryEmojis[category]} {categoryTitles[category]}
                        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent sm:-bottom-2" />
                      </h3>
                    </div>
                    {category === "promos" && (
                      <p className="mt-4 text-base font-semibold text-zinc-400 sm:mt-6 sm:text-lg">
                        Precios especiales por tiempo limitado
                      </p>
                    )}
                    {category === "featured" && (
                      <p className="mt-4 text-base font-semibold text-zinc-400 sm:mt-6 sm:text-lg">
                        🔥 Nuestras hamburguesas especiales con{" "}
                        <span className="text-orange-500">papas fritas incluidas</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Grid de productos */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product}
                        isFeatured={category === 'featured'}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-xl text-zinc-500">
                No hay productos disponibles en este momento.
              </p>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />

      {/* Botón WhatsApp flotante — solo ícono con tooltip */}
      <a
        href={whatsappUrl("Hola! Tengo una consulta sobre mi pedido / el menu.")}
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:border-green-600 hover:bg-zinc-800"
        aria-label="Escribinos por WhatsApp si tenés dudas"
      >
        {/* Ícono WhatsApp SVG */}
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-green-400 transition-colors group-hover:fill-green-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {/* Tooltip */}
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          ¿Dudas? Escribinos
        </span>
      </a>

      {/* Floating Cart */}
      <FloatingCart />
    </main>
  );
}

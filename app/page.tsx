import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";
import { ProductCard } from "@/components/product-card";
import { FloatingCart } from "@/components/floating-cart";
import { SiteFooter } from "@/components/site-footer";
import { whatsappUrl } from "@/lib/store-config";
import { ChevronDown, Clock, Truck, Star, Shield } from "lucide-react";
import Image from "next/image";

// Productos destacados (especiales de la imagen)
const FEATURED_PRODUCTS = [
  'Fresh',
  'Stacker', 
  'Bomba de Libra',
  'American B',
  'Crispy',
  'Criolla',
  'Barba Hot',
  'Napolitana',
  'Fried Onion'
];

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

export default async function HomePage() {
  const products = await getProducts();

  // Productos en promoción (arriba de todo)
  const promoProducts = products.filter(p => p.promo_active);

  // Separar productos destacados (que no estén ya en promos para no duplicar en featured)
  const featuredProducts = products.filter(p => 
    p.category === 'burger' && FEATURED_PRODUCTS.includes(p.name) && !p.promo_active
  );

  // Hamburguesas normales (no destacadas)
  const regularBurgers = products.filter(p => 
    p.category === 'burger' && !FEATURED_PRODUCTS.includes(p.name) && !p.promo_active
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

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Imagen de fondo con overlay animado */}
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
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-600/5 to-transparent animate-pulse" />
        </div>

        {/* Contenido del hero */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
          {/* Badge de promo */}
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

          {/* Badges de beneficios */}
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
              <Truck className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-white">Seguimiento en tiempo real</span>
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

        {/* Scroll indicator */}
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
                <div key={category} id={category} className="scroll-mt-24">
                  {/* Header de categoría */}
                  <div className="mb-8 text-center sm:mb-10">
                    <div className="inline-block">
                      <h3 className="relative text-3xl font-black text-orange-600 sm:text-4xl md:text-5xl">
                        {categoryTitles[category]}
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

      {/* CTA Dudas por WhatsApp - siempre visible */}
      <a
        href={whatsappUrl("Hola! Tengo una consulta sobre mi pedido / el menu.")}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-green-400 shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-800 hover:text-green-300"
        aria-label="Escribinos por WhatsApp si tenes dudas"
      >
        <span className="text-lg">💬</span>
        Dudas? Escribinos por WhatsApp
      </a>

      {/* Floating Cart */}
      <FloatingCart />
    </main>
  );
}

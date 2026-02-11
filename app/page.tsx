import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";
import { ProductCard } from "@/components/product-card";
import { FloatingCart } from "@/components/floating-cart";
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
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true);

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

export default async function HomePage() {
  const products = await getProducts();

  // Separar productos destacados
  const featuredProducts = products.filter(p => 
    p.category === 'burger' && FEATURED_PRODUCTS.includes(p.name)
  );

  // Hamburguesas normales (no destacadas)
  const regularBurgers = products.filter(p => 
    p.category === 'burger' && !FEATURED_PRODUCTS.includes(p.name)
  );

  // Agrupar resto de productos por categoría
  const productsByCategory: Record<string, Product[]> = {
    featured: featuredProducts,
    burger: regularBurgers,
    veggie: products.filter(p => p.category === 'veggie'),
    bondiolita: products.filter(p => p.category === 'bondiolita'),
    pancho: products.filter(p => p.category === 'pancho'),
    sides: products.filter(p => p.category === 'sides'),
    dessert: products.filter(p => p.category === 'dessert'),
  };

  const categoryTitles: Record<string, string> = {
    featured: 'Destacadas de la Casa',
    burger: 'Hamburguesas Clásicas',
    veggie: 'Opciones Veggie',
    bondiolita: 'Bondiolitas',
    pancho: 'Panchos Alemanes',
    sides: 'Acompañamientos',
    dessert: 'Postres',
  };

  const categoryOrder = ['featured', 'burger', 'veggie', 'bondiolita', 'pancho', 'sides', 'dessert'];

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

          <h1 className="mb-6 text-6xl font-black leading-tight tracking-tight text-white md:text-8xl lg:text-9xl">
            LAS MEJORES
            <span className="block bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              BURGERS
            </span>
            <span className="block text-5xl text-zinc-300 md:text-6xl">de la ciudad</span>
          </h1>
          
          <p className="mb-8 text-xl font-semibold text-zinc-300 md:text-2xl">
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
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-10 py-5 text-xl font-black text-white shadow-2xl shadow-orange-600/50 transition-all duration-300 hover:scale-105 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-600/70"
          >
            VER MENÚ COMPLETO
            <ChevronDown className="h-6 w-6 transition-transform group-hover:translate-y-1" />
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
      <section id="menu" className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header del menú mejorado */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-600/10 px-4 py-2 text-sm font-bold text-orange-500">
              <Star className="h-4 w-4 fill-current" />
              MENÚ COMPLETO
            </div>
            <h2 className="mb-4 bg-gradient-to-r from-white via-zinc-200 to-white bg-clip-text text-6xl font-black text-transparent">
              Nuestras Creaciones
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              Cada burger es una obra maestra. Personalizá tu experiencia y disfrutá
              de sabores únicos.
            </p>
          </div>

          {/* Productos por categoría en orden específico */}
          <div className="space-y-24">
            {categoryOrder.map((category) => {
              const items = productsByCategory[category];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category} id={category} className="scroll-mt-20">
                  {/* Header de categoría mejorado */}
                  <div className="mb-10 text-center">
                    <div className="mb-4 inline-block">
                      <h3 className="relative text-5xl font-black text-orange-600">
                        {categoryTitles[category]}
                        {/* Underline decorativo */}
                        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent" />
                      </h3>
                    </div>
                    {category === 'featured' && (
                      <p className="mt-6 text-lg font-semibold text-zinc-400">
                        🔥 Nuestras hamburguesas especiales con{" "}
                        <span className="text-orange-500">papas fritas incluidas</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Grid de productos con mejor espaciado */}
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* Floating Cart */}
      <FloatingCart />
    </main>
  );
}

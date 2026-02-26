"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, type Extra } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/supabase";
import { toast } from "sonner";
import { ProductCustomizer } from "./product-customizer";

interface ProductCardProps {
  product: Product;
  isFeatured?: boolean;
}

const categoryLabels: Record<Product['category'], string> = {
  burger: 'Hamburguesa',
  veggie: 'Veggie',
  bondiolita: 'Bondiolita',
  pancho: 'Pancho',
  sides: 'Acompañamiento',
  dessert: 'Postre',
};

// Categorías que permiten personalización
const customizableCategories = ['burger', 'veggie', 'bondiolita'];

// Productos que incluyen papas
const includesFries = ['burger', 'veggie', 'bondiolita'];

export function ProductCard({ product, isFeatured = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  const isCustomizable = customizableCategories.includes(product.category);

  const handleAddToCart = () => {
    if (isCustomizable) {
      // Abrir el customizer
      setShowCustomizer(true);
    } else {
      // Agregar directo al carrito
      addItem(product, 1, []);
      toast.success(`${product.name} agregado al carrito`, {
        duration: 2000,
      });
    }
  };

  const handleCustomizedAddToCart = (
    product: Product,
    quantity: number,
    extras: Extra[]
  ) => {
    addItem(product, quantity, extras);
    toast.success(`${product.name} agregado al carrito`, {
      duration: 2000,
    });
  };

  return (
    <>
      <Card className="group relative overflow-hidden border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-600/30">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay con gradiente más fuerte */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          {/* Efecto de brillo al hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:via-orange-500/20 group-hover:opacity-100" />
          
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            <Badge className="bg-orange-600 text-xs font-bold text-white shadow-lg">
              {categoryLabels[product.category]}
            </Badge>
            {isFeatured && (
              <Badge className="animate-pulse bg-yellow-500 text-xs font-bold text-zinc-950 shadow-lg">
                ⭐ DE LA CASA
              </Badge>
            )}
          </div>

          {/* Badge de personalizable */}
          {isCustomizable && (
            <Badge className="absolute right-3 top-3 bg-green-600 text-xs font-bold text-white shadow-lg">
              ✨ Personalizable
            </Badge>
          )}

          {/* Badge "Incluye papas" visible en la imagen */}
          {includesFries.includes(product.category) && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-zinc-950/80 text-xs font-semibold text-orange-400 backdrop-blur-sm">
                🍟 Incluye papas fritas
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Nombre del producto - jerarquia principal */}
          <h3 className={`font-black leading-tight text-white ${isFeatured ? "text-2xl" : "text-xl"}`}>
            {product.name}
          </h3>

          {/* Descripcion - secundaria, menos peso visual */}
          <p className="text-sm leading-relaxed text-zinc-500 line-clamp-2">
            {product.description}
          </p>

          {/* Precio - destacado, facil de leer */}
          <div className="rounded-lg border border-orange-600/30 bg-orange-600/15 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-orange-400">
                {product.promo_active ? "Promo" : isCustomizable ? "Desde" : "Precio"}
              </span>
              <div className="text-right">
                {product.promo_active && product.promo_price && (
                  <span className="mr-2 text-sm font-medium text-zinc-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-2xl font-black tabular-nums text-orange-400">
                  {formatPrice(product.promo_active && product.promo_price ? product.promo_price : product.price)}
                </span>
              </div>
            </div>
            {(product.promo_active && (product.promo_only_cash || product.promo_only_pickup)) && (
              <p className="mt-1.5 text-xs text-zinc-500">
                {product.promo_only_cash && product.promo_only_pickup && "Válida solo efectivo y retiro en local"}
                {product.promo_only_cash && !product.promo_only_pickup && "Válida solo en efectivo"}
                {!product.promo_only_cash && product.promo_only_pickup && "Válida solo retiro en local"}
              </p>
            )}
          </div>

          {/* Botón de acción mejorado */}
          <Button
            onClick={handleAddToCart}
            className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 py-6 font-bold text-white shadow-lg transition-all duration-300 hover:from-orange-500 hover:to-orange-600 hover:shadow-xl hover:shadow-orange-600/50 disabled:from-zinc-800 disabled:to-zinc-900"
            disabled={!product.is_available}
          >
            {/* Efecto de brillo en el botón */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
            
            <Plus className="mr-2 h-5 w-5 transition-transform group-hover/btn:rotate-90" />
            {product.is_available 
              ? (isCustomizable ? 'PERSONALIZAR Y AGREGAR' : 'AGREGAR AL CARRITO')
              : 'NO DISPONIBLE'
            }
          </Button>
        </CardContent>
      </Card>

      {/* Modal de personalización */}
      {isCustomizable && (
        <ProductCustomizer
          product={product}
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          onAddToCart={handleCustomizedAddToCart}
        />
      )}
    </>
  );
}

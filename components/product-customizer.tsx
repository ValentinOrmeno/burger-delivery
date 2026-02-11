"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/supabase";
import Image from "next/image";

type Addon = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  applicable_to: string[];
};

type SelectedAddon = {
  addon: Addon;
  quantity: number;
};

interface ProductCustomizerProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, extras: SelectedAddon[]) => void;
}

export function ProductCustomizer({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductCustomizerProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<Addon | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar addons disponibles
  useEffect(() => {
    const loadAddons = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("addons")
        .select("*")
        .eq("is_available", true)
        .contains("applicable_to", [product.category]);

      if (!error && data) {
        setAddons(data);
        
        // Seleccionar "Simple" por defecto si hay tamaños
        const simpleSize = data.find(
          (a) => a.category === "size" && a.name === "Simple"
        );
        if (simpleSize) {
          setSelectedSize(simpleSize);
        }
      }
      setLoading(false);
    };

    if (isOpen) {
      loadAddons();
    }
  }, [isOpen, product.category]);

  // Agrupar addons por categoría
  const addonsByCategory = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) {
      acc[addon.category] = [];
    }
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  const categoryLabels: Record<string, string> = {
    size: "Tamaño",
    meat: "Medallones Extra",
    topping: "Toppings Adicionales",
    fries: "Personaliza tus Papas",
    sauce: "Salsas Extra",
  };

  // Agregar/quitar addon
  const toggleAddon = (addon: Addon) => {
    if (addon.category === "size") {
      setSelectedSize(addon);
      return;
    }

    const existing = selectedAddons.find((a) => a.addon.id === addon.id);
    if (existing) {
      setSelectedAddons(selectedAddons.filter((a) => a.addon.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, { addon, quantity: 1 }]);
    }
  };

  const updateAddonQuantity = (addonId: string, change: number) => {
    setSelectedAddons((prev) =>
      prev.map((a) =>
        a.addon.id === addonId
          ? { ...a, quantity: Math.max(1, a.quantity + change) }
          : a
      )
    );
  };

  const isAddonSelected = (addonId: string) => {
    return selectedAddons.some((a) => a.addon.id === addonId);
  };

  // Calcular precio total
  const calculateTotal = () => {
    let total = product.price;
    
    // Agregar precio del tamaño
    if (selectedSize && selectedSize.price > 0) {
      total += selectedSize.price;
    }
    
    // Agregar precio de extras
    selectedAddons.forEach((selected) => {
      total += selected.addon.price * selected.quantity;
    });
    
    return total * quantity;
  };

  const handleAddToCart = () => {
    const allExtras = [...selectedAddons];
    
    // Incluir el tamaño si no es "Simple"
    if (selectedSize && selectedSize.name !== "Simple") {
      allExtras.unshift({ addon: selectedSize, quantity: 1 });
    }
    
    onAddToCart(product, quantity, allExtras);
    
    // Reset
    setSelectedAddons([]);
    setQuantity(1);
    const simpleSize = addons.find(
      (a) => a.category === "size" && a.name === "Simple"
    );
    setSelectedSize(simpleSize || null);
    onClose();
  };

  if (loading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden border-zinc-800 bg-zinc-950 p-0">
        <DialogTitle className="sr-only">Personalizar {product.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Selecciona el tamaño y los extras que desees agregar a tu pedido
        </DialogDescription>
        
        {/* Header con imagen */}
        <div className="relative h-48 w-full shrink-0">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        </div>

        {/* Título */}
        <div className="shrink-0 px-6 pt-4">
          <h2 className="text-2xl font-bold text-white">{product.name}</h2>
          <p className="text-sm text-zinc-400">{product.description}</p>
          <p className="text-xl font-bold text-orange-500">
            Desde {formatPrice(product.price)}
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {Object.entries(addonsByCategory).map(([category, categoryAddons]) => (
              <div key={category}>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  {categoryLabels[category] || category}
                  {category === "size" && (
                    <span className="ml-2 text-sm font-normal text-orange-500">
                      (Obligatorio)
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {categoryAddons.map((addon) => {
                    const isSize = category === "size";
                    const isSelected = isSize
                      ? selectedSize?.id === addon.id
                      : isAddonSelected(addon.id);
                    const selectedAddon = selectedAddons.find(
                      (a) => a.addon.id === addon.id
                    );

                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-orange-600 bg-orange-600/10"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleAddon(addon);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {addon.name}
                              </span>
                              {addon.price > 0 && (
                                <Badge variant="outline" className="border-orange-600 text-orange-500">
                                  +{formatPrice(addon.price)}
                                </Badge>
                              )}
                              {addon.price === 0 && isSize && (
                                <Badge className="bg-green-600 text-white">
                                  Incluido
                                </Badge>
                              )}
                            </div>
                            {addon.description && (
                              <p className="mt-1 text-sm text-zinc-400">
                                {addon.description}
                              </p>
                            )}
                          </div>

                          {/* Contador de cantidad para extras */}
                          {!isSize && isSelected && selectedAddon && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 border-zinc-700"
                                onClick={() => updateAddonQuantity(addon.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold text-white">
                                {selectedAddon.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 border-zinc-700"
                                onClick={() => updateAddonQuantity(addon.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer con total y botones - FUERA del scroll */}
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-6">
          <div className="flex w-full items-center justify-between gap-4">
            {/* Cantidad de productos */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="border-zinc-700"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-semibold text-white">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="border-zinc-700"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Botón agregar */}
            <Button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="flex-1 bg-orange-600 py-6 text-lg font-bold hover:bg-orange-700"
            >
              Agregar {formatPrice(calculateTotal())}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

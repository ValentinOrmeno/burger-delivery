"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();

  const itemCount = getItemCount();
  const total = getTotal();

  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/50"
        aria-label="Abrir carrito"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-orange-600">
            {itemCount}
          </span>
        )}
      </button>

      {/* Dialog del carrito */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-md overflow-hidden border-zinc-800 bg-zinc-950 p-0">
          <DialogHeader className="border-b border-zinc-800 p-6">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
              Tu Carrito
            </DialogTitle>
            <DialogDescription className="sr-only">
              Revisa los productos que agregaste y procede al pago
            </DialogDescription>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <ShoppingCart className="mb-4 h-16 w-16 text-zinc-700" />
              <p className="text-lg text-zinc-400">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {/* Items del carrito */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-white">
                              {item.product.name}
                            </h4>
                            {/* Mostrar extras */}
                            {item.extras && item.extras.length > 0 && (
                              <div className="mt-1 text-xs text-zinc-400">
                                {item.extras.map((extra, idx) => (
                                  <span key={idx}>
                                    {extra.addon.name}
                                    {extra.quantity > 1 && ` x${extra.quantity}`}
                                    {idx < item.extras.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-zinc-500 transition-colors hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-sm text-orange-500">
                          {formatPrice(item.totalPrice)}
                          {item.extras && item.extras.length > 0 && (
                            <span className="ml-1 text-xs text-zinc-500">
                              (con extras)
                            </span>
                          )}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-zinc-700"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-zinc-700"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con total y botón */}
              <div className="border-t border-zinc-800 bg-zinc-950 p-6">
                <div className="mb-4 flex items-center justify-between text-lg">
                  <span className="font-semibold text-zinc-300">Total:</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatPrice(total)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-orange-600 py-6 text-lg font-bold hover:bg-orange-700"
                >
                  Ir a Pagar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

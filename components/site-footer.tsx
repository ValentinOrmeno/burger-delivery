"use client";

import { Clock, MapPin, CreditCard, MessageCircle } from "lucide-react";
import { STORE, whatsappUrl } from "@/lib/store-config";

export function SiteFooter() {
  const dudasLink = whatsappUrl("Hola! Tengo una consulta sobre mi pedido / el menu.");

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {/* Horarios */}
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600/20">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">
                Horarios
              </h3>
              <p className="text-sm text-zinc-400">{STORE.hours}</p>
            </div>
          </div>

          {/* Zona y retiro */}
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600/20">
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">
                Delivery y retiro
              </h3>
              <p className="text-sm text-zinc-400">{STORE.deliveryZone}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Retira en el local: {STORE.address}
              </p>
            </div>
          </div>

          {/* Medios de pago */}
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600/20">
              <CreditCard className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">
                Medios de pago
              </h3>
              <p className="text-sm text-zinc-400">{STORE.paymentMethods}</p>
            </div>
          </div>

          {/* Dudas por WhatsApp */}
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600/20">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-white">
                Dudas o pedidos por telefono
              </h3>
              <a
                href={dudasLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 transition-colors hover:text-green-300"
              >
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
          Pedidos online con envio a domicilio y retiro en el local.
        </div>
      </div>
    </footer>
  );
}

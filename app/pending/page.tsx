"use client";

import { useRouter } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-600/20">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-3xl text-white">
            Pago Pendiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-zinc-300">
              Tu pago está siendo procesado. Esto puede tomar unos minutos.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">
              Te notificaremos por email cuando se confirme el pago. Si pagaste en efectivo o por transferencia, el pedido se confirmará una vez que verifiquemos el pago.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

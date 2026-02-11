"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FailurePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-3xl text-white">
            Pago Rechazado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-zinc-300">
              No pudimos procesar tu pago. Esto puede deberse a fondos insuficientes o un error en los datos de la tarjeta.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">
              Tu pedido no ha sido confirmado. Por favor, intenta nuevamente o utiliza otro método de pago.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/checkout")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Intentar nuevamente
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full border-zinc-700 hover:bg-zinc-800"
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

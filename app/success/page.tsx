"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-3xl text-white">
            ¡Pago Exitoso!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-zinc-300">
              Tu pedido ha sido confirmado y está siendo preparado.
            </p>
            {orderId && (
              <p className="text-sm text-zinc-500">
                Número de orden: <span className="font-mono text-orange-500">{orderId}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-400">
              Recibirás una confirmación por WhatsApp o llamada telefónica con el tiempo estimado de entrega.
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
            <p className="text-sm text-zinc-500">
              Redirigiendo automáticamente en {countdown} segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

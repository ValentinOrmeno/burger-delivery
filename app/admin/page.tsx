"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type OrderWithItems } from "@/lib/supabase";

type ExtraItem = {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  Truck,
  Phone,
  MapPin,
  Package,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  paid: { label: "Pagado", color: "bg-green-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: ChefHat },
  ready: { label: "Listo", color: "bg-purple-500", icon: Package },
  delivered: { label: "Entregado", color: "bg-gray-500", icon: Truck },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: CheckCircle },
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDelivered, setShowDelivered] = useState(false);

  // Función para calcular tiempo relativo
  const getTimeAgo = (date: string): { text: string; minutes: number } => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return { text: "Hace menos de 1 min", minutes: 0 };
    if (diffMins === 1) return { text: "Hace 1 minuto", minutes: 1 };
    if (diffMins < 60) return { text: `Hace ${diffMins} minutos`, minutes: diffMins };
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return { text: "Hace 1 hora", minutes: diffMins };
    return { text: `Hace ${diffHours} horas`, minutes: diffMins };
  };

  // Cargar órdenes iniciales
  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `);

    // Si no queremos ver entregadas, las excluimos
    if (!showDelivered) {
      query = query.neq("status", "delivered");
    }

    const { data, error } = await query.order("created_at", { ascending: true }); // Más viejas primero

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [showDelivered]);

  useEffect(() => {
    fetchOrders();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("orders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Change received!", payload);

          if (payload.eventType === "INSERT") {
            // Nueva orden - reproducir sonido y recargar
            if (soundEnabled) {
              // Usar Web Audio API para generar un beep
              try {
                const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (AudioContextClass) {
                  const audioContext = new AudioContextClass();
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();
                  
                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);
                  
                  oscillator.frequency.value = 800; // Frecuencia del beep
                  oscillator.type = 'sine';
                  
                  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                  
                  oscillator.start(audioContext.currentTime);
                  oscillator.stop(audioContext.currentTime + 0.5);
                }
              } catch {
                console.log('No se pudo reproducir el sonido');
              }
            }
            toast.success("¡Nueva orden recibida!", {
              duration: 5000,
            });
            fetchOrders();
          } else if (payload.eventType === "UPDATE") {
            // Orden actualizada
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      toast.error("Error al actualizar la orden");
    } else {
      toast.success("Estado actualizado correctamente");
      fetchOrders();
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      paid: "preparing",
      preparing: "ready",
      ready: "delivered",
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      paid: "Empezar a cocinar",
      preparing: "Marcar como listo",
      ready: "Marcar como entregado",
    };
    return labels[currentStatus] || "Siguiente";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-orange-600" />
          <p className="text-zinc-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => 
    ["paid", "preparing", "ready"].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-black text-white">
              Dashboard Cocina
            </h1>
            <p className="text-zinc-400">
              {activeOrders.length} orden{activeOrders.length !== 1 ? "es" : ""} activa{activeOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelivered(!showDelivered)}
              className={`border-zinc-700 ${showDelivered ? "bg-green-600 text-white" : ""}`}
            >
              {showDelivered ? "✓ Ver entregadas" : "Ocultar entregadas"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`border-zinc-700 ${soundEnabled ? "bg-orange-600 text-white" : ""}`}
            >
              {soundEnabled ? "🔔 Sonido ON" : "🔕 Sonido OFF"}
            </Button>
            <Button
              variant="outline"
              onClick={fetchOrders}
              className="border-zinc-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {["paid", "preparing", "ready"].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config.icon;

            return (
              <Card key={status} className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">{config.label}</p>
                    <p className="text-3xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`rounded-full ${config.color} p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Órdenes activas */}
        <div className="space-y-6">
          {activeOrders.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
                <p className="text-xl text-zinc-400">
                  No hay órdenes activas en este momento
                </p>
              </CardContent>
            </Card>
          ) : (
            activeOrders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const Icon = config.icon;
              const nextStatus = getNextStatus(order.status);
              const timeAgo = getTimeAgo(order.created_at);
              const isDelayed = timeAgo.minutes > 20 && order.status !== 'delivered';

              return (
                <Card
                  key={order.id}
                  className={`border-zinc-800 bg-zinc-900/50 transition-all hover:border-orange-600/50 ${
                    isDelayed ? 'border-red-500/60 bg-red-950/20' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <CardTitle className="text-2xl text-white">
                            Orden #{order.order_number || order.id.slice(0, 8)}
                          </CardTitle>
                          {isDelayed && (
                            <Badge className="bg-red-600 text-white">
                              ⚠️ +20 min
                            </Badge>
                          )}
                          {/* Badge de método de pago */}
                          {order.payment_method === "cash" ? (
                            <Badge className="bg-green-600 text-white">
                              💵 Efectivo/Transferencia
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600 text-white">
                              💳 Mercado Pago
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <p className="text-zinc-400">
                            {formatDate(order.created_at)}
                          </p>
                          <span className="text-zinc-600">•</span>
                          <p className={`font-semibold ${isDelayed ? 'text-red-400' : 'text-orange-400'}`}>
                            {timeAgo.text}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${config.color} h-fit px-4 py-2 text-base text-white`}>
                        <Icon className="mr-2 h-4 w-4" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Información del cliente */}
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-5">
                      <h4 className="mb-4 text-base font-bold text-white">
                        👤 Cliente
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-semibold text-white">{order.customer_name}</p>
                            <p className="text-sm text-zinc-400">{order.customer_phone}</p>
                          </div>
                        </div>
                        {order.customer_address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-5 w-5 text-orange-500" />
                            <p className="text-sm text-zinc-300">{order.customer_address}</p>
                          </div>
                        )}
                        {order.notes && (
                          <div className="mt-3 rounded-lg border border-orange-600/40 bg-orange-600/10 p-3">
                            <p className="text-sm font-semibold text-orange-300">💬 Nota:</p>
                            <p className="mt-1 text-sm text-orange-200">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items de la orden */}
                    <div className="space-y-3">
                      <h4 className="text-base font-bold text-white">🍔 Pedido</h4>
                      <div className="space-y-3">
                        {order.order_items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                                    {idx + 1}
                                  </span>
                                  <p className="text-lg font-bold text-white">
                                    {item.quantity}x {item.products.name}
                                  </p>
                                </div>
                                {/* Mostrar extras */}
                                {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                                  <div className="ml-8 mt-2 space-y-1">
                                    <p className="text-xs font-semibold text-green-400">+ Extras:</p>
                                    <ul className="ml-2 space-y-0.5 text-sm text-green-300">
                                      {item.extras.map((extra: ExtraItem, extraIdx: number) => (
                                        <li key={extraIdx}>
                                          • {extra.name}
                                          {extra.quantity > 1 && ` (x${extra.quantity})`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <p className="ml-8 mt-1 text-xs text-zinc-500">
                                  {formatPrice(item.unit_price)} c/u
                                </p>
                              </div>
                              <p className="text-xl font-bold text-orange-500">
                                {formatPrice(item.unit_price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total y acciones */}
                    <div className="flex flex-col gap-4 border-t-2 border-zinc-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2 rounded-lg bg-orange-600/10 px-4 py-3">
                        {/* Si hay delivery cost, mostrar subtotal y delivery */}
                        {order.delivery_cost && order.delivery_cost > 0 ? (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-xs text-orange-300">Subtotal productos:</p>
                              <p className="text-sm font-bold text-orange-400">
                                {formatPrice(order.total_amount - order.delivery_cost)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-xs text-orange-300">
                                🚚 Delivery{order.delivery_distance ? ` (${order.delivery_distance.replace('-', ' a ').replace(/(\d+)/g, '$1m')})` : ''}:
                              </p>
                              <p className="text-sm font-bold text-orange-400">
                                {formatPrice(order.delivery_cost)}
                              </p>
                            </div>
                            <div className="border-t border-orange-600/30 pt-2">
                              <p className="text-sm font-semibold text-orange-400">Total a cobrar</p>
                              <p className="text-3xl font-black text-orange-500">
                                {formatPrice(order.total_amount)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-orange-400">Total a cobrar</p>
                            <p className="text-3xl font-black text-orange-500">
                              {formatPrice(order.total_amount)}
                            </p>
                          </>
                        )}
                      </div>
                      {nextStatus && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          className="bg-orange-600 px-8 py-6 text-lg font-bold hover:bg-orange-700"
                          size="lg"
                        >
                          {getNextStatusLabel(order.status)}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

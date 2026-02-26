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
  RefreshCw,
  Trash2,
  Calendar,
  Tag,
  MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Paleta A - Modo cocina (alto contraste, estilo POS)
const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-400 text-black",
    borderColor: "border-l-yellow-400",
    icon: Clock,
  },
  paid: {
    label: "Pagado",
    color: "bg-green-500 text-white",
    borderColor: "border-l-green-500",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparando",
    color: "bg-blue-500 text-white",
    borderColor: "border-l-blue-500",
    icon: ChefHat,
  },
  ready: {
    label: "Listo",
    color: "bg-green-400 text-black",
    borderColor: "border-l-green-400",
    icon: Package,
  },
  delivered: {
    label: "Entregado",
    color: "bg-zinc-500 text-white",
    borderColor: "border-l-zinc-500",
    icon: Truck,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500 text-white",
    borderColor: "border-l-red-500",
    icon: CheckCircle,
  },
};

// Normaliza el telefono del cliente al formato esperado por WhatsApp (ej: 54911...)
const normalizePhoneForWhatsApp = (
  rawPhone: string | null | undefined
): string | null => {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;

  if (digits.startsWith("0")) {
    const without0 = digits.slice(1);
    if (without0.startsWith("11")) {
      return `549${without0}`;
    }
    return `54${without0}`;
  }

  if (digits.startsWith("11")) {
    return `549${digits}`;
  }

  // Fallback: agregar prefijo pais
  return digits.startsWith("9") ? `54${digits}` : `549${digits}`;
};

const buildStatusWhatsAppMessage = (
  order: OrderWithItems,
  newStatus: string
): string | null => {
  const num = order.order_number || order.id.slice(0, 8);
  const typeText =
    order.order_type === "pickup" ? "retiro en el local" : "delivery";

  if (newStatus === "preparing") {
    return `Hola ${order.customer_name}! 👋\n\nTu pedido #${num} ya fue confirmado y estamos *preparando tu pedido* (${typeText}).\n\nCuando este listo te avisamos por este mismo chat.`;
  }

  if (newStatus === "ready") {
    if (order.order_type === "pickup") {
      return `Hola ${order.customer_name}! 🙌\n\nTu pedido #${num} ya esta *LISTO para retirar en el local*.\n\nTe esperamos!`;
    }
    return `Hola ${order.customer_name}! 🙌\n\nTu pedido #${num} ya esta *LISTO* y en breve saldra para *delivery*.\n\nCuando el repartidor salga para tu direccion te avisamos.`;
  }

  if (newStatus === "delivered") {
    return `Hola ${order.customer_name}! 💛\n\nMarcamos tu pedido #${num} como *ENTREGADO*.\n\nMuchas gracias por pedirnos! Si queres, podes contarnos que te parecio.`;
  }

  return null;
};

const notifyCustomerStatusChange = (
  order: OrderWithItems,
  newStatus: string
) => {
  const message = buildStatusWhatsAppMessage(order, newStatus);
  if (!message) return;

  const normalized = normalizePhoneForWhatsApp(order.customer_phone);
  if (!normalized) {
    toast.error("Telefono del cliente no valido para WhatsApp");
    return;
  }

  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  try {
    window.open(url, "_blank");
  } catch {
    // Si el navegador bloquea el popup, al menos no rompemos el dashboard
  }
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDelivered, setShowDelivered] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "web" | "cash">(
    "all"
  );
  const [historialDesde, setHistorialDesde] = useState("");
  const [historialHasta, setHistorialHasta] = useState("");
  const [historialSearch, setHistorialSearch] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"orders" | "promos">("orders");
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    is_available: boolean;
    promo_active: boolean | null;
    promo_price: number | null;
    promo_only_pickup: boolean | null;
    promo_only_cash: boolean | null;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  // Función para calcular tiempo relativo (si pasó más de 1 día se muestran días, no horas)
  const getTimeAgo = (date: string): { text: string; minutes: number } => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return { text: "Hace menos de 1 min", minutes: 0 };
    if (diffMins === 1) return { text: "Hace 1 minuto", minutes: 1 };
    if (diffMins < 60) return { text: `Hace ${diffMins} minutos`, minutes: diffMins };

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      if (diffHours === 1) return { text: "Hace 1 hora", minutes: diffMins };
      return { text: `Hace ${diffHours} horas`, minutes: diffMins };
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return { text: "Hace 1 día", minutes: diffMins };
    return { text: `Hace ${diffDays} días`, minutes: diffMins };
  };

  const passesPaymentFilter = (order: OrderWithItems): boolean => {
    if (paymentFilter === "web") return order.payment_method === "mercadopago";
    if (paymentFilter === "cash") return order.payment_method === "cash";
    return true;
  };

  // Cargar órdenes: si estamos en completadas/historial traemos todas; si no, excluimos entregadas
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

    if (!showDelivered) {
      query = query.neq("status", "delivered");
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [showDelivered]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setProducts(data);
      else toast.error("Error al cargar productos");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminTab === "promos") fetchProducts();
  }, [adminTab, fetchProducts]);

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

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order:", error);
      toast.error("Error al actualizar la orden");
      return false;
    } else {
      toast.success("Estado actualizado correctamente");
      fetchOrders();
      return true;
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: "paid",
      paid: "preparing",
      preparing: "ready",
      ready: "delivered",
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      pending: "Confirmar pago recibido",
      paid: "Empezar a cocinar",
      preparing: "Marcar como listo",
      ready: "Marcar como entregado",
    };
    return labels[currentStatus] || "Siguiente";
  };

  const handleAdvanceStatus = async (order: OrderWithItems) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    const ok = await updateOrderStatus(order.id, nextStatus);
    if (!ok) return;

    if (["preparing", "ready", "delivered"].includes(nextStatus)) {
      notifyCustomerStatusChange(order, nextStatus);
    }
  };

  const deleteOrder = async (order: OrderWithItems) => {
    const num = order.order_number || order.id.slice(0, 8);
    if (
      !window.confirm(
        `Eliminar la orden #${num}? Esta accion no se puede deshacer.`
      )
    ) {
      return;
    }
    setDeletingOrderId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Error al eliminar la orden");
        return;
      }
      toast.success("Orden eliminada");
      fetchOrders();
    } finally {
      setDeletingOrderId(null);
    }
  };

  const updateProductPromo = async (
    productId: string,
    updates: {
      promo_active?: boolean;
      promo_price?: number | null;
      promo_only_pickup?: boolean;
      promo_only_cash?: boolean;
    }
  ) => {
    setSavingProductId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Error al guardar");
        return;
      }
      toast.success("Promo actualizada");
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
      );
    } finally {
      setSavingProductId(null);
    }
  };

  const startOfDay = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const endOfDay = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
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

  const activeOrders = orders.filter(
    (o) =>
      ["pending", "paid", "preparing", "ready"].includes(o.status) &&
      passesPaymentFilter(o)
  );

  const completedOrders = orders
    .filter(
      (o) =>
        ["delivered", "cancelled"].includes(o.status) && passesPaymentFilter(o)
    )
    .filter((o) => {
      if (!historialDesde && !historialHasta) return true;
      const t = new Date(o.created_at).getTime();
      if (historialDesde && t < startOfDay(historialDesde)) return false;
      if (historialHasta && t > endOfDay(historialHasta)) return false;
      return true;
    })
    .filter((o) => {
      const term = historialSearch.trim().toLowerCase();
      if (!term) return true;
      const name = (o.customer_name || "").toLowerCase();
      const orderNum =
        (o.order_number ? String(o.order_number) : o.id.slice(0, 8)) ||
        "";
      return (
        name.includes(term) || orderNum.toLowerCase().includes(term)
      );
    });

  const ordersToShow = showDelivered ? completedOrders : activeOrders;

  const pendingForFilter = orders.filter(
    (o) => o.status === "pending" && passesPaymentFilter(o)
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-zinc-800 pb-2">
          <Button
            variant="ghost"
            onClick={() => setAdminTab("orders")}
            className={`gap-2 ${adminTab === "orders" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            <Package className="h-4 w-4" />
            Órdenes
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAdminTab("promos")}
            className={`gap-2 ${adminTab === "promos" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            <Tag className="h-4 w-4" />
            Promociones
          </Button>
        </div>

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-black text-white">
              {adminTab === "orders" ? "Dashboard Cocina" : "Promociones"}
            </h1>
            <p className="text-zinc-400">
              {adminTab === "promos"
                ? "Activa promos y define si aplican solo en efectivo o solo retiro en local."
                : showDelivered
                  ? `${completedOrders.length} orden${
                      completedOrders.length !== 1 ? "es" : ""
                    } completada${completedOrders.length !== 1 ? "s" : ""}`
                  : `${activeOrders.length} orden${
                      activeOrders.length !== 1 ? "es" : ""
                    } activa${activeOrders.length !== 1 ? "s" : ""}`}
              {adminTab === "orders" && !showDelivered && pendingForFilter > 0 && (
                <span className="ml-2 text-yellow-400">
                  ({pendingForFilter} pendiente
                  {pendingForFilter !== 1 ? "s" : ""} de pago)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {adminTab === "promos" && (
              <Button
                variant="outline"
                onClick={fetchProducts}
                disabled={productsLoading}
                className="border-zinc-700"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            )}
            {adminTab === "orders" && (
              <>
            <Button
              variant="outline"
              onClick={() => setShowDelivered(!showDelivered)}
              className={`border-zinc-700 ${
                showDelivered ? "bg-purple-700 text-white" : ""
              }`}
            >
              {showDelivered ? "Ver ordenes activas" : "Ver ordenes completadas"}
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
              </>
            )}
          </div>
        </div>

        {adminTab === "promos" ? (
          /* Panel Promociones */
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              {productsLoading && products.length === 0 ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-10 w-10 animate-spin text-orange-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="mb-4 text-sm text-zinc-400">
                    Marcá promo activa y el precio en promoción. Opcional: limitar a &quot;solo efectivo&quot; o &quot;solo retiro en local&quot;.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700 text-zinc-400">
                          <th className="pb-2 pr-4 font-medium">Producto</th>
                          <th className="pb-2 pr-4 font-medium">Precio normal</th>
                          <th className="pb-2 pr-4 font-medium">Promo activa</th>
                          <th className="pb-2 pr-4 font-medium">Precio promo</th>
                          <th className="pb-2 pr-4 font-medium">Solo efectivo</th>
                          <th className="pb-2 pr-4 font-medium">Solo retiro</th>
                          <th className="pb-2 font-medium">Guardar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b border-zinc-800 align-middle">
                            <td className="py-3 pr-4 font-medium text-white">{p.name}</td>
                            <td className="py-3 pr-4 text-zinc-300">{formatPrice(p.price)}</td>
                            <td className="py-3 pr-4">
                              <input
                                type="checkbox"
                                checked={!!p.promo_active}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setProducts((prev) =>
                                    prev.map((x) => (x.id === p.id ? { ...x, promo_active: v } : x))
                                  );
                                  updateProductPromo(p.id, { promo_active: v });
                                }}
                                className="h-4 w-4 rounded border-zinc-600"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <Input
                                type="number"
                                min={0}
                                step={100}
                                value={p.promo_price ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const v = raw === "" ? null : Number(raw);
                                  if (v !== null && Number.isNaN(v)) return;
                                  setProducts((prev) =>
                                    prev.map((x) => (x.id === p.id ? { ...x, promo_price: v } : x))
                                  );
                                }}
                                onBlur={() => {
                                  const v = p.promo_price;
                                  if (v != null && v >= 0) updateProductPromo(p.id, { promo_price: v });
                                }}
                                className="h-9 w-24 border-zinc-600 bg-zinc-800 text-white"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                type="checkbox"
                                checked={!!p.promo_only_cash}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setProducts((prev) =>
                                    prev.map((x) => (x.id === p.id ? { ...x, promo_only_cash: v } : x))
                                  );
                                  updateProductPromo(p.id, { promo_only_cash: v });
                                }}
                                className="h-4 w-4 rounded border-zinc-600"
                                title="La promo aplica solo si paga en efectivo"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                type="checkbox"
                                checked={!!p.promo_only_pickup}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setProducts((prev) =>
                                    prev.map((x) => (x.id === p.id ? { ...x, promo_only_pickup: v } : x))
                                  );
                                  updateProductPromo(p.id, { promo_only_pickup: v });
                                }}
                                className="h-4 w-4 rounded border-zinc-600"
                                title="La promo aplica solo si retira en el local"
                              />
                            </td>
                            <td className="py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingProductId === p.id}
                                onClick={() =>
                                  updateProductPromo(p.id, {
                                    promo_active: !!p.promo_active,
                                    promo_price: p.promo_price ?? undefined,
                                    promo_only_cash: !!p.promo_only_cash,
                                    promo_only_pickup: !!p.promo_only_pickup,
                                  })
                                }
                                className="border-zinc-600"
                              >
                                {savingProductId === p.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Guardar"
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
        {/* Filtros de pago */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Filtrar por pago:</span>
          <Button
            variant="outline"
            onClick={() => setPaymentFilter("all")}
            className={`border-zinc-700 px-3 py-1 text-xs sm:text-sm ${
              paymentFilter === "all" ? "bg-zinc-700 text-white" : ""
            }`}
          >
            Todos
          </Button>
          <Button
            variant="outline"
            onClick={() => setPaymentFilter("web")}
            className={`border-zinc-700 px-3 py-1 text-xs sm:text-sm ${
              paymentFilter === "web" ? "bg-blue-700 text-white" : ""
            }`}
          >
            Web (Mercado Pago)
          </Button>
          <Button
            variant="outline"
            onClick={() => setPaymentFilter("cash")}
            className={`border-zinc-700 px-3 py-1 text-xs sm:text-sm ${
              paymentFilter === "cash" ? "bg-green-700 text-white" : ""
            }`}
          >
            Efectivo / Transferencia
          </Button>
        </div>

        {/* Historial: rango de fechas + búsqueda (solo en vista completadas) */}
        {showDelivered && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-400">Historial:</span>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Desde</span>
              <input
                type="date"
                value={historialDesde}
                onChange={(e) => setHistorialDesde(e.target.value)}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Hasta</span>
              <input
                type="date"
                value={historialHasta}
                onChange={(e) => setHistorialHasta(e.target.value)}
                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-white"
              />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-zinc-500">Buscar</span>
              <Input
                type="text"
                value={historialSearch}
                onChange={(e) => setHistorialSearch(e.target.value)}
                placeholder="Nombre o # de orden"
                className="h-8 w-56 border-zinc-600 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
              />
            </div>
            {(historialDesde || historialHasta) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistorialDesde("");
                  setHistorialHasta("");
                }}
                className="text-zinc-400 hover:text-white"
              >
                Limpiar fechas
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          {["pending", "paid", "preparing", "ready"].map((status) => {
            const count = orders.filter(
              (o) => o.status === status && passesPaymentFilter(o)
            ).length;
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

        {/* Órdenes (activas o completadas segun filtro) - cuadrícula */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ordersToShow.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-2">
              <CardContent className="py-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
                <p className="text-xl text-zinc-400">
                  {showDelivered
                    ? "No hay órdenes completadas para este filtro"
                    : "No hay órdenes activas en este momento"}
                </p>
              </CardContent>
            </Card>
          ) : (
            ordersToShow.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
              const Icon = config.icon;
              const nextStatus = getNextStatus(order.status);
              const timeAgo = getTimeAgo(order.created_at);
              const isDelayed = timeAgo.minutes > 20 && order.status !== 'delivered';
              const whatsappPhone = normalizePhoneForWhatsApp(order.customer_phone);

              return (
                <Card
                  key={order.id}
                  className={`border-l-4 bg-[#111] transition-all ${
                    isDelayed
                      ? "border-l-red-500 ring-1 ring-red-500/50"
                      : config.borderColor
                  }`}
                >
                  <CardHeader className="border-b border-zinc-700 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <CardTitle className="text-xl font-bold text-white">
                            Orden #{order.order_number || order.id.slice(0, 8)}
                          </CardTitle>
                          {isDelayed && (
                            <Badge className="bg-red-500 text-white text-xs font-semibold">
                              +20 min
                            </Badge>
                          )}
                          {order.payment_method === "cash" ? (
                            <Badge
                              className={
                                order.status === "pending"
                                  ? "bg-yellow-400 text-black text-xs font-semibold"
                                  : "bg-green-500 text-white text-xs font-semibold"
                              }
                            >
                              {order.status === "pending"
                                ? "Pend. pago"
                                : "Efectivo"}
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500 text-white text-xs font-semibold">
                              MP
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <span>{formatDate(order.created_at)}</span>
                          <span>·</span>
                          <span
                            className={
                              isDelayed ? "font-medium text-red-400" : "text-white"
                            }
                          >
                            {timeAgo.text}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`${config.color} h-fit px-3 py-1.5 text-sm font-semibold`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Cliente - blanco, icono celeste + botón WhatsApp */}
                    <div className="rounded border border-zinc-700 bg-zinc-800/80 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          <Phone className="h-4 w-4 text-blue-400" />
                          Cliente
                        </h4>
                        {whatsappPhone && (
                          <a
                            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                              `Hola ${order.customer_name}! Te contactamos por tu pedido #${order.order_number ?? order.id.slice(0, 8)}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Escribir por WhatsApp al cliente"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-500"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {order.customer_name}
                      </p>
                      <p className="text-sm text-zinc-300">
                        {order.customer_phone}
                      </p>
                      {order.customer_address && (
                        <>
                          <p className="mt-2 text-sm text-white">
                            {order.customer_address}
                          </p>
                          {order.between_streets && (
                            <p className="text-xs text-zinc-500">
                              Entre: {order.between_streets}
                            </p>
                          )}
                        </>
                      )}
                      {order.notes && (
                        <div className="mt-3 rounded border border-yellow-500/50 bg-yellow-950/40 px-3 py-2">
                          <p className="text-xs font-semibold text-yellow-400">
                            Nota
                          </p>
                          <p className="text-sm text-white">{order.notes}</p>
                        </div>
                      )}
                      {order.status === "pending" &&
                        order.payment_method === "cash" && (
                          <div className="mt-3 rounded border border-yellow-500/60 bg-yellow-900/30 px-3 py-2">
                            <p className="text-xs font-semibold text-yellow-400">
                              Pendiente de pago
                            </p>
                            <p className="text-xs text-zinc-300">
                              Confirmar cuando cobren.
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Pedido - blanco sobre gris oscuro, extras verde lima */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Pedido
                      </h4>
                      <div className="space-y-2">
                        {order.order_items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 rounded border border-zinc-700 bg-zinc-800 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-600 text-xs font-bold text-white">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-white">
                                  {item.quantity}x {item.products.name}
                                </p>
                                {item.extras &&
                                  Array.isArray(item.extras) &&
                                  item.extras.length > 0 && (
                                    <p className="mt-0.5 text-xs text-lime-400">
                                      +{" "}
                                      {item.extras
                                        .map((e: ExtraItem) => e.name)
                                        .join(", ")}
                                    </p>
                                  )}
                                <p className="mt-0.5 text-xs text-zinc-500">
                                  {formatPrice(item.unit_price)} c/u
                                </p>
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold tabular-nums text-white">
                              {formatPrice(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total - verde brillante sobre oscuro */}
                    <div className="flex flex-col gap-4 border-t border-zinc-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="rounded border border-zinc-700 bg-zinc-800/80 px-4 py-3">
                        {order.delivery_cost && order.delivery_cost > 0 ? (
                          <>
                            <div className="flex justify-between gap-4 text-sm">
                              <span className="text-zinc-400">Subtotal</span>
                              <span className="tabular-nums text-white">
                                {formatPrice(
                                  order.total_amount - order.delivery_cost
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 text-sm">
                              <span className="text-zinc-400">
                                Delivery
                                {order.delivery_distance
                                  ? ` (${order.delivery_distance.replace("-", " a ").replace(/(\d+)/g, "$1m")})`
                                  : ""}
                              </span>
                              <span className="tabular-nums text-white">
                                {formatPrice(order.delivery_cost)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between border-t border-zinc-700 pt-2">
                              <span className="text-sm font-semibold text-zinc-300">
                                Total
                              </span>
                              <span className="text-xl font-bold tabular-nums text-green-400">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold text-zinc-300">
                              Total
                            </span>
                            <span className="text-xl font-bold tabular-nums text-green-400">
                              {formatPrice(order.total_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                        {nextStatus && (
                          <Button
                            onClick={() => handleAdvanceStatus(order)}
                            className={`h-14 flex-1 items-center justify-center px-6 text-lg font-bold sm:flex-initial sm:px-8 ${
                              order.status === 'pending' && order.payment_method === 'cash'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                            size="lg"
                          >
                            {order.status === 'pending' && order.payment_method === 'cash' ? '💰 ' : ''}
                            {getNextStatusLabel(order.status)}
                          </Button>
                        )}
                        {!showDelivered && (
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => deleteOrder(order)}
                            disabled={deletingOrderId === order.id}
                            title="Eliminar orden"
                            className="h-14 flex-1 items-center justify-center border-red-600/60 px-4 text-red-400 hover:bg-red-600/20 hover:text-red-300 sm:flex-initial"
                          >
                            {deletingOrderId === order.id ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

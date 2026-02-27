"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  MessageCircle,
  LogOut,
  TrendingUp,
  Monitor,
  StickyNote,
  Download,
  AlertTriangle,
  User,
  XCircle,
  Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";
import { AdminLoginScreen } from "@/components/AdminLoginScreen";
import { getDeliveryLabel } from "@/lib/constants";

// ─── Configuración de estados ──────────────────────────────────────────────
const statusConfig = {
  pending:   { label: "Pendiente",   color: "bg-yellow-400 text-black",  borderColor: "border-l-yellow-400", icon: Clock       },
  paid:      { label: "Pagado",      color: "bg-green-500 text-white",   borderColor: "border-l-green-500",  icon: CheckCircle },
  preparing: { label: "Preparando",  color: "bg-blue-500 text-white",    borderColor: "border-l-blue-500",   icon: ChefHat     },
  ready:     { label: "Listo",       color: "bg-green-400 text-black",   borderColor: "border-l-green-400",  icon: Package     },
  delivered: { label: "Entregado",   color: "bg-zinc-500 text-white",    borderColor: "border-l-zinc-500",   icon: Truck       },
  cancelled: { label: "Cancelado",   color: "bg-red-500 text-white",     borderColor: "border-l-red-500",    icon: XCircle     },
};

const CANCEL_REASONS = [
  "Cliente no contestó",
  "Dirección incorrecta",
  "Sin stock",
  "Pedido duplicado",
  "Cliente canceló",
  "Otro",
];

// ─── Helpers WhatsApp ──────────────────────────────────────────────────────
const normalizePhoneForWhatsApp = (rawPhone: string | null | undefined): string | null => {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  if (digits.startsWith("0")) {
    const without0 = digits.slice(1);
    return without0.startsWith("11") ? `549${without0}` : `54${without0}`;
  }
  if (digits.startsWith("11")) return `549${digits}`;
  return digits.startsWith("9") ? `54${digits}` : `549${digits}`;
};

const buildStatusWhatsAppMessage = (order: OrderWithItems, newStatus: string): string | null => {
  const num = order.order_number || order.id.slice(0, 8);
  const typeText = order.order_type === "pickup" ? "retiro en el local" : "delivery";
  if (newStatus === "preparing")
    return `Hola ${order.customer_name}! 👋\n\nTu pedido #${num} ya fue confirmado y estamos *preparando tu pedido* (${typeText}).\n\nCuando este listo te avisamos por este mismo chat.`;
  if (newStatus === "ready") {
    if (order.order_type === "pickup")
      return `Hola ${order.customer_name}! 🙌\n\nTu pedido #${num} ya esta *LISTO para retirar en el local*.\n\nTe esperamos!`;
    return `Hola ${order.customer_name}! 🙌\n\nTu pedido #${num} ya esta *LISTO* y en breve saldra para *delivery*.\n\nCuando el repartidor salga para tu direccion te avisamos.`;
  }
  if (newStatus === "delivered")
    return `Hola ${order.customer_name}! 💛\n\nMarcamos tu pedido #${num} como *ENTREGADO*.\n\nMuchas gracias por pedirnos! Si queres, podes contarnos que te parecio.`;
  return null;
};

const notifyCustomerStatusChange = (order: OrderWithItems, newStatus: string) => {
  const message = buildStatusWhatsAppMessage(order, newStatus);
  if (!message) return;
  const normalized = normalizePhoneForWhatsApp(order.customer_phone);
  if (!normalized) { toast.error("Teléfono del cliente no válido para WhatsApp"); return; }
  try { window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank"); } catch { }
};

// ─── Hook: temporizador por orden ─────────────────────────────────────────
function useOrderTimer(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function OrderTimer({ startedAt, warnAfterMinutes = 25 }: { startedAt: string | null; warnAfterMinutes?: number }) {
  const elapsed = useOrderTimer(startedAt);
  if (!startedAt) return null;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isWarning = mins >= warnAfterMinutes;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold tabular-nums ${isWarning ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-300"}`}>
      <Timer className="h-3 w-3" />
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

// ─── Exportar historial CSV ────────────────────────────────────────────────
function exportToCSV(orders: OrderWithItems[]) {
  const rows = [
    ["#", "Fecha", "Cliente", "Teléfono", "Dirección", "Distancia", "Pago", "Estado", "Subtotal", "Delivery", "Total"],
    ...orders.map((o) => [
      o.order_number ?? o.id.slice(0, 8),
      new Date(o.created_at).toLocaleString("es-AR"),
      o.customer_name,
      o.customer_phone,
      o.customer_address ?? "",
      getDeliveryLabel(o.delivery_distance ?? ""),
      o.payment_method === "cash" ? "Efectivo/Transf." : "Mercado Pago",
      statusConfig[o.status as keyof typeof statusConfig]?.label ?? o.status,
      o.delivery_cost ? o.total_amount - o.delivery_cost : o.total_amount,
      o.delivery_cost ?? 0,
      o.total_amount,
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { isAuthenticated, login, logout } = useAdminAuth();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDelivered, setShowDelivered] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "web" | "cash">("all");
  const [historialDesde, setHistorialDesde] = useState("");
  const [historialHasta, setHistorialHasta] = useState("");
  const [historialSearch, setHistorialSearch] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"orders" | "promos" | "metrics">("orders");
  const [kitchenMode, setKitchenMode] = useState(false);

  const historialFilters: [label: string, value: string, setter: (v: string) => void][] = [
    ["Desde", historialDesde, setHistorialDesde],
    ["Hasta", historialHasta, setHistorialHasta],
  ];

  // Nota interna por orden: { [orderId]: string }
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("admin_internal_notes") || "{}"); } catch { return {}; }
  });
  const saveInternalNote = (orderId: string, note: string) => {
    const updated = { ...internalNotes, [orderId]: note };
    setInternalNotes(updated);
    localStorage.setItem("admin_internal_notes", JSON.stringify(updated));
  };

  // Cancelación con motivo
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderWithItems | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);

  // Repartidor asignado por orden
  const [repartidores, setRepartidores] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("admin_repartidores") || "{}"); } catch { return {}; }
  });
  const saveRepartidor = (orderId: string, name: string) => {
    const updated = { ...repartidores, [orderId]: name };
    setRepartidores(updated);
    localStorage.setItem("admin_repartidores", JSON.stringify(updated));
  };

  // Tiempo que lleva una orden en "preparing" — guardamos el timestamp cuando avanza a ese estado
  const [preparingStartedAt, setPreparingStartedAt] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("admin_preparing_at") || "{}"); } catch { return {}; }
  });
  const markPreparingStart = (orderId: string) => {
    const updated = { ...preparingStartedAt, [orderId]: new Date().toISOString() };
    setPreparingStartedAt(updated);
    localStorage.setItem("admin_preparing_at", JSON.stringify(updated));
  };

  const [products, setProducts] = useState<Array<{
    id: string; name: string; category: string; price: number;
    is_available: boolean; promo_active: boolean | null;
    promo_price: number | null; promo_only_pickup: boolean | null; promo_only_cash: boolean | null;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  // Ref para alerta de orden sin atender
  const unattendedAlertRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Helpers tiempo ────────────────────────────────────────────────────
  const getTimeAgo = (date: string): { text: string; minutes: number } => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return { text: "Hace menos de 1 min", minutes: 0 };
    if (diffMins === 1) return { text: "Hace 1 minuto", minutes: 1 };
    if (diffMins < 60) return { text: `Hace ${diffMins} minutos`, minutes: diffMins };
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return { text: diffHours === 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`, minutes: diffMins };
    const diffDays = Math.floor(diffHours / 24);
    return { text: diffDays === 1 ? "Hace 1 día" : `Hace ${diffDays} días`, minutes: diffMins };
  };

  const passesPaymentFilter = (order: OrderWithItems): boolean => {
    if (paymentFilter === "web") return order.payment_method === "mercadopago";
    if (paymentFilter === "cash") return order.payment_method === "cash";
    return true;
  };

  // ─── Fetch ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    let query = supabase.from("orders").select(`*, order_items (*, products (*))`);
    if (!showDelivered) query = query.neq("status", "delivered");
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) { toast.error("Error al cargar las órdenes"); }
    else { setOrders(data || []); }
    setLoading(false);
  }, [showDelivered]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setProducts(data);
      else toast.error("Error al cargar productos");
    } finally { setProductsLoading(false); }
  }, []);

  useEffect(() => { if (adminTab === "promos") fetchProducts(); }, [adminTab, fetchProducts]);

  // ─── Sonido ────────────────────────────────────────────────────────────
  const playBeep = useCallback((freq = 800, duration = 0.5, volume = 0.3) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
    } catch { }
  }, [soundEnabled]);

  // ─── Realtime + alerta sin atender ─────────────────────────────────────
  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          playBeep(800, 0.5);
          toast.success("¡Nueva orden recibida!", { duration: 5000 });
          fetchOrders();
        } else if (payload.eventType === "UPDATE") {
          fetchOrders();
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled, fetchOrders, playBeep]);

  // Alerta cada 2 min si hay una orden "paid" sin pasar a preparing
  useEffect(() => {
    if (unattendedAlertRef.current) clearInterval(unattendedAlertRef.current);
    unattendedAlertRef.current = setInterval(() => {
      const unattended = orders.filter((o) => {
        if (o.status !== "paid") return false;
        const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
        return mins >= 5;
      });
      if (unattended.length > 0) {
        playBeep(400, 1.0, 0.5);
        toast.warning(`⚠️ ${unattended.length} orden${unattended.length > 1 ? "es" : ""} pagada${unattended.length > 1 ? "s" : ""} sin empezar a cocinar`, { duration: 8000 });
      }
    }, 120000);
    return () => { if (unattendedAlertRef.current) clearInterval(unattendedAlertRef.current); };
  }, [orders, playBeep]);

  // ─── Auth guard ─────────────────────────────────────────────────────────
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return <AdminLoginScreen onLogin={login} />;

  // ─── Acciones ───────────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) { toast.error("Error al actualizar la orden"); return false; }
    if (newStatus === "preparing") markPreparingStart(orderId);
    toast.success("Estado actualizado");
    fetchOrders();
    return true;
  };

  const getNextStatus = (currentStatus: string): string | null =>
    ({ pending: "paid", paid: "preparing", preparing: "ready", ready: "delivered" }[currentStatus] || null);

  const getNextStatusLabel = (currentStatus: string): string =>
    ({ pending: "Confirmar pago recibido", paid: "Empezar a cocinar", preparing: "Marcar como listo", ready: "Marcar como entregado" }[currentStatus] || "Siguiente");

  const handleAdvanceStatus = async (order: OrderWithItems) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;
    const ok = await updateOrderStatus(order.id, nextStatus);
    if (!ok) return;
    if (["preparing", "ready", "delivered"].includes(nextStatus)) notifyCustomerStatusChange(order, nextStatus);
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const ok = await updateOrderStatus(cancelModalOrder.id, "cancelled");
    if (ok) {
      const num = cancelModalOrder.order_number || cancelModalOrder.id.slice(0, 8);
      toast.info(`Orden #${num} cancelada: ${cancelReason}`);
    }
    setCancelModalOrder(null);
    setCancelReason(CANCEL_REASONS[0]);
  };

  const deleteOrder = async (order: OrderWithItems) => {
    const num = order.order_number || order.id.slice(0, 8);
    if (!window.confirm(`Eliminar la orden #${num}? Esta acción no se puede deshacer.`)) return;
    setDeletingOrderId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Error al eliminar la orden"); return; }
      toast.success("Orden eliminada");
      fetchOrders();
    } finally { setDeletingOrderId(null); }
  };

  const updateProductPromo = async (productId: string, updates: { promo_active?: boolean; promo_price?: number | null; promo_only_pickup?: boolean; promo_only_cash?: boolean; }) => {
    setSavingProductId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "Error al guardar"); return; }
      toast.success("Promo actualizada");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    } finally { setSavingProductId(null); }
  };

  const startOfDay = (d: string) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const endOfDay   = (d: string) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };

  // ─── Datos derivados ────────────────────────────────────────────────────
  const activeOrders = orders.filter((o) => ["pending", "paid", "preparing", "ready"].includes(o.status) && passesPaymentFilter(o));

  const completedOrders = orders
    .filter((o) => ["delivered", "cancelled"].includes(o.status) && passesPaymentFilter(o))
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
      return (o.customer_name || "").toLowerCase().includes(term) ||
        String(o.order_number ?? "").includes(term);
    });

  const ordersToShow = showDelivered ? completedOrders : activeOrders;
  const pendingForFilter = orders.filter((o) => o.status === "pending" && passesPaymentFilter(o)).length;

  // ─── Métricas del día ───────────────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= today && o.status !== "cancelled");
  const todayRevenue = todayOrders.filter((o) => o.status === "delivered" || o.status === "preparing" || o.status === "ready" || o.status === "paid").reduce((s, o) => s + o.total_amount, 0);
  const todayMP = todayOrders.filter((o) => o.payment_method === "mercadopago").length;
  const todayCash = todayOrders.filter((o) => o.payment_method === "cash").length;
  const avgTicket = todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

  // Órdenes "ready" agrupadas para repartidor
  const readyOrders = activeOrders.filter((o) => o.status === "ready");

  // ─── MODO COCINA (pantalla completa simplificada) ───────────────────────
  if (kitchenMode) {
    const cookingOrders = activeOrders.filter((o) => ["paid", "preparing"].includes(o.status));
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">🍳 COCINA</h1>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">{new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
            <Button variant="outline" onClick={() => setKitchenMode(false)} className="border-zinc-600 text-zinc-300">
              Salir modo cocina
            </Button>
          </div>
        </div>

        {cookingOrders.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-4xl text-zinc-600">Sin órdenes activas 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cookingOrders.map((order) => {
              const timeAgo = getTimeAgo(order.created_at);
              const isDelayed = timeAgo.minutes > 20;
              return (
                <div key={order.id} className={`rounded-xl border-4 p-5 ${isDelayed ? "border-red-500 bg-red-950/30" : order.status === "preparing" ? "border-blue-500 bg-blue-950/20" : "border-green-500 bg-green-950/20"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl font-black text-white">#{order.order_number}</span>
                    <div className="flex items-center gap-2">
                      {order.status === "preparing" && <OrderTimer startedAt={preparingStartedAt[order.id] ?? null} />}
                      <Badge className={`text-sm font-bold ${order.status === "preparing" ? "bg-blue-500" : "bg-green-500"}`}>
                        {order.status === "preparing" ? "COCINANDO" : "EMPEZAR"}
                      </Badge>
                    </div>
                  </div>

                  {/* Extras grandes y destacados */}
                  <div className="mb-3 space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="rounded bg-zinc-800 p-3">
                        <p className="text-xl font-bold text-white">{item.quantity}x {item.products.name}</p>
                        {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(item.extras as ExtraItem[]).map((e, i) => (
                              <span key={i} className="rounded bg-orange-500/20 px-2 py-1 text-base font-bold text-orange-300">
                                {e.name}{e.quantity > 1 ? ` x${e.quantity}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mb-3 rounded border border-yellow-500 bg-yellow-900/40 p-2">
                      <p className="text-sm font-semibold text-yellow-300">⚠️ {order.notes}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => handleAdvanceStatus(order)}
                    className={`w-full py-4 text-lg font-black ${order.status === "paid" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {getNextStatusLabel(order.status)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── MODAL CANCELACIÓN ─────────────────────────────────────────────────
  const CancelModal = () => cancelModalOrder ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold text-white">Cancelar orden #{cancelModalOrder.order_number}</h3>
        <p className="mb-3 text-sm text-zinc-400">Seleccioná el motivo de cancelación:</p>
        <select
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="mb-4 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
        >
          {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <div className="flex gap-3">
          <Button onClick={() => setCancelModalOrder(null)} variant="outline" className="flex-1 border-zinc-600 text-zinc-300">
            Volver
          </Button>
          <Button onClick={handleCancelOrder} className="flex-1 bg-red-600 hover:bg-red-700 font-bold">
            Confirmar cancelación
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // ─── LOADING ────────────────────────────────────────────────────────────
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

  // ─── RENDER PRINCIPAL ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <CancelModal />
      <div className="mx-auto max-w-7xl">

        {/* ── MÉTRICAS DEL DÍA (banner arriba) ── */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Ventas hoy</p>
            <p className="text-2xl font-black text-green-400">{formatPrice(todayRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Pedidos hoy</p>
            <p className="text-2xl font-black text-white">{todayOrders.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Ticket prom.</p>
            <p className="text-2xl font-black text-orange-400">{avgTicket > 0 ? formatPrice(avgTicket) : "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">MP / Efectivo</p>
            <p className="text-xl font-black text-white">{todayMP} / {todayCash}</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mb-4 flex gap-2 border-b border-zinc-800 pb-2">
          {[
            { key: "orders",  label: "Órdenes",    icon: <Package className="h-4 w-4" /> },
            { key: "metrics", label: "Métricas",   icon: <TrendingUp className="h-4 w-4" /> },
            { key: "promos",  label: "Promociones", icon: <Tag className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <Button key={key} variant="ghost" onClick={() => setAdminTab(key as typeof adminTab)}
              className={`gap-2 ${adminTab === key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>
              {icon}{label}
            </Button>
          ))}
        </div>

        {/* ── HEADER ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">
              {adminTab === "orders" ? "Dashboard Cocina" : adminTab === "metrics" ? "Métricas" : "Promociones"}
            </h1>
            {adminTab === "orders" && (
              <p className="text-zinc-400">
                {showDelivered ? `${completedOrders.length} órdenes completadas` : `${activeOrders.length} órdenes activas`}
                {!showDelivered && pendingForFilter > 0 && (
                  <span className="ml-2 text-yellow-400">({pendingForFilter} pendiente{pendingForFilter !== 1 ? "s" : ""} de pago)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {adminTab === "orders" && (
              <>
                <Button variant="outline" onClick={() => setKitchenMode(true)} className="border-zinc-700 gap-2 text-orange-300 hover:text-white">
                  <Monitor className="h-4 w-4" />Modo cocina
                </Button>
                <Button variant="outline" onClick={() => setShowDelivered(!showDelivered)}
                  className={`border-zinc-700 ${showDelivered ? "bg-purple-700 text-white" : ""}`}>
                  {showDelivered ? "Ver activas" : "Ver completadas"}
                </Button>
                {showDelivered && (
                  <Button variant="outline" onClick={() => exportToCSV(completedOrders)} className="border-zinc-700 gap-2">
                    <Download className="h-4 w-4" />CSV
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`border-zinc-700 ${soundEnabled ? "bg-orange-600 text-white" : ""}`}>
                  {soundEnabled ? "🔔 ON" : "🔕 OFF"}
                </Button>
                <Button variant="outline" onClick={fetchOrders} className="border-zinc-700">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
            {adminTab === "promos" && (
              <Button variant="outline" onClick={fetchProducts} disabled={productsLoading} className="border-zinc-700">
                <RefreshCw className={`mr-2 h-4 w-4 ${productsLoading ? "animate-spin" : ""}`} />Actualizar
              </Button>
            )}
            <Button variant="outline" onClick={logout} className="border-zinc-700 text-zinc-400 hover:text-white" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ════════════════ TAB: MÉTRICAS ════════════════ */}
        {adminTab === "metrics" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Resumen del día */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader><CardTitle className="text-white">Resumen de hoy</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Total facturado", value: formatPrice(todayRevenue), color: "text-green-400" },
                    { label: "Pedidos totales", value: String(todayOrders.length), color: "text-white" },
                    { label: "Ticket promedio", value: avgTicket > 0 ? formatPrice(avgTicket) : "—", color: "text-orange-400" },
                    { label: "Mercado Pago", value: `${todayMP} pedidos`, color: "text-blue-400" },
                    { label: "Efectivo/Transf.", value: `${todayCash} pedidos`, color: "text-yellow-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between border-b border-zinc-800 pb-2">
                      <span className="text-zinc-400">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Por estado */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader><CardTitle className="text-white">Por estado (activos)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(statusConfig).filter(([k]) => !["delivered", "cancelled"].includes(k)).map(([status, cfg]) => {
                    const count = orders.filter((o) => o.status === status).length;
                    const Icon = cfg.icon;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${cfg.color}`}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="text-zinc-300">{cfg.label}</span>
                        </div>
                        <span className="text-xl font-bold text-white">{count}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Historial completo exportable */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Historial exportable</CardTitle>
                  <Button variant="outline" onClick={() => exportToCSV(orders.filter((o) => ["delivered"].includes(o.status)))}
                    className="border-zinc-700 gap-2 text-sm">
                    <Download className="h-4 w-4" />Exportar entregados (CSV)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400">
                  Total histórico: <span className="font-bold text-white">{orders.filter((o) => o.status === "delivered").length} órdenes entregadas</span>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ════════════════ TAB: PROMOS ════════════════ */}
        {adminTab === "promos" && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-6">
              {productsLoading && products.length === 0 ? (
                <div className="flex justify-center py-12"><RefreshCw className="h-10 w-10 animate-spin text-orange-500" /></div>
              ) : (
                <div className="space-y-4">
                  <p className="mb-4 text-sm text-zinc-400">Marcá promo activa y el precio en promoción. Opcional: limitar a &quot;solo efectivo&quot; o &quot;solo retiro en local&quot;.</p>
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
                              <input type="checkbox" checked={!!p.promo_active}
                                onChange={(e) => { const v = e.target.checked; setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, promo_active: v } : x)); updateProductPromo(p.id, { promo_active: v }); }}
                                className="h-4 w-4 rounded border-zinc-600" />
                            </td>
                            <td className="py-3 pr-4">
                              <Input type="number" min={0} step={100} value={p.promo_price ?? ""}
                                onChange={(e) => { const raw = e.target.value; const v = raw === "" ? null : Number(raw); if (v !== null && Number.isNaN(v)) return; setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, promo_price: v } : x)); }}
                                onBlur={() => { const v = p.promo_price; if (v != null && v >= 0) updateProductPromo(p.id, { promo_price: v }); }}
                                className="h-9 w-24 border-zinc-600 bg-zinc-800 text-white" />
                            </td>
                            <td className="py-3 pr-4">
                              <input type="checkbox" checked={!!p.promo_only_cash}
                                onChange={(e) => { const v = e.target.checked; setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, promo_only_cash: v } : x)); updateProductPromo(p.id, { promo_only_cash: v }); }}
                                className="h-4 w-4 rounded border-zinc-600" />
                            </td>
                            <td className="py-3 pr-4">
                              <input type="checkbox" checked={!!p.promo_only_pickup}
                                onChange={(e) => { const v = e.target.checked; setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, promo_only_pickup: v } : x)); updateProductPromo(p.id, { promo_only_pickup: v }); }}
                                className="h-4 w-4 rounded border-zinc-600" />
                            </td>
                            <td className="py-3">
                              <Button size="sm" variant="outline" disabled={savingProductId === p.id}
                                onClick={() => updateProductPromo(p.id, { promo_active: !!p.promo_active, promo_price: p.promo_price ?? undefined, promo_only_cash: !!p.promo_only_cash, promo_only_pickup: !!p.promo_only_pickup })}
                                className="border-zinc-600">
                                {savingProductId === p.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Guardar"}
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
        )}

        {/* ════════════════ TAB: ÓRDENES ════════════════ */}
        {adminTab === "orders" && (
          <>
            {/* Filtros de pago */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-400">Pago:</span>
              {([["all","Todos"],["web","Mercado Pago"],["cash","Efectivo"]] as const).map(([key, label]) => (
                <Button key={key} variant="outline" onClick={() => setPaymentFilter(key)}
                  className={`border-zinc-700 px-3 py-1 text-xs sm:text-sm ${paymentFilter === key ? (key === "web" ? "bg-blue-700 text-white" : key === "cash" ? "bg-green-700 text-white" : "bg-zinc-700 text-white") : ""}`}>
                  {label}
                </Button>
              ))}
            </div>

            {/* Filtro historial */}
            {showDelivered && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3">
                <Calendar className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-400">Historial:</span>
                {historialFilters.map(([label, val, setter]) => (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <input
                      type="date"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-white"
                    />
                  </label>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <Input type="text" value={historialSearch} onChange={(e) => setHistorialSearch(e.target.value)}
                    placeholder="Nombre o # orden"
                    className="h-8 w-48 border-zinc-600 bg-zinc-900 text-xs text-white placeholder:text-zinc-500" />
                </div>
                {(historialDesde || historialHasta) && (
                  <Button variant="ghost" size="sm" onClick={() => { setHistorialDesde(""); setHistorialHasta(""); }} className="text-zinc-400 hover:text-white">
                    Limpiar
                  </Button>
                )}
              </div>
            )}

            {/* Stats cards */}
            <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
              {["pending", "paid", "preparing", "ready"].map((status) => {
                const count = orders.filter((o) => o.status === status && passesPaymentFilter(o)).length;
                const cfg = statusConfig[status as keyof typeof statusConfig];
                const Icon = cfg.icon;
                return (
                  <Card key={status} className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="flex items-center justify-between p-4 md:p-6">
                      <div>
                        <p className="text-xs text-zinc-400 md:text-sm">{cfg.label}</p>
                        <p className="text-2xl font-bold text-white md:text-3xl">{count}</p>
                      </div>
                      <div className={`rounded-full ${cfg.color} p-2 md:p-3`}>
                        <Icon className="h-5 w-5 text-white md:h-6 md:w-6" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Panel repartidor (solo cuando hay órdenes listas) */}
            {!showDelivered && readyOrders.length > 0 && (
              <div className="mb-6 rounded-xl border border-green-600/40 bg-green-900/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-green-400">
                  <Truck className="h-4 w-4" />
                  Órdenes listas para delivery ({readyOrders.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {readyOrders.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 rounded-lg border border-green-700/40 bg-zinc-800 px-3 py-2">
                      <span className="text-sm font-bold text-white">#{o.order_number}</span>
                      <span className="text-xs text-zinc-400">{o.customer_name}</span>
                      <input
                        type="text"
                        value={repartidores[o.id] ?? ""}
                        onChange={(e) => saveRepartidor(o.id, e.target.value)}
                        placeholder="Asignar repartidor"
                        className="h-7 w-32 rounded border border-zinc-600 bg-zinc-700 px-2 text-xs text-white placeholder:text-zinc-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de órdenes */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {ordersToShow.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
                    <p className="text-xl text-zinc-400">
                      {showDelivered ? "No hay órdenes completadas para este filtro" : "No hay órdenes activas en este momento"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                ordersToShow.map((order) => {
                  const cfg = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
                  const Icon = cfg.icon;
                  const nextStatus = getNextStatus(order.status);
                  const timeAgo = getTimeAgo(order.created_at);
                  const isDelayed = timeAgo.minutes > 20 && order.status !== "delivered";
                  const whatsappPhone = normalizePhoneForWhatsApp(order.customer_phone);
                  const repartidor = repartidores[order.id];

                  return (
                    <Card key={order.id} className={`border-l-4 bg-[#111] transition-all ${isDelayed ? "border-l-red-500 ring-1 ring-red-500/50" : cfg.borderColor}`}>
                      <CardHeader className="border-b border-zinc-700 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <CardTitle className="text-xl font-bold text-white">
                                Orden #{order.order_number || order.id.slice(0, 8)}
                              </CardTitle>
                              {isDelayed && <Badge className="bg-red-500 text-white text-xs">+20 min</Badge>}
                              {order.payment_method === "cash" ? (
                                <Badge className={order.status === "pending" ? "bg-yellow-400 text-black text-xs" : "bg-green-500 text-white text-xs"}>
                                  {order.status === "pending" ? "Pend. pago" : "Efectivo"}
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-500 text-white text-xs">MP</Badge>
                              )}
                              {order.status === "preparing" && (
                                <OrderTimer startedAt={preparingStartedAt[order.id] ?? null} />
                              )}
                              {repartidor && (
                                <span className="inline-flex items-center gap-1 rounded bg-green-900/40 px-2 py-0.5 text-xs text-green-400">
                                  <User className="h-3 w-3" />{repartidor}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <span>{formatDate(order.created_at)}</span>
                              <span>·</span>
                              <span className={isDelayed ? "font-medium text-red-400" : "text-white"}>{timeAgo.text}</span>
                            </div>
                          </div>
                          <Badge className={`${cfg.color} h-fit px-3 py-1.5 text-sm font-semibold`}>
                            {cfg.label}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-4">
                        {/* Cliente */}
                        <div className="rounded border border-zinc-700 bg-zinc-800/80 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              <Phone className="h-4 w-4 text-blue-400" />Cliente
                            </h4>
                            {whatsappPhone && (
                              <a href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola ${order.customer_name}! Te contactamos por tu pedido #${order.order_number ?? order.id.slice(0, 8)}.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-500">
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <p className="font-semibold text-white">{order.customer_name}</p>
                          <p className="text-sm text-zinc-300">{order.customer_phone}</p>
                          {order.customer_address && (
                            <>
                              <p className="mt-2 text-sm text-white">{order.customer_address}</p>
                              {order.between_streets && <p className="text-xs text-zinc-500">Entre: {order.between_streets}</p>}
                            </>
                          )}
                          {order.delivery_distance && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                              <MapPin className="h-3 w-3" />{getDeliveryLabel(order.delivery_distance)}
                            </p>
                          )}
                          {order.notes && (
                            <div className="mt-3 rounded border border-yellow-500/50 bg-yellow-950/40 px-3 py-2">
                              <p className="text-xs font-semibold text-yellow-400">Nota del cliente</p>
                              <p className="text-sm text-white">{order.notes}</p>
                            </div>
                          )}
                          {order.status === "pending" && order.payment_method === "cash" && (
                            <div className="mt-3 rounded border border-yellow-500/60 bg-yellow-900/30 px-3 py-2">
                              <p className="text-xs font-semibold text-yellow-400">⏳ Pendiente de pago</p>
                              <p className="text-xs text-zinc-300">Confirmar cuando cobres.</p>
                            </div>
                          )}

                          {/* Nota interna */}
                          <div className="mt-3">
                            <div className="flex items-center gap-1 mb-1">
                              <StickyNote className="h-3 w-3 text-zinc-500" />
                              <span className="text-xs text-zinc-500">Nota interna (solo vos la ves)</span>
                            </div>
                            <textarea
                              value={internalNotes[order.id] ?? ""}
                              onChange={(e) => saveInternalNote(order.id, e.target.value)}
                              placeholder="Ej: cliente llamó, cambió la salsa..."
                              rows={2}
                              className="w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            />
                          </div>
                        </div>

                        {/* Pedido — extras grandes y destacados */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pedido</h4>
                          <div className="space-y-2">
                            {order.order_items.map((item, idx) => (
                              <div key={item.id} className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 flex-1 items-start gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-600 text-xs font-bold text-white">{idx + 1}</span>
                                    <div className="min-w-0">
                                      <p className="text-base font-bold text-white">{item.quantity}x {item.products.name}</p>
                                      {/* Extras grandes y destacados */}
                                      {item.extras && Array.isArray(item.extras) && item.extras.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {(item.extras as ExtraItem[]).map((e, i) => (
                                            <span key={i} className="inline-flex items-center rounded-full bg-orange-500/15 px-2 py-0.5 text-sm font-bold text-orange-300 border border-orange-500/30">
                                              {e.name}{e.quantity > 1 ? ` ×${e.quantity}` : ""}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <p className="mt-0.5 text-xs text-zinc-500">{formatPrice(item.unit_price)} c/u</p>
                                    </div>
                                  </div>
                                  <p className="shrink-0 font-semibold tabular-nums text-white">{formatPrice(item.unit_price * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total + acciones */}
                        <div className="flex flex-col gap-4 border-t border-zinc-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="rounded border border-zinc-700 bg-zinc-800/80 px-4 py-3">
                            {order.delivery_cost && order.delivery_cost > 0 ? (
                              <>
                                <div className="flex justify-between gap-4 text-sm">
                                  <span className="text-zinc-400">Subtotal</span>
                                  <span className="tabular-nums text-white">{formatPrice(order.total_amount - order.delivery_cost)}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-sm">
                                  <span className="text-zinc-400">Delivery</span>
                                  <span className="tabular-nums text-white">{formatPrice(order.delivery_cost)}</span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between border-t border-zinc-700 pt-2">
                                  <span className="text-sm font-semibold text-zinc-300">Total</span>
                                  <span className="text-xl font-bold tabular-nums text-green-400">{formatPrice(order.total_amount)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-zinc-300">Total</span>
                                <span className="text-xl font-bold tabular-nums text-green-400">{formatPrice(order.total_amount)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                            {nextStatus && (
                              <Button onClick={() => handleAdvanceStatus(order)}
                                className={`h-14 flex-1 px-6 text-lg font-bold sm:flex-initial sm:px-8 ${order.status === "pending" && order.payment_method === "cash" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
                                size="lg">
                                {order.status === "pending" && order.payment_method === "cash" ? "💰 " : ""}
                                {getNextStatusLabel(order.status)}
                              </Button>
                            )}
                            {/* Cancelar con motivo */}
                            {!showDelivered && !["delivered", "cancelled"].includes(order.status) && (
                              <Button variant="outline" size="lg" onClick={() => setCancelModalOrder(order)}
                                className="h-14 border-red-600/40 px-4 text-red-400 hover:bg-red-600/20 hover:text-red-300">
                                <XCircle className="h-5 w-5" />
                              </Button>
                            )}
                            {!showDelivered && (
                              <Button variant="outline" size="lg" onClick={() => deleteOrder(order)} disabled={deletingOrderId === order.id}
                                title="Eliminar orden"
                                className="h-14 border-zinc-600/40 px-4 text-zinc-500 hover:bg-zinc-700/20 hover:text-zinc-300">
                                {deletingOrderId === order.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
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

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, PackageCheck, Printer, ReceiptText } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllOrders, useOrderItems, useUpdateOrderStatus, type OrderRow } from "@/lib/api";
import { brl, formatDateTime, orderCategoryLabels, orderStatusLabels, orderStatuses, statusTone } from "@/lib/orders";

export const Route = createFileRoute("/admin/pedidos")({ component: AdminPedidos });

function paymentLabel(status?: OrderRow["payment_status"]) {
  if (status === "approved") return "Pago";
  if (status === "rejected") return "Pagamento recusado";
  if (status === "cancelled") return "Pagamento cancelado";
  return "Pagamento pendente";
}

function paymentTone(status?: OrderRow["payment_status"]): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default";
  if (status === "rejected" || status === "cancelled") return "destructive";
  return "outline";
}

function AdminPedidos() {
  const { data: orders = [], isLoading } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const { data: items = [], isLoading: itemsLoading } = useOrderItems(selected?.id);

  const imprimir = () => window.print();

  return (
    <DashboardShell nav={adminNav} role="Administrador" logoutTo="/admin/login" title="Pedidos & Cobranças" subtitle="Acompanhe os pedidos, pagamentos e tenha o comprovante completo de cada venda.">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Pedidos recebidos</CardDescription><CardTitle className="text-2xl">{orders.filter((o) => !["concluido", "cancelado"].includes(o.status)).length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Pagamentos pendentes</CardDescription><CardTitle className="text-2xl">{orders.filter((o) => o.payment_status !== "approved" && o.status !== "cancelado").length}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Pagamentos aprovados</CardDescription><CardTitle className="text-2xl">{orders.filter((o) => o.payment_status === "approved").length}</CardTitle></CardHeader></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary" /> Todos os pedidos</CardTitle><CardDescription>Abra um pedido para visualizar a nota/comprovante completo, incluindo dados de cobrança e observações dos itens.</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando pedidos...</p> : orders.length === 0 ? <div className="py-12 text-center"><ReceiptText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">Nenhum pedido registrado.</p></div> : <div className="space-y-3">{orders.map((order) => <div key={order.id} className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-bold text-primary">{order.order_number}</span><Badge variant={statusTone(order.status)}>{orderStatusLabels[order.status]}</Badge><Badge variant={paymentTone(order.payment_status)}>{paymentLabel(order.payment_status)}</Badge>{order.apartments?.code && <Badge variant="outline">Apto {order.apartments.code}</Badge>}</div><p className="mt-2 font-medium">{order.customer_name || "Cliente não informado"}</p><p className="text-xs text-muted-foreground">{orderCategoryLabels[order.category]} · {formatDateTime(order.created_at)} · {brl(Number(order.total))}</p></div><div className="flex items-center gap-2"><Select value={order.status} onValueChange={(value) => updateStatus.mutate({ id: order.id, status: value as OrderRow["status"] })}><SelectTrigger className="w-[165px]"><SelectValue /></SelectTrigger><SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{orderStatusLabels[status]}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => setSelected(order)} className="gap-2"><Eye className="h-4 w-4" /> Ver pedido</Button></div></div>)}</div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && <div id="order-receipt" className="space-y-5"><DialogHeader><div className="flex items-start justify-between gap-3"><div><DialogTitle className="text-xl">Nota do pedido {selected.order_number}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Comprovante operacional da solicitação</p></div><Button variant="outline" size="sm" onClick={imprimir} className="print:hidden"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button></div></DialogHeader>
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Hóspede</p><p className="font-medium">{selected.customer_name || "—"}</p></div><div><p className="text-xs text-muted-foreground">Apartamento</p><p className="font-medium">{selected.apartments?.code || "—"}</p></div><div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{selected.customer_cpf || "—"}</p></div><div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{selected.customer_phone || "—"}</p></div><div className="sm:col-span-2"><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium break-all">{selected.customer_email || "—"}</p></div></div>
            <div className="rounded-lg border"><div className="border-b p-4"><p className="font-semibold">Itens do pedido</p></div>{itemsLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando itens...</p> : items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum item detalhado registrado.</p> : <div className="divide-y">{items.map((item) => <div key={item.id} className="p-4"><div className="flex justify-between gap-4"><div><p className="font-medium">{item.quantity} × {item.name}</p>{item.observation && <p className="mt-1 text-sm text-muted-foreground"><strong>Observação:</strong> {item.observation}</p>}</div><p className="font-medium">{brl(Number(item.unit_price) * item.quantity)}</p></div></div>)}</div>}</div>
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Categoria</p><p className="font-medium">{orderCategoryLabels[selected.category]}</p></div><div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{orderStatusLabels[selected.status]}</p></div><div><p className="text-xs text-muted-foreground">Pagamento</p><p className="font-medium">{paymentLabel(selected.payment_status)}</p></div></div>
            <div className="flex items-center justify-between border-t pt-4"><span className="text-lg font-semibold">Total</span><strong className="font-serif text-2xl">{brl(Number(selected.total))}</strong></div>
            {selected.payment_status !== "approved" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">O pedido está registrado mesmo sem pagamento aprovado. Isso permite conferência e nova cobrança posteriormente.</div>}
            <p className="text-center text-xs text-muted-foreground">Pedido criado em {formatDateTime(selected.created_at)} · Este documento é um comprovante do pedido, não uma NF-e fiscal.</p>
          </div>}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

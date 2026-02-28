import { AdminService } from "@/server/services/admin.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatMoney(value: { toString(): string } | string | number) {
  return `$${Number(value).toFixed(2)}`;
}

export default async function AdminOrdersPage() {
  const orders = await AdminService.getShippingAndPayments();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Shipping & Payments</h1>
        <p className="text-muted-foreground text-sm">All shipping and payment information across orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Payment status, shipment status, and recorded entries.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Shipment Status</TableHead>
                <TableHead>Payment Entries</TableHead>
                <TableHead>Shipment Entries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.user?.email ?? "Guest"}</TableCell>
                  <TableCell>{formatMoney(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.shipmentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.payments.length === 0
                      ? "None"
                      : order.payments
                          .map((payment) => `${payment.method} ${payment.status} ${formatMoney(payment.amount)}`)
                          .join(" | ")}
                  </TableCell>
                  <TableCell>
                    {order.shipments.length === 0
                      ? "None"
                      : order.shipments
                          .map((shipment) => `${shipment.status}${shipment.trackingNumber ? ` (${shipment.trackingNumber})` : ""}`)
                          .join(" | ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
"use client";

/**
 * Rich React component renderers for Admin AI Agent tool results.
 * Each tool name maps to a component that visualises the JSON payload.
 */

import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Colour palette ────────────────────────────────────────────────────────────

const COLOURS = [
    "#c9a96e", "#7c5cbf", "#4ea3d4", "#5cba8a", "#e07b54",
    "#d4578a", "#4db6c1", "#e8c93a", "#a0a0a0",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rounded-xl border bg-muted/40 px-4 py-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-sm font-semibold mb-3 text-foreground">{children}</h3>;
}

function ToolCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border bg-background p-4 space-y-3 text-sm w-full overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {children}
        </div>
    );
}

// ─── getDashboardStats ─────────────────────────────────────────────────────────

interface DashboardStats {
    totalUsers?: number;
    totalProducts?: number;
    totalOrders?: number;
    totalConversations?: number;
    totalPayments?: number;
    totalShipments?: number;
    [key: string]: unknown;
}

export function DashboardStatsResult({ result }: { result: DashboardStats }) {
    const stats = [
        { key: "totalUsers", label: "Users" },
        { key: "totalProducts", label: "Products" },
        { key: "totalOrders", label: "Orders" },
        { key: "totalConversations", label: "Conversations" },
        { key: "totalPayments", label: "Payments" },
        { key: "totalShipments", label: "Shipments" },
    ] as const;

    const pieData = stats
        .filter((s) => typeof result[s.key] === "number" && (result[s.key] as number) > 0)
        .map((s) => ({ name: s.label, value: result[s.key] as number }));

    return (
        <ToolCard title="Dashboard Stats">
            <div className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                    <StatCard key={s.key} label={s.label} value={result[s.key] ?? 0} />
                ))}
            </div>
            {pieData.length > 0 && (
                <div>
                    <SectionTitle>Distribution</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                            >
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={COLOURS[i % COLOURS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ToolCard>
    );
}

// ─── listUsers ─────────────────────────────────────────────────────────────────

interface UserRow {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    createdAt?: string;
    _count?: { orders?: number; conversations?: number };
    [key: string]: unknown;
}

export function UsersTableResult({ result }: { result: UserRow[] }) {
    const roleCount: Record<string, number> = {};
    result.forEach((u) => {
        const r = u.role ?? "UNKNOWN";
        roleCount[r] = (roleCount[r] ?? 0) + 1;
    });
    const pieData = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

    return (
        <ToolCard title={`Users (${result.length})`}>
            {pieData.length > 1 && (
                <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b text-muted-foreground">
                            <th className="pb-2 text-left font-semibold">Name</th>
                            <th className="pb-2 text-left font-semibold">Email</th>
                            <th className="pb-2 text-left font-semibold">Role</th>
                            <th className="pb-2 text-right font-semibold">Orders</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((u, i) => (
                            <tr key={u.id ?? i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="py-1.5 pr-3 font-medium truncate max-w-[100px]">{u.name ?? "—"}</td>
                                <td className="py-1.5 pr-3 text-muted-foreground truncate max-w-[140px]">{u.email ?? "—"}</td>
                                <td className="py-1.5 pr-3">
                                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                                        {u.role ?? "—"}
                                    </Badge>
                                </td>
                                <td className="py-1.5 text-right text-muted-foreground">{u._count?.orders ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ToolCard>
    );
}

// ─── listInventory ─────────────────────────────────────────────────────────────

interface InventoryRow {
    id?: string;
    sku?: string;
    stockQty?: number;
    lowStockThreshold?: number;
    variant?: { label?: string; price?: number; product?: { name?: string } };
    product?: { name?: string };
    [key: string]: unknown;
}

export function InventoryChartResult({ result }: { result: InventoryRow[] }) {
    const chartData = result
        .slice(0, 20)
        .map((item) => ({
            name: `${item.variant?.product?.name ?? item.product?.name ?? item.sku ?? "?"} (${item.variant?.label ?? ""})`.trim(),
            stock: item.stockQty ?? 0,
            low: item.lowStockThreshold ?? 5,
        }))
        .sort((a, b) => a.stock - b.stock);

    const lowStockItems = result.filter(
        (i) => (i.stockQty ?? 0) <= (i.lowStockThreshold ?? 5),
    );

    return (
        <ToolCard title={`Inventory (${result.length} variants)`}>
            {lowStockItems.length > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        ⚠ {lowStockItems.length} low-stock variant{lowStockItems.length > 1 ? "s" : ""}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                        {lowStockItems.slice(0, 5).map((i, idx) => (
                            <li key={idx} className="text-xs text-amber-600 dark:text-amber-300">
                                {i.variant?.product?.name ?? i.product?.name ?? i.sku} — {i.stockQty} left
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <SectionTitle>Stock Levels</SectionTitle>
            <ResponsiveContainer width="100%" height={Math.max(140, chartData.length * 22)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.stock <= entry.low ? "#e07b54" : COLOURS[0]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ToolCard>
    );
}

// ─── listOrders ────────────────────────────────────────────────────────────────

interface OrderRow {
    id?: string;
    status?: string;
    total?: number;
    createdAt?: string;
    user?: { name?: string; email?: string };
    payment?: { status?: string };
    shipment?: { status?: string };
    [key: string]: unknown;
}

const ORDER_STATUS_COLOURS: Record<string, string> = {
    PENDING: "#e8c93a",
    CONFIRMED: "#4ea3d4",
    PREPARING: "#c9a96e",
    READY_FOR_PICKUP: "#7c5cbf",
    OUT_FOR_DELIVERY: "#4db6c1",
    DELIVERED: "#5cba8a",
    CANCELLED: "#e07b54",
    REFUNDED: "#d4578a",
};

export function OrdersResult({ result }: { result: OrderRow[] }) {
    const statusCount: Record<string, number> = {};
    result.forEach((o) => {
        const s = o.status ?? "UNKNOWN";
        statusCount[s] = (statusCount[s] ?? 0) + 1;
    });
    const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    return (
        <ToolCard title={`Orders (${result.length})`}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <SectionTitle>Status Distribution</SectionTitle>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}`} labelLine={false}>
                                {pieData.map((entry, i) => (
                                    <Cell key={i} fill={ORDER_STATUS_COLOURS[entry.name] ?? COLOURS[i % COLOURS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <SectionTitle>Revenue</SectionTitle>
                    <div className="space-y-2 pt-1">
                        <StatCard label="Total Orders" value={result.length} />
                        <StatCard
                            label="Total Revenue"
                            value={`$${result.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toFixed(2)}`}
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b text-muted-foreground">
                            <th className="pb-2 text-left font-semibold">Customer</th>
                            <th className="pb-2 text-left font-semibold">Status</th>
                            <th className="pb-2 text-right font-semibold">Total</th>
                            <th className="pb-2 text-right font-semibold">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.slice(0, 10).map((o, i) => (
                            <tr key={o.id ?? i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="py-1.5 pr-3 max-w-[110px] truncate">{o.user?.name ?? o.user?.email ?? "Guest"}</td>
                                <td className="py-1.5 pr-3">
                                    <span
                                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                        style={{ background: ORDER_STATUS_COLOURS[o.status ?? ""] ?? "#a0a0a0" }}
                                    >
                                        {o.status}
                                    </span>
                                </td>
                                <td className="py-1.5 text-right font-medium">${Number(o.total ?? 0).toFixed(2)}</td>
                                <td className="py-1.5 text-right text-muted-foreground">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {result.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">+{result.length - 10} more orders</p>
                )}
            </div>
        </ToolCard>
    );
}

// ─── listProducts ──────────────────────────────────────────────────────────────

interface ProductRow {
    id?: string;
    name?: string;
    slug?: string;
    category?: { name?: string };
    variants?: { price?: number; stock?: number; isActive?: boolean }[];
    isActive?: boolean;
    [key: string]: unknown;
}

export function ProductsResult({ result }: { result: ProductRow[] }) {
    const categoryCount: Record<string, number> = {};
    result.forEach((p) => {
        const c = p.category?.name ?? "Uncategorised";
        categoryCount[c] = (categoryCount[c] ?? 0) + 1;
    });
    const pieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    return (
        <ToolCard title={`Products (${result.length})`}>
            <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b text-muted-foreground">
                            <th className="pb-2 text-left font-semibold">Product</th>
                            <th className="pb-2 text-left font-semibold">Category</th>
                            <th className="pb-2 text-right font-semibold">From</th>
                            <th className="pb-2 text-center font-semibold">Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((p, i) => {
                            const prices = (p.variants ?? [])
                                .filter((v) => v.isActive)
                                .map((v) => Number(v.price))
                                .filter(Boolean)
                                .sort((a, b) => a - b);
                            return (
                                <tr key={p.id ?? i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="py-1.5 pr-3 font-medium truncate max-w-[130px]">{p.name}</td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                                    <td className="py-1.5 text-right">{prices.length ? `$${prices[0].toFixed(2)}` : "—"}</td>
                                    <td className="py-1.5 text-center">
                                        <span className={cn("inline-block h-2 w-2 rounded-full", p.isActive !== false ? "bg-green-500" : "bg-muted")} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </ToolCard>
    );
}

// ─── listConversations ─────────────────────────────────────────────────────────

interface ConversationRow {
    id?: string;
    status?: string;
    channel?: string;
    createdAt?: string;
    user?: { name?: string; email?: string };
    messages?: unknown[];
    assignedTo?: { name?: string };
    [key: string]: unknown;
}

const CONV_STATUS_COLOURS: Record<string, string> = {
    OPEN: "#4ea3d4",
    IN_PROGRESS: "#c9a96e",
    RESOLVED: "#5cba8a",
    ESCALATED: "#e07b54",
    CLOSED: "#a0a0a0",
};

export function ConversationsResult({ result }: { result: ConversationRow[] }) {
    const statusCount: Record<string, number> = {};
    result.forEach((c) => {
        const s = c.status ?? "UNKNOWN";
        statusCount[s] = (statusCount[s] ?? 0) + 1;
    });
    const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    return (
        <ToolCard title={`Conversations (${result.length})`}>
            <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map((entry, i) => (
                            <Cell key={i} fill={CONV_STATUS_COLOURS[entry.name] ?? COLOURS[i % COLOURS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b text-muted-foreground">
                            <th className="pb-2 text-left font-semibold">Customer</th>
                            <th className="pb-2 text-left font-semibold">Status</th>
                            <th className="pb-2 text-right font-semibold">Messages</th>
                            <th className="pb-2 text-right font-semibold">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.slice(0, 12).map((c, i) => (
                            <tr key={c.id ?? i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="py-1.5 pr-3 max-w-[110px] truncate">{c.user?.name ?? c.user?.email ?? "Guest"}</td>
                                <td className="py-1.5 pr-3">
                                    <span
                                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                        style={{ background: CONV_STATUS_COLOURS[c.status ?? ""] ?? "#a0a0a0" }}
                                    >
                                        {c.status}
                                    </span>
                                </td>
                                <td className="py-1.5 text-right text-muted-foreground">{Array.isArray(c.messages) ? c.messages.length : "—"}</td>
                                <td className="py-1.5 text-right text-muted-foreground">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {result.length > 12 && (
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">+{result.length - 12} more</p>
                )}
            </div>
        </ToolCard>
    );
}

// ─── Generic success/mutation result ──────────────────────────────────────────

interface MutationResult {
    success?: boolean;
    message?: string;
    error?: string;
    [key: string]: unknown;
}

export function MutationResultCard({ toolName, result }: { toolName: string; result: MutationResult }) {
    const isError = !!result.error || result.success === false;
    return (
        <div className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            isError
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
        )}>
            <p className="font-semibold">{isError ? "⚠ " : "✓ "}{toolName}</p>
            <p className="text-xs mt-0.5">{result.message ?? result.error ?? JSON.stringify(result)}</p>
        </div>
    );
}

// ─── Router: pick the right component for a tool name ─────────────────────────

const LIST_TOOLS = new Set(["listUsers", "listProducts", "listInventory", "listOrders", "listConversations", "getDashboardStats"]);

export function ToolResultRenderer({ toolName, result }: { toolName: string; result: unknown }) {
    // If the result is an error object, show mutation card
    if (result && typeof result === "object" && !Array.isArray(result)) {
        const r = result as Record<string, unknown>;
        if (r.error && !LIST_TOOLS.has(toolName)) {
            return <MutationResultCard toolName={toolName} result={r as MutationResult} />;
        }
    }

    switch (toolName) {
        case "getDashboardStats":
            return <DashboardStatsResult result={result as DashboardStats} />;

        case "listUsers":
            return Array.isArray(result)
                ? <UsersTableResult result={result as UserRow[]} />
                : <MutationResultCard toolName={toolName} result={result as MutationResult} />;

        case "listInventory":
        case "adjustInventory":
            return Array.isArray(result)
                ? <InventoryChartResult result={result as InventoryRow[]} />
                : <MutationResultCard toolName={toolName} result={result as MutationResult} />;

        case "listOrders":
            return Array.isArray(result)
                ? <OrdersResult result={result as OrderRow[]} />
                : <MutationResultCard toolName={toolName} result={result as MutationResult} />;

        case "listProducts":
        case "getProductCategories":
            return Array.isArray(result)
                ? <ProductsResult result={result as ProductRow[]} />
                : <MutationResultCard toolName={toolName} result={result as MutationResult} />;

        case "listConversations":
            return Array.isArray(result)
                ? <ConversationsResult result={result as ConversationRow[]} />
                : <MutationResultCard toolName={toolName} result={result as MutationResult} />;

        default:
            return <MutationResultCard toolName={toolName} result={result as MutationResult} />;
    }
}

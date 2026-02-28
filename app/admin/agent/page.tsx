import AdminAIAgent from "@/components/admin/AdminAIAgent";

export default function AdminAgentPage() {
    return (
        <section className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">AI Agent</h1>
                <p className="text-muted-foreground text-sm">
                    Text-based admin assistant with full tool access to users, products, inventory, orders, and conversations.
                </p>
            </div>
            <AdminAIAgent />
        </section>
    );
}

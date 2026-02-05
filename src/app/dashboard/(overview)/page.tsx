import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDb } from "@/lib/firebase-admin";

export default async function DashboardPage() {
    // SINGLE TENANT / ADMIN MODE
    // Fetch the first shop found in Firestore
    const shopsSnap = await adminDb.collection('shops').limit(1).get();
    let shopData = null;

    if (!shopsSnap.empty) {
        const data = shopsSnap.docs[0].data();
        shopData = {
            name: data.shopName || 'Unknown Shop',
            id: data.shopeeShopId,
            isConnected: !!data.accessToken
        };
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard (Firebase)</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shop Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {shopData ? (shopData.isConnected ? "Online 🟢" : "Disconnected 🔴") : "No Shop Configured"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {shopData ? `ID: ${shopData.id}` : "Please connect database"}
                        </p>
                    </CardContent>
                </Card>
                {/* ... Add more cards ... */}
            </div>
        </div>
    );
}

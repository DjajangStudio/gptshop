"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function SettingsPage() {
    const handleConnect = () => {
        // Redirect to our login route
        window.location.href = '/api/auth/shopee/login';
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your shop connections.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Shopee Connection</CardTitle>
                        <CardDescription>Connect your Shopee Seller account to enable automation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleConnect} className="w-full bg-orange-500 hover:bg-orange-600">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Connect Shopee Shop
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

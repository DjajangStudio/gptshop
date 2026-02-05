import Link from "next/link"
import { Package, LayoutDashboard, Settings, ScrollText, MessageSquareQuote } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex sm:w-64">

                {/* LOGO AREA */}
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="text-orange-600 text-lg">🛍️ OpenShopee</span>
                    </Link>
                </div>

                {/* NAVIGATION */}
                <nav className="flex flex-col gap-4 px-2 sm:py-5">
                    <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Platform
                    </h3>

                    <Link
                        href="/dashboard"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        href="/dashboard/products"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium bg-accent/50 text-accent-foreground hover:bg-accent"
                    >
                        <Package className="mr-2 h-4 w-4" />
                        <span>Product Mapping</span>
                    </Link>

                    <Link
                        href="/dashboard/logs"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                        <ScrollText className="mr-2 h-4 w-4" />
                        <span>Order Logs</span>
                    </Link>

                    <h3 className="mt-4 mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Automation
                    </h3>

                    <Link
                        href="/dashboard/automation"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                        <MessageSquareQuote className="mr-2 h-4 w-4" />
                        <span>Auto-Reply & Rating</span>
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configuration</span>
                    </Link>
                </nav>
            </aside>

            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 sm:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <div className="relative ml-auto flex-1 md:grow-0">
                        {/* Search placeholder */}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1 rounded-full border shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            DrizzleORM Connected
                        </div>
                    </div>
                </header>

                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

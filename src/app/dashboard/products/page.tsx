import { ProductMappingTable } from "@/components/dashboard/product-mapping-table";

export default function ProductsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your Shopee product mappings and digital download links.
                    </p>
                </div>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <ProductMappingTable />
            </div>
        </div>
    );
}

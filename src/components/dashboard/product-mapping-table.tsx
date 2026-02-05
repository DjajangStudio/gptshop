"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, RefreshCw, Link as LinkIcon, Edit2, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { EditProductDialog } from "./edit-product-dialog"

export type Product = {
    id: string
    sku: string
    name: string
    downloadLink: string | null
    isActive: boolean
    shopeeItemId: number
}

// MOCK DATA - To be replaced with real data from DB
const initialData: Product[] = [
    {
        id: "1",
        sku: "VIDEO_AI",
        name: "Video Cerita AI: Kumpulan Prompt Mudah",
        downloadLink: "https://drive.google.com/drive/folders/1_ZHDE...",
        isActive: true,
        shopeeItemId: 24745308526
    },
    {
        id: "2",
        sku: "70.000_PROMPT",
        name: "70.000+ Prompts ChatGPT Mega Pack",
        downloadLink: "https://drive.google.com/drive/folders/1Rez4IP...",
        isActive: true,
        shopeeItemId: 41802932900
    },
    {
        id: "3",
        sku: "CANVA_BUNDLE",
        name: "Jago Canva Dalam 24 Jam",
        downloadLink: null,
        isActive: false,
        shopeeItemId: 42503264716
    },
]

export function ProductMappingTable() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [data, setData] = React.useState<Product[]>(initialData)
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
    const [isEditOpen, setIsEditOpen] = React.useState(false)

    const handleSaveProduct = async (updatedProduct: Product) => {
        try {
            // Optimistic update for UI
            setData(prev => prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
            toast.success("Product Updated (Local Mock)");

            // Real API call (can be enabled when API is ready)
            /*
           const response = await fetch(`/api/products/${updatedProduct.id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(updatedProduct)
           });
           if (!response.ok) throw new Error("Failed to update");
           */
            setIsEditOpen(false);
        } catch (error: any) {
            toast.error(`Update Failed: ${error.message}`);
        }
    }

    const columns: ColumnDef<Product>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "sku",
            header: "SKU",
            cell: ({ row }) => (
                <div className="font-medium font-mono text-xs">{row.getValue("sku")}</div>
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Product Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="max-w-[300px] truncate" title={row.getValue("name")}>{row.getValue("name")}</div>,
        },
        {
            accessorKey: "downloadLink",
            header: "Download Link",
            cell: ({ row }) => {
                const link = row.getValue("downloadLink") as string
                return link ? (
                    <div className="flex items-center gap-2 text-blue-600 underline text-xs max-w-[200px] truncate">
                        <LinkIcon className="w-3 h-3" />
                        <a href={link} target="_blank" rel="noreferrer">{link}</a>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        Missing Link
                    </div>
                )
            },
        },
        {
            accessorKey: "isActive",
            header: "Auto-Send",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <Switch checked={row.getValue("isActive")} onCheckedChange={() => { }} />
                        <span className="text-xs text-muted-foreground">{row.getValue("isActive") ? 'On' : 'Off'}</span>
                    </div>
                )
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const product = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(product.sku)}
                            >
                                Copy SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsEditOpen(true); }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Mapping
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Disable Automation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    const handleSync = () => {
        setIsSyncing(true)
        toast.info("Syncing products from Shopee...", {
            description: "This process involves fetching data from Shopee Open Platform."
        })

        // Simulate API call
        setTimeout(() => {
            setIsSyncing(false)
            toast.success("Sync Complete", {
                description: "Successfully synced 24 products from Shopee."
            })
        }, 2000)
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter by SKU..."
                        value={(table.getColumn("sku")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("sku")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm w-[200px]"
                    />
                    <Input
                        placeholder="Search product name..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm w-[300px]"
                    />
                </div>

                <Button onClick={handleSync} disabled={isSyncing} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync from Shopee'}
                </Button>
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
            {editingProduct && (
                <EditProductDialog
                    product={editingProduct}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    onSave={handleSaveProduct}
                />
            )}
        </div>
    )
}

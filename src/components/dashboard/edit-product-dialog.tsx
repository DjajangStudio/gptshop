"use client"

import * as React from "react"
import { Copy, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Product } from "./product-mapping-table"
import { toast } from "sonner"

interface EditProductDialogProps {
    product: Product
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (updatedProduct: Product) => void
}

export function EditProductDialog({ product, open, onOpenChange, onSave }: EditProductDialogProps) {
    const [downloadLink, setDownloadLink] = React.useState(product.downloadLink || "")
    const [isActive, setIsActive] = React.useState(product.isActive)
    const [template, setTemplate] = React.useState("Terima kasih sudah order! 🎉\n\nBerikut link download produk kamu:\n{link}\n\nJangan lupa beri ⭐⭐⭐⭐⭐ ya kak!")

    const handleSave = () => {
        onSave({
            ...product,
            downloadLink: downloadLink,
            isActive: isActive
        })
        toast.success("Mapping Saved", {
            description: `Updated mapping for SKU: ${product.sku}`
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Product Mapping</DialogTitle>
                    <DialogDescription>
                        Map digital product links to Shopee SKUs.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="sku" className="sr-only">
                            SKU
                        </Label>
                        <Input
                            id="sku"
                            defaultValue={product.sku}
                            readOnly
                            className="bg-muted font-mono text-sm"
                        />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={() => navigator.clipboard.writeText(product.sku)}>
                        <span className="sr-only">Copy</span>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" value={product.name} readOnly className="bg-muted" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="link">Download Link (Google Drive/etc)</Label>
                        <Input
                            id="link"
                            placeholder="https://..."
                            value={downloadLink}
                            onChange={(e) => setDownloadLink(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="template">Chat Template</Label>
                        <Textarea
                            id="template"
                            placeholder="Message..."
                            className="h-24 resize-none"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                        />
                        <span className="text-[10px] text-muted-foreground">* Use <code>{'{link}'}</code> as placeholder for the URL.</span>
                    </div>

                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Auto-Send</Label>
                            <div className="text-[10px] text-muted-foreground">
                                Automatically send chat when ordered
                            </div>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                </div>
                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button type="button" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Plus, ImageIcon, Package, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "./ProductCard";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Omit<Product, "id">) => void;
  categories: string[];
}

const defaultProduct: Omit<Product, "id"> = {
  name: "",
  sku: "",
  price: 0,
  comparePrice: undefined,
  stock: 0,
  category: "",
  status: "draft",
  image: "",
  sizes: [],
  colors: [],
};

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const colorOptions = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Pink", value: "#EC4899" },
  { name: "Purple", value: "#A855F7" },
  { name: "Orange", value: "#F97316" },
  { name: "Gray", value: "#6B7280" },
];

export function ProductModal({
  open,
  onOpenChange,
  product,
  onSave,
  categories,
}: ProductModalProps) {
  const [formData, setFormData] = useState<Omit<Product, "id">>(defaultProduct);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        category: product.category,
        status: product.status,
        image: product.image,
        sizes: product.sizes || [],
        colors: product.colors || [],
      });
      setImages(product.image ? [product.image] : []);
    } else {
      setFormData(defaultProduct);
      setImages([]);
    }
    setErrors({});
  }, [product, open]);

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setImages((prev) => [...prev, result]);
          if (!formData.image) {
            updateField("image", result);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (index === 0 && newImages.length > 0) {
        updateField("image", newImages[0]);
      } else if (newImages.length === 0) {
        updateField("image", "");
      }
      return newImages;
    });
  };

  const toggleSize = (size: string) => {
    const sizes = formData.sizes || [];
    if (sizes.includes(size)) {
      updateField("sizes", sizes.filter((s) => s !== size));
    } else {
      updateField("sizes", [...sizes, size]);
    }
  };

  const toggleColor = (color: string) => {
    const colors = formData.colors || [];
    if (colors.includes(color)) {
      updateField("colors", colors.filter((c) => c !== color));
    } else {
      updateField("colors", [...colors, color]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";
    if (!formData.category) newErrors.category = "Category is required";
    if (formData.stock < 0) newErrors.stock = "Stock cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave({
        ...formData,
        image: images[0] || "/placeholder.svg",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details below"
              : "Fill in the details to add a new product"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={img}
                      alt={`Product ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <Badge className="absolute bottom-1 left-1 text-xs">Main</Badge>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <Upload className="mb-1 h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter product name"
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* SKU & Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateField("sku", e.target.value.toUpperCase())}
                  placeholder="e.g., EKT-001"
                  className={cn(errors.sku && "border-destructive")}
                />
                {errors.sku && (
                  <p className="text-xs text-destructive">{errors.sku}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField("category", value)}
                >
                  <SelectTrigger className={cn(errors.category && "border-destructive")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Product["status"]) =>
                  updateField("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Pricing & Stock Tab */}
          <TabsContent value="pricing" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Price (৳) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) => updateField("price", Number(e.target.value))}
                  placeholder="0"
                  className={cn(errors.price && "border-destructive")}
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comparePrice">Compare at Price (৳)</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  min="0"
                  value={formData.comparePrice || ""}
                  onChange={(e) =>
                    updateField(
                      "comparePrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Original price before discount
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Stock Quantity *
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || ""}
                onChange={(e) => updateField("stock", Number(e.target.value))}
                placeholder="0"
                className={cn(errors.stock && "border-destructive")}
              />
              {errors.stock && (
                <p className="text-xs text-destructive">{errors.stock}</p>
              )}
              {formData.stock <= 10 && formData.stock > 0 && (
                <p className="text-xs text-warning">Low stock warning</p>
              )}
              {formData.stock === 0 && (
                <p className="text-xs text-destructive">Out of stock</p>
              )}
            </div>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-4 pt-4">
            {/* Sizes */}
            <div className="space-y-2">
              <Label>Available Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={formData.sizes?.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <Label>Available Colors</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => toggleColor(color.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      formData.colors?.includes(color.value)
                        ? "border-accent ring-2 ring-accent ring-offset-2"
                        : "border-border hover:border-muted-foreground"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              {formData.colors && formData.colors.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {formData.colors.map((color) => {
                    const colorName = colorOptions.find((c) => c.value === color)?.name;
                    return (
                      <Badge key={color} variant="secondary" className="gap-1">
                        <div
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                        />
                        {colorName}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleColor(color)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Plus className="h-4 w-4" />
            {product ? "Update Product" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

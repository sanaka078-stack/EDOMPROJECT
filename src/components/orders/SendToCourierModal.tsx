import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Package, MapPin, Phone, User, Loader2, CheckCircle2 } from "lucide-react";
import { useSteadfastCourier, type SteadfastOrder } from "@/hooks/useSteadfastCourier";
import { usePathaoCourier, type PathaoOrder, type PathaoCity, type PathaoZone, type PathaoArea } from "@/hooks/usePathaoCourier";
import { useShipmentsData } from "@/hooks/useShipmentsData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: any;
  total: number;
  items: Array<{
    product_name: string;
    quantity: number;
  }>;
}

interface SendToCourierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderData | null;
  onSuccess?: () => void;
}

type CourierType = "steadfast" | "pathao";

export function SendToCourierModal({ open, onOpenChange, order, onSuccess }: SendToCourierModalProps) {
  const [selectedCourier, setSelectedCourier] = useState<CourierType>("steadfast");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Steadfast state
  const steadfastCourier = useSteadfastCourier();

  // Pathao state
  const pathaoCourier = usePathaoCourier();
  const [cities, setCities] = useState<PathaoCity[]>([]);
  const [zones, setZones] = useState<PathaoZone[]>([]);
  const [areas, setAreas] = useState<PathaoArea[]>([]);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [pathaoStoreId, setPathaoStoreId] = useState<number | null>(null);

  // Common form data
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [codAmount, setCodAmount] = useState(0);
  const [note, setNote] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const { addShipment, getShipmentByOrderId } = useShipmentsData();

  // Check if order already sent
  const alreadySent = order ? !!getShipmentByOrderId(order.id) : false;

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setRecipientName(order.customer_name || "");
      setRecipientPhone(order.customer_phone || "");
      
      const addr = order.shipping_address;
      if (addr) {
        if (typeof addr === 'string') {
          setRecipientAddress(addr);
        } else if (typeof addr === 'object') {
          const parts = [addr.street, addr.area, addr.city].filter(Boolean);
          setRecipientAddress(parts.join(', '));
        }
      }
      
      setCodAmount(order.total || 0);
      setItemDescription(order.items?.map(i => `${i.product_name} x${i.quantity}`).join(', ') || "");
      setNote("");
      setSubmitted(false);
      setSelectedCity(null);
      setSelectedZone(null);
      setSelectedArea(null);
    }
  }, [order]);

  // Load Pathao cities and store_id when Pathao is selected
  useEffect(() => {
    if (selectedCourier === "pathao") {
      if (cities.length === 0) {
        pathaoCourier.getCities().then(setCities).catch(console.error);
      }
      // Fetch Pathao store_id from settings
      (supabase
        .from('store_settings' as any)
        .select('value')
        .eq('key', 'PATHAO_STORE_ID')
        .single() as any)
        .then(({ data }: any) => {
          if (data?.value) {
            const val = typeof data.value === 'string' ? data.value : String(data.value);
            setPathaoStoreId(parseInt(val));
          }
        });
    }
  }, [selectedCourier]);

  // Load zones when city is selected
  useEffect(() => {
    if (selectedCity) {
      pathaoCourier.getZones(selectedCity).then(setZones).catch(console.error);
      setSelectedZone(null);
      setSelectedArea(null);
      setAreas([]);
    }
  }, [selectedCity]);

  // Load areas when zone is selected
  useEffect(() => {
    if (selectedZone) {
      pathaoCourier.getAreas(selectedZone).then(setAreas).catch(console.error);
      setSelectedArea(null);
    }
  }, [selectedZone]);

  const handleSubmit = async () => {
    if (!order) return;

    // Validation
    if (!recipientName || !recipientPhone || !recipientAddress) {
      toast.error("অনুগ্রহ করে সব তথ্য পূরণ করুন");
      return;
    }

    if (selectedCourier === "pathao" && (!selectedCity || !selectedZone)) {
      toast.error("অনুগ্রহ করে সিটি ও জোন সিলেক্ট করুন");
      return;
    }

    setIsSubmitting(true);

    try {
      let consignmentId = "";
      let trackingCode = "";

      if (selectedCourier === "steadfast") {
        const steadfastOrder: SteadfastOrder = {
          invoice: order.order_number,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress,
          cod_amount: codAmount,
          note: note || undefined,
          item_description: itemDescription || undefined,
        };

        const result = await steadfastCourier.createOrder(steadfastOrder);
        if (result?.consignment) {
          consignmentId = result.consignment.consignment_id?.toString() || "";
          trackingCode = result.consignment.tracking_code || "";
        }
      } else {
        if (!pathaoStoreId) {
          throw new Error("Pathao Store ID সেট করা নেই। Settings > Integrations থেকে Store সিলেক্ট করুন।");
        }

        const pathaoOrder: PathaoOrder = {
          store_id: pathaoStoreId,
          merchant_order_id: order.order_number,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress,
          recipient_city: selectedCity!,
          recipient_zone: selectedZone!,
          recipient_area: selectedArea || undefined,
          amount_to_collect: codAmount,
          special_instruction: note || undefined,
          item_description: itemDescription || undefined,
          item_quantity: order.items?.length || 1,
        };

        const result = await pathaoCourier.createOrder(pathaoOrder);
        if (result?.data) {
          consignmentId = result.data.consignment_id || "";
          trackingCode = result.data.tracking_code || "";
        }
      }

      // Save to shipments table
      await addShipment({
        order_id: order.id,
        courier: selectedCourier,
        consignment_id: consignmentId,
        tracking_number: trackingCode,
        status: "pending",
        courier_response: {
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress,
          cod_amount: codAmount,
          notes: note || null,
        },
      });

      setSubmitted(true);
      toast.success(`${selectedCourier === 'steadfast' ? 'Steadfast' : 'Pathao'} এ সফলভাবে অর্ডার পাঠানো হয়েছে`);
      onSuccess?.();
      
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      console.error("Courier submission error:", error);
      toast.error(`অর্ডার পাঠাতে সমস্যা হয়েছে: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            কুরিয়ারে পাঠান - {order.order_number}
          </DialogTitle>
          <DialogDescription>
            অর্ডারটি ডেলিভারির জন্য কুরিয়ার সার্ভিসে পাঠান
          </DialogDescription>
        </DialogHeader>

        {alreadySent ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium">এই অর্ডার আগেই কুরিয়ারে পাঠানো হয়েছে</p>
            <p className="text-sm text-muted-foreground mt-2">
              শিপিং পেজে গিয়ে ট্র্যাকিং দেখতে পারেন
            </p>
          </div>
        ) : submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium">অর্ডার সফলভাবে পাঠানো হয়েছে!</p>
          </div>
        ) : (
          <>
            {/* Courier Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">কুরিয়ার সিলেক্ট করুন</Label>
              <RadioGroup
                value={selectedCourier}
                onValueChange={(value) => setSelectedCourier(value as CourierType)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="steadfast"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourier === "steadfast"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="steadfast" id="steadfast" />
                  <div>
                    <p className="font-medium">Steadfast</p>
                    <p className="text-xs text-muted-foreground">Fast & Reliable</p>
                  </div>
                </Label>
                <Label
                  htmlFor="pathao"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourier === "pathao"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="pathao" id="pathao" />
                  <div>
                    <p className="font-medium">Pathao</p>
                    <p className="text-xs text-muted-foreground">Wide Coverage</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <Separator />

            {/* Order Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.items?.length || 0} আইটেম</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {itemDescription}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    ৳{order.total.toLocaleString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Details */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                প্রাপকের তথ্য
              </h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">নাম *</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="প্রাপকের নাম"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">ফোন *</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Pathao Location Selectors */}
              {selectedCourier === "pathao" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>সিটি *</Label>
                    <Select
                      value={selectedCity?.toString() || ""}
                      onValueChange={(value) => setSelectedCity(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সিটি সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-60">
                        {cities.map((city) => (
                          <SelectItem key={city.city_id} value={city.city_id.toString()}>
                            {city.city_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>জোন *</Label>
                    <Select
                      value={selectedZone?.toString() || ""}
                      onValueChange={(value) => setSelectedZone(parseInt(value))}
                      disabled={!selectedCity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="জোন সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-60">
                        {zones.map((zone) => (
                          <SelectItem key={zone.zone_id} value={zone.zone_id.toString()}>
                            {zone.zone_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>এরিয়া</Label>
                    <Select
                      value={selectedArea?.toString() || ""}
                      onValueChange={(value) => setSelectedArea(parseInt(value))}
                      disabled={!selectedZone}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="এরিয়া (ঐচ্ছিক)" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-60">
                        {areas.map((area) => (
                          <SelectItem key={area.area_id} value={area.area_id.toString()}>
                            {area.area_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="recipientAddress">ঠিকানা *</Label>
                <Textarea
                  id="recipientAddress"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="সম্পূর্ণ ঠিকানা"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codAmount">COD পরিমাণ (৳)</Label>
                  <Input
                    id="codAmount"
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">নোট (ঐচ্ছিক)</Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="বিশেষ নির্দেশনা"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                বাতিল
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    কুরিয়ারে পাঠান
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

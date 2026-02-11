import { useState, useEffect } from "react";
import { MapPin, Check, Plus, Home, Building, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UserAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  street_address: string;
  area: string | null;
  city: string;
  postal_code: string | null;
  country: string | null;
  is_default: boolean | null;
}

interface SavedAddressSelectorProps {
  userId: string;
  type: "shipping" | "billing";
  onSelectAddress: (address: UserAddress | null) => void;
  onUseNewAddress: () => void;
}

export function SavedAddressSelector({
  userId,
  type,
  onSelectAddress,
  onUseNewAddress,
}: SavedAddressSelectorProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [useNewAddress, setUseNewAddress] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Use all addresses since we don't have address_type in schema
      const filteredAddresses = data || [];

      setAddresses(filteredAddresses as UserAddress[]);

      // Auto-select default address
      if (filteredAddresses.length > 0) {
        const defaultAddress = filteredAddresses.find((addr) => addr.is_default);
        
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          onSelectAddress(defaultAddress as UserAddress);
        } else {
          // Select first address if no default
          setSelectedAddressId(filteredAddresses[0].id);
          onSelectAddress(filteredAddresses[0] as UserAddress);
        }
      } else {
        setUseNewAddress(true);
        onUseNewAddress();
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (addressId: string) => {
    if (addressId === "new") {
      setSelectedAddressId(null);
      setUseNewAddress(true);
      onSelectAddress(null);
      onUseNewAddress();
    } else {
      setSelectedAddressId(addressId);
      setUseNewAddress(false);
      const address = addresses.find((a) => a.id === addressId);
      if (address) {
        onSelectAddress(address);
      }
    }
  };

  const getAddressIcon = (addressType: string) => {
    switch (addressType) {
      case "shipping":
        return <Truck className="h-4 w-4" />;
      case "billing":
        return <Building className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Loading saved addresses...
      </div>
    );
  }

  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MapPin className="h-4 w-4 text-store-primary" />
        Saved {type === "shipping" ? "Shipping" : "Billing"} Addresses
      </div>

      <RadioGroup
        value={useNewAddress ? "new" : selectedAddressId || ""}
        onValueChange={handleAddressChange}
        className="space-y-2"
      >
        {addresses.map((address) => {
          const isDefault = address.is_default;

          return (
            <label
              key={address.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAddressId === address.id && !useNewAddress
                  ? "border-store-primary bg-store-primary/5"
                  : "hover:border-muted-foreground/50"
              }`}
            >
              <RadioGroupItem value={address.id} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm capitalize">
                    {address.label || "Address"}
                  </span>
                  <Home className="h-4 w-4 text-muted-foreground" />
                  {isDefault && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-store-primary/10 text-store-primary"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {address.full_name} • {address.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.street_address}
                  {address.area && `, ${address.area}`}, {address.city}
                  {address.postal_code && ` - ${address.postal_code}`}
                </p>
              </div>
            </label>
          );
        })}

        {/* New Address Option */}
        <label
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            useNewAddress
              ? "border-store-primary bg-store-primary/5"
              : "hover:border-muted-foreground/50 border-dashed"
          }`}
        >
          <RadioGroupItem value="new" />
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-store-primary" />
            <span className="text-sm font-medium">Use a new address</span>
          </div>
        </label>
      </RadioGroup>
    </div>
  );
}

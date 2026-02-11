import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Smartphone, CreditCard, Banknote } from "lucide-react";
import { usePaymentMethods, PaymentMethod, SYSTEM_METHOD_IDS } from "@/hooks/usePaymentMethods";
import { PaymentMethodConfig } from "./PaymentMethodConfig";
import { SortablePaymentMethod } from "./SortablePaymentMethod";

export function PaymentSettings() {
  const { 
    paymentMethods, 
    loading, 
    saving, 
    toggleEnabled, 
    toggleTestMode, 
    configurePaymentMethod,
    reorderPaymentMethods,
    uploadImage,
  } = usePaymentMethods();
  const [configuring, setConfiguring] = useState<PaymentMethod | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group payment methods by type
  const mobilePayments = paymentMethods.filter(pm => pm.type === "mobile");
  const gateways = paymentMethods.filter(pm => pm.type === "gateway");
  const otherMethods = paymentMethods.filter(pm => pm.type === "manual");

  const handleDragEnd = (event: DragEndEvent, group: PaymentMethod[]) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = group.findIndex((item) => item.id === active.id);
      const newIndex = group.findIndex((item) => item.id === over.id);

      const reorderedGroup = arrayMove(group, oldIndex, newIndex);
      
      // Reconstruct full array with updated group
      const newMethods = paymentMethods.map(pm => {
        const updatedItem = reorderedGroup.find(g => g.id === pm.id);
        return updatedItem || pm;
      });

      // Recalculate display_order for all
      const finalMethods = newMethods.sort((a, b) => {
        const aInGroup = reorderedGroup.find(g => g.id === a.id);
        const bInGroup = reorderedGroup.find(g => g.id === b.id);
        
        if (aInGroup && bInGroup) {
          return reorderedGroup.indexOf(aInGroup) - reorderedGroup.indexOf(bInGroup);
        }
        return (a.display_order || 0) - (b.display_order || 0);
      });

      reorderPaymentMethods(finalMethods);
    }
  };

  const PaymentMethodGroup = ({ 
    methods, 
    title, 
    description, 
    icon: Icon,
  }: { 
    methods: PaymentMethod[]; 
    title: string; 
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-accent" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No payment methods in this category
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, methods)}
          >
            <SortableContext items={methods.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {methods.map((method) => (
                <SortablePaymentMethod
                  key={method.id}
                  method={method}
                  saving={saving}
                  onConfigure={setConfiguring}
                  onToggleEnabled={toggleEnabled}
                  onToggleTestMode={toggleTestMode}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Mobile Payments */}
      <PaymentMethodGroup
        methods={mobilePayments}
        title="Mobile Payment Methods"
        description="Configure bKash, Nagad, Rocket and other mobile payment options. Drag to reorder."
        icon={Smartphone}
      />

      {/* Payment Gateways */}
      <PaymentMethodGroup
        methods={gateways}
        title="Payment Gateways"
        description="Accept credit/debit cards and online banking. Drag to reorder."
        icon={CreditCard}
      />

      {/* Other Methods */}
      <PaymentMethodGroup
        methods={otherMethods}
        title="Other Payment Methods"
        description="Cash on delivery and other options"
        icon={Banknote}
      />

      {/* Configuration Modal */}
      <PaymentMethodConfig
        method={configuring}
        open={!!configuring}
        onOpenChange={(open) => !open && setConfiguring(null)}
        onSave={configurePaymentMethod}
        onUploadImage={uploadImage}
      />
    </div>
  );
}

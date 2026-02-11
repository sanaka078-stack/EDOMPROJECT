import { StoreLayout } from "@/layouts/StoreLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Ruler, Info } from "lucide-react";

const mensSizes = [
  { size: "S", chest: "36-38", waist: "28-30", hip: "36-38" },
  { size: "M", chest: "38-40", waist: "30-32", hip: "38-40" },
  { size: "L", chest: "40-42", waist: "32-34", hip: "40-42" },
  { size: "XL", chest: "42-44", waist: "34-36", hip: "42-44" },
  { size: "XXL", chest: "44-46", waist: "36-38", hip: "44-46" },
];

const womensSizes = [
  { size: "XS", bust: "32-33", waist: "24-25", hip: "34-35" },
  { size: "S", bust: "34-35", waist: "26-27", hip: "36-37" },
  { size: "M", bust: "36-37", waist: "28-29", hip: "38-39" },
  { size: "L", bust: "38-40", waist: "30-32", hip: "40-42" },
  { size: "XL", bust: "41-43", waist: "33-35", hip: "43-45" },
];

export default function SizeGuide() {
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
          Size Guide
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Find your perfect fit with our comprehensive size guide. All measurements are in inches.
        </p>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="men" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="men">Men's Sizes</TabsTrigger>
              <TabsTrigger value="women">Women's Sizes</TabsTrigger>
            </TabsList>

            <TabsContent value="men">
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size</TableHead>
                        <TableHead>Chest (inches)</TableHead>
                        <TableHead>Waist (inches)</TableHead>
                        <TableHead>Hip (inches)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mensSizes.map((row) => (
                        <TableRow key={row.size}>
                          <TableCell className="font-medium">{row.size}</TableCell>
                          <TableCell>{row.chest}</TableCell>
                          <TableCell>{row.waist}</TableCell>
                          <TableCell>{row.hip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="women">
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Size</TableHead>
                        <TableHead>Bust (inches)</TableHead>
                        <TableHead>Waist (inches)</TableHead>
                        <TableHead>Hip (inches)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {womensSizes.map((row) => (
                        <TableRow key={row.size}>
                          <TableCell className="font-medium">{row.size}</TableCell>
                          <TableCell>{row.bust}</TableCell>
                          <TableCell>{row.waist}</TableCell>
                          <TableCell>{row.hip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* How to Measure */}
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Ruler className="h-6 w-6 text-store-primary" />
              How to Measure
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Chest/Bust</h3>
                  <p className="text-sm text-muted-foreground">
                    Measure around the fullest part of your chest/bust, keeping the tape horizontal.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Waist</h3>
                  <p className="text-sm text-muted-foreground">
                    Measure around your natural waistline, the narrowest part of your torso.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Hip</h3>
                  <p className="text-sm text-muted-foreground">
                    Measure around the fullest part of your hips, about 8 inches below your waist.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tips */}
          <Card className="mt-8 bg-store-primary/5 border-store-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-store-primary" />
                Sizing Tips
              </h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• If you're between sizes, we recommend going up a size for a more comfortable fit</li>
                <li>• Our clothes are designed with a regular fit unless otherwise noted</li>
                <li>• Check individual product pages for specific fit recommendations</li>
                <li>• Still unsure? Contact us and we'll help you find the perfect size!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}

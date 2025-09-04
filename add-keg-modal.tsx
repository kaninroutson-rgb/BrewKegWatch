import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Download } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateKegId, generateQrCode } from "@/lib/qr-generator";
import { exportKegQRCodesPDF } from "@/lib/pdf-export";
import { type InsertKeg } from "@shared/schema";

const BEER_TYPES = [
  "Prickly Pear",
  "Peach",
  "Apple",
  "Rhubarb"
];

interface AddKegModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKegModal({ open, onOpenChange }: AddKegModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("half_bbl");
  const [status, setStatus] = useState("clean");
  const [location, setLocation] = useState("Storage");
  const [beerType, setBeerType] = useState("");
  const [createdKegs, setCreatedKegs] = useState<{ id: string; qrCode: string }[]>([]);

  const createKegsMutation = useMutation({
    mutationFn: async (kegs: InsertKeg[]) => {
      const results = [];
      for (const keg of kegs) {
        const result = await apiRequest("POST", "/api/kegs", keg);
        results.push(result);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/kegs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({ 
        title: `Successfully created ${results.length} keg${results.length > 1 ? 's' : ''}`,
        description: "QR codes are ready for PDF export"
      });
    },
    onError: () => {
      toast({ title: "Failed to create kegs", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setQuantity(1);
    setSize("half_bbl");
    setStatus("clean");
    setLocation("Storage");
    setBeerType("");
    setCreatedKegs([]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1) {
      toast({ 
        title: "Invalid quantity",
        description: "Please enter a quantity of at least 1",
        variant: "destructive" 
      });
      return;
    }
    
    // Validate full kegs have beer type
    if (status === "full" && (!beerType || beerType.trim() === "")) {
      toast({ 
        title: "Validation Error",
        description: "Beer type is required for full kegs",
        variant: "destructive" 
      });
      return;
    }
    
    // Generate kegs with unique IDs and QR codes
    const kegsToCreate: InsertKeg[] = [];
    const newCreatedKegs: { id: string; qrCode: string }[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const kegId = generateKegId();
      const qrCode = generateQrCode(kegId);
      
      const keg: InsertKeg = {
        id: kegId,
        qrCode,
        size: size as "half_bbl" | "sixth_bbl",
        status: status as "full" | "dirty" | "clean" | "deployed",
        location,
        beerType: status === "clean" ? null : (beerType || null),
      };
      
      kegsToCreate.push(keg);
      newCreatedKegs.push({ id: kegId, qrCode });
    }
    
    setCreatedKegs(newCreatedKegs);
    createKegsMutation.mutate(kegsToCreate);
  };

  const handleExportPDF = async () => {
    if (createdKegs.length === 0) {
      toast({
        title: "No kegs to export",
        description: "Create kegs first before exporting QR codes",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const filename = `keg-qr-codes-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportKegQRCodesPDF(createdKegs, filename);
      toast({
        title: "PDF exported successfully",
        description: `Downloaded ${filename} with ${createdKegs.length} QR codes`
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to generate PDF file",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="add-keg-modal-title">Add New Keg</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-close-add-keg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity" data-testid="label-quantity">Number of Kegs *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="1"
              className="mt-1"
              data-testid="input-quantity"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique IDs and QR codes will be generated automatically (no limit)
            </p>
          </div>

          <div>
            <Label htmlFor="size" data-testid="label-keg-size">Keg Size *</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="mt-1" data-testid="select-keg-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="half_bbl">1/2 bbl (Half Barrel)</SelectItem>
                <SelectItem value="sixth_bbl">1/6 bbl (Sixth Barrel)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status" data-testid="label-keg-status">Status</Label>
            <Select value={status} onValueChange={(value) => {
              // Clear beer type when status is set to clean
              if (value === "clean") {
                setBeerType('');
              }
              setStatus(value);
            }}>
              <SelectTrigger className="mt-1" data-testid="select-keg-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="dirty">Dirty</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" data-testid="label-keg-location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Storage Tank 1"
              className="mt-1"
              data-testid="input-keg-location"
            />
          </div>

          {status !== "clean" && (
            <div>
              <Label htmlFor="beerType" data-testid="label-beer-type">
                Beer Type {status === "full" && <span className="text-red-500">*</span>}
              </Label>
              <Select value={beerType} onValueChange={setBeerType}>
                <SelectTrigger className="mt-1" data-testid="select-beer-type">
                  <SelectValue placeholder={status === "full" ? "Beer type required" : "Select beer type"} />
                </SelectTrigger>
                <SelectContent>
                  {BEER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status === "full" && (!beerType || beerType.trim() === "") && (
                <p className="text-red-500 text-sm mt-1">Beer type is required for full kegs</p>
              )}
            </div>
          )}
          {status === "clean" && (
            <div>
              <Label data-testid="label-beer-type-disabled">Beer Type</Label>
              <p className="text-sm text-gray-500 mt-1">Clean kegs cannot have beer type assigned</p>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-add-keg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createKegsMutation.isPending}
              data-testid="button-submit-add-keg"
            >
              {createKegsMutation.isPending ? "Creating..." : `Create ${quantity} Keg${quantity > 1 ? 's' : ''}`}
            </Button>
          </div>
          
          {createdKegs.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-center mb-3">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Created {createdKegs.length} keg{createdKegs.length > 1 ? 's' : ''} successfully!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Export QR codes as PDF for printing
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPDF}
                className="w-full"
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Export QR Codes PDF
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

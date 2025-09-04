import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type InsertCustomer } from "@shared/schema";

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<InsertCustomer>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
    notes: "",
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      return apiRequest("POST", "/api/customers", customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "Customer created successfully" });
      handleClose();
    },
    onError: () => {
      toast({ title: "Failed to create customer", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      contactPerson: "",
      notes: "",
    });
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }
    
    createCustomerMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof InsertCustomer, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="add-customer-modal-title">Add New Customer</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-close-add-customer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" data-testid="label-customer-name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Hoppy Tavern"
              className="mt-1"
              data-testid="input-customer-name"
              required
            />
          </div>

          <div>
            <Label htmlFor="contactPerson" data-testid="label-contact-person">Contact Person</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              placeholder="e.g., John Smith"
              className="mt-1"
              data-testid="input-contact-person"
            />
          </div>

          <div>
            <Label htmlFor="email" data-testid="label-customer-email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="e.g., orders@hoppytavern.com"
              className="mt-1"
              data-testid="input-customer-email"
            />
          </div>

          <div>
            <Label htmlFor="phone" data-testid="label-customer-phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="e.g., (555) 123-4567"
              className="mt-1"
              data-testid="input-customer-phone"
            />
          </div>

          <div>
            <Label htmlFor="address" data-testid="label-customer-address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="e.g., 123 Beer St, Brewtown, BT 12345"
              className="mt-1"
              rows={2}
              data-testid="textarea-customer-address"
            />
          </div>

          <div>
            <Label htmlFor="notes" data-testid="label-customer-notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="e.g., Regular customer, prefers IPA kegs"
              className="mt-1"
              rows={2}
              data-testid="textarea-customer-notes"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-add-customer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createCustomerMutation.isPending}
              data-testid="button-submit-add-customer"
            >
              {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

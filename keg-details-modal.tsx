import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Beer, MapPin, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import type { Keg, UpdateKegStatus, Customer, Activity } from "@shared/schema";

const getStatusColor = (status: string) => {
  switch (status) {
    case "full": return "keg-status-full";
    case "deployed": return "keg-status-deployed";
    case "dirty": return "keg-status-dirty";
    case "clean": return "keg-status-clean";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getSizeColor = (size: string) => {
  return size === "half_bbl" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800";
};

const formatSize = (size: string) => {
  return size === "half_bbl" ? "1/2 bbl" : "1/6 bbl";
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const BEER_TYPES = [
  "Prickly Pear",
  "Peach",
  "Apple",
  "Rhubarb"
];

interface KegDetailsModalProps {
  keg: Keg;
  open: boolean;
  onClose: () => void;
}

export default function KegDetailsModal({ keg, open, onClose }: KegDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<UpdateKegStatus>({
    status: keg.status,
    location: keg.location || "",
    customerId: keg.customerId || "",
    beerType: keg.beerType || "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities", { kegId: keg.id }],
    enabled: showHistory,
  });

  const updateKegMutation = useMutation({
    mutationFn: async (data: UpdateKegStatus) => {
      const response = await apiRequest("PATCH", `/api/kegs/${keg.id}/status`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kegs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Keg status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update keg status",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate full kegs have beer type
    if (formData.status === "full" && (!formData.beerType || formData.beerType.trim() === "")) {
      toast({
        title: "Validation Error",
        description: "Beer type is required for full kegs",
        variant: "destructive"
      });
      return;
    }
    updateKegMutation.mutate(formData);
  };

  const handleQuickAction = (status: string) => {
    // Full kegs require beer type, so we shouldn't use quick action for them
    if (status === "full") {
      setFormData(prev => ({ ...prev, status: "full" }));
      setIsEditing(true);
      return;
    }
    
    const updateData: UpdateKegStatus = { 
      status: status as any,
      notes: `Quick action: marked as ${status}`,
    };
    
    if (status === "deployed" && formData.customerId) {
      updateData.customerId = formData.customerId;
    }
    
    updateKegMutation.mutate(updateData);
  };

  const selectedCustomer = customers.find((c: Customer) => c.id === keg.customerId);
  const deployedDays = keg.deployedAt ? 
    Math.floor((Date.now() - new Date(keg.deployedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Keg Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-keg-details">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keg Info */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
              keg.status === "full" ? "bg-green-100" :
              keg.status === "deployed" ? "bg-orange-100" :
              keg.status === "dirty" ? "bg-red-100" :
              keg.status === "clean" ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <Beer className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900" data-testid={`keg-details-id-${keg.id}`}>
              {keg.id}
            </h4>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge className={getStatusColor(keg.status)} data-testid={`keg-details-status-${keg.id}`}>
                {formatStatus(keg.status)}
              </Badge>
              <Badge className={getSizeColor(keg.size)} data-testid={`keg-details-size-${keg.id}`}>
                {formatSize(keg.size)}
              </Badge>
            </div>
          </div>

          {!isEditing ? (
            <>
              {/* Current Details */}
              <div className="space-y-3">
                {keg.beerType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Beer Type:</span>
                    <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-beer-type-${keg.id}`}>
                      {keg.beerType}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-location-${keg.id}`}>
                    {keg.location || "Unknown"}
                  </span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-customer-${keg.id}`}>
                      {selectedCustomer.name}
                    </span>
                  </div>
                )}
                {keg.deployedAt && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Deployed:</span>
                      <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-deployed-date-${keg.id}`}>
                        {format(new Date(keg.deployedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days Out:</span>
                      <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-days-out-${keg.id}`}>
                        {deployedDays} days
                      </span>
                    </div>
                  </>
                )}
                {keg.filledAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Filled:</span>
                    <span className="text-sm font-medium text-gray-900" data-testid={`keg-details-filled-date-${keg.id}`}>
                      {formatDistanceToNow(new Date(keg.filledAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {keg.status === "deployed" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickAction("dirty")}
                      disabled={updateKegMutation.isPending}
                      data-testid="button-mark-returned"
                    >
                      Mark Returned
                    </Button>
                  )}
                  {keg.status === "dirty" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickAction("clean")}
                      disabled={updateKegMutation.isPending}
                      data-testid="button-mark-cleaned"
                    >
                      Mark Cleaned
                    </Button>
                  )}
                  {keg.status === "clean" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Set status to full and open edit form to select beer type
                        setFormData(prev => ({ ...prev, status: "full" }));
                        setIsEditing(true);
                      }}
                      disabled={updateKegMutation.isPending}
                      data-testid="button-mark-filled"
                    >
                      Mark Filled
                    </Button>
                  )}
                  {keg.status === "full" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-deploy-keg"
                    >
                      Deploy Keg
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-keg"
                  >
                    Edit Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    data-testid="button-view-history"
                  >
                    {showHistory ? "Hide" : "View"} History
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => {
                    const newFormData = {...formData, status: value as any};
                    // Clear beer type when status is set to clean
                    if (value === "clean") {
                      newFormData.beerType = "";
                    }
                    setFormData(newFormData);
                  }}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="deployed">Deployed</SelectItem>
                      <SelectItem value="dirty">Dirty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Enter location"
                    data-testid="input-location"
                  />
                </div>

                {formData.status !== "clean" && (
                  <div>
                    <Label htmlFor="beerType">
                      Beer Type {formData.status === "full" && <span className="text-red-500">*</span>}
                    </Label>
                    <Select value={formData.beerType} onValueChange={(value) => setFormData({...formData, beerType: value})}>
                      <SelectTrigger data-testid="select-beer-type">
                        <SelectValue placeholder={formData.status === "full" ? "Beer type required" : "Select beer type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {BEER_TYPES.map((beerType) => (
                          <SelectItem key={beerType} value={beerType}>
                            {beerType}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.beerType === "custom" && (
                      <Input
                        className="mt-2"
                        value={formData.beerType}
                        onChange={(e) => setFormData({...formData, beerType: e.target.value})}
                        placeholder="Enter custom beer type"
                        data-testid="input-custom-beer-type"
                      />
                    )}
                    {formData.status === "full" && (!formData.beerType || formData.beerType.trim() === "") && (
                      <p className="text-red-500 text-sm mt-1">Beer type is required for full kegs</p>
                    )}
                  </div>
                )}
                {formData.status === "clean" && (
                  <div>
                    <Label>Beer Type</Label>
                    <p className="text-sm text-gray-500 mt-1">Clean kegs cannot have beer type assigned</p>
                  </div>
                )}

                {formData.status === "deployed" && (
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value})}>
                      <SelectTrigger data-testid="select-customer">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Enter notes"
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={updateKegMutation.isPending}
                    data-testid="button-save-changes"
                  >
                    {updateKegMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* History */}
          {showHistory && (
            <>
              <Separator />
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Activity History</h5>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No activity history</p>
                  ) : (
                    activities.map((activity: Activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 text-sm">
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-gray-900" data-testid={`activity-${activity.id}`}>
                            {activity.action} {activity.location && `at ${activity.location}`}
                          </p>
                          <p className="text-gray-500 text-xs" data-testid={`activity-time-${activity.id}`}>
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                          {activity.notes && (
                            <p className="text-gray-600 text-xs mt-1" data-testid={`activity-notes-${activity.id}`}>
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

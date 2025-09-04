import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit2, Trash2, Calendar, Beaker, Grape } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { FermentationBatch, InsertFermentationBatch } from "@shared/schema";

export default function Fermentation() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<FermentationBatch | null>(null);
  const [formData, setFormData] = useState<Partial<InsertFermentationBatch>>({
    fermentationId: "",
    date: new Date(),
    volume: "",
    incomingJuiceId: "",
    incomingJuiceVolume: "",
    juiceSource: "",
    brix: "",
    abv: "",
    sulfiteAdded: "",
    yeastStrain: "",
    yeastWeight: "",
    ph: "",
    titratableAcidity: "",
    copperSulfateAdded: "",
    rackingDates: [],
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fermentationBatches = [], isLoading } = useQuery({
    queryKey: ["/api/fermentation-batches"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFermentationBatch) => {
      return apiRequest("/api/fermentation-batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fermentation-batches"] });
      toast({ title: "Success", description: "Fermentation batch created successfully" });
      setShowAddModal(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create fermentation batch", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFermentationBatch> }) => {
      return apiRequest(`/api/fermentation-batches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fermentation-batches"] });
      toast({ title: "Success", description: "Fermentation batch updated successfully" });
      setEditingBatch(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update fermentation batch", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/fermentation-batches/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fermentation-batches"] });
      toast({ title: "Success", description: "Fermentation batch deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete fermentation batch", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      fermentationId: "",
      date: new Date(),
      volume: "",
      incomingJuiceId: "",
      incomingJuiceVolume: "",
      juiceSource: "",
      brix: "",
      abv: "",
      sulfiteAdded: "",
      yeastStrain: "",
      yeastWeight: "",
      ph: "",
      titratableAcidity: "",
      copperSulfateAdded: "",
      rackingDates: [],
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fermentationId || !formData.volume) {
      toast({ title: "Error", description: "Fermentation ID and volume are required", variant: "destructive" });
      return;
    }

    const submitData: InsertFermentationBatch = {
      fermentationId: formData.fermentationId!,
      date: formData.date || new Date(),
      volume: formData.volume!,
      incomingJuiceId: formData.incomingJuiceId,
      incomingJuiceVolume: formData.incomingJuiceVolume ? formData.incomingJuiceVolume : null,
      juiceSource: formData.juiceSource,
      brix: formData.brix ? formData.brix : null,
      abv: formData.abv ? formData.abv : null,
      sulfiteAdded: formData.sulfiteAdded ? formData.sulfiteAdded : null,
      yeastStrain: formData.yeastStrain,
      yeastWeight: formData.yeastWeight ? formData.yeastWeight : null,
      ph: formData.ph ? formData.ph : null,
      titratableAcidity: formData.titratableAcidity ? formData.titratableAcidity : null,
      copperSulfateAdded: formData.copperSulfateAdded ? formData.copperSulfateAdded : null,
      rackingDates: formData.rackingDates || [],
      notes: formData.notes,
    };

    if (editingBatch) {
      updateMutation.mutate({ id: editingBatch.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (batch: FermentationBatch) => {
    setEditingBatch(batch);
    setFormData({
      fermentationId: batch.fermentationId,
      date: new Date(batch.date),
      volume: batch.volume,
      incomingJuiceId: batch.incomingJuiceId || "",
      incomingJuiceVolume: batch.incomingJuiceVolume || "",
      juiceSource: batch.juiceSource || "",
      brix: batch.brix || "",
      abv: batch.abv || "",
      sulfiteAdded: batch.sulfiteAdded || "",
      yeastStrain: batch.yeastStrain || "",
      yeastWeight: batch.yeastWeight || "",
      ph: batch.ph || "",
      titratableAcidity: batch.titratableAcidity || "",
      copperSulfateAdded: batch.copperSulfateAdded || "",
      rackingDates: batch.rackingDates || [],
      notes: batch.notes || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this fermentation batch?")) {
      deleteMutation.mutate(id);
    }
  };

  const addRackingDate = () => {
    const newDate = prompt("Enter racking date (YYYY-MM-DD):");
    if (newDate) {
      setFormData(prev => ({
        ...prev,
        rackingDates: [...(prev.rackingDates || []), newDate]
      }));
    }
  };

  const removeRackingDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rackingDates: prev.rackingDates?.filter((_, i) => i !== index) || []
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Beaker className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Fermentation Management</h1>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingBatch(null); }} data-testid="button-add-batch">
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBatch ? "Edit Fermentation Batch" : "Add New Fermentation Batch"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fermentationId">Fermentation ID *</Label>
                  <Input
                    id="fermentationId"
                    value={formData.fermentationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, fermentationId: e.target.value }))}
                    required
                    data-testid="input-fermentation-id"
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    required
                    data-testid="input-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="volume">Volume (gallons) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                    required
                    data-testid="input-volume"
                  />
                </div>
                
                <div>
                  <Label htmlFor="incomingJuiceId">Incoming Juice ID</Label>
                  <Input
                    id="incomingJuiceId"
                    value={formData.incomingJuiceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, incomingJuiceId: e.target.value }))}
                    data-testid="input-juice-id"
                  />
                </div>
                
                <div>
                  <Label htmlFor="incomingJuiceVolume">Incoming Juice Volume (gallons)</Label>
                  <Input
                    id="incomingJuiceVolume"
                    type="number"
                    step="0.01"
                    value={formData.incomingJuiceVolume}
                    onChange={(e) => setFormData(prev => ({ ...prev, incomingJuiceVolume: e.target.value }))}
                    data-testid="input-juice-volume"
                  />
                </div>
                
                <div>
                  <Label htmlFor="juiceSource">Juice Source</Label>
                  <Input
                    id="juiceSource"
                    value={formData.juiceSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, juiceSource: e.target.value }))}
                    data-testid="input-juice-source"
                  />
                </div>
                
                <div>
                  <Label htmlFor="brix">Brix</Label>
                  <Input
                    id="brix"
                    type="number"
                    step="0.1"
                    value={formData.brix}
                    onChange={(e) => setFormData(prev => ({ ...prev, brix: e.target.value }))}
                    data-testid="input-brix"
                  />
                </div>
                
                <div>
                  <Label htmlFor="abv">ABV (%)</Label>
                  <Input
                    id="abv"
                    type="number"
                    step="0.1"
                    value={formData.abv}
                    onChange={(e) => setFormData(prev => ({ ...prev, abv: e.target.value }))}
                    data-testid="input-abv"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sulfiteAdded">Sulfite Added (grams)</Label>
                  <Input
                    id="sulfiteAdded"
                    type="number"
                    step="0.01"
                    value={formData.sulfiteAdded}
                    onChange={(e) => setFormData(prev => ({ ...prev, sulfiteAdded: e.target.value }))}
                    data-testid="input-sulfite"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yeastStrain">Yeast Strain</Label>
                  <Input
                    id="yeastStrain"
                    value={formData.yeastStrain}
                    onChange={(e) => setFormData(prev => ({ ...prev, yeastStrain: e.target.value }))}
                    data-testid="input-yeast-strain"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yeastWeight">Yeast Weight (grams)</Label>
                  <Input
                    id="yeastWeight"
                    type="number"
                    step="0.01"
                    value={formData.yeastWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, yeastWeight: e.target.value }))}
                    data-testid="input-yeast-weight"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ph">pH</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.01"
                    value={formData.ph}
                    onChange={(e) => setFormData(prev => ({ ...prev, ph: e.target.value }))}
                    data-testid="input-ph"
                  />
                </div>
                
                <div>
                  <Label htmlFor="titratableAcidity">Titratable Acidity</Label>
                  <Input
                    id="titratableAcidity"
                    type="number"
                    step="0.01"
                    value={formData.titratableAcidity}
                    onChange={(e) => setFormData(prev => ({ ...prev, titratableAcidity: e.target.value }))}
                    data-testid="input-titratable-acidity"
                  />
                </div>
                
                <div>
                  <Label htmlFor="copperSulfateAdded">Copper Sulfate Added (ml)</Label>
                  <Input
                    id="copperSulfateAdded"
                    type="number"
                    step="0.01"
                    value={formData.copperSulfateAdded}
                    onChange={(e) => setFormData(prev => ({ ...prev, copperSulfateAdded: e.target.value }))}
                    data-testid="input-copper-sulfate"
                  />
                </div>
              </div>
              
              <div>
                <Label>Racking Dates</Label>
                <div className="space-y-2">
                  {formData.rackingDates?.map((date, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={date} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRackingDate(index)}
                        data-testid={`button-remove-racking-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRackingDate}
                    data-testid="button-add-racking"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Racking Date
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  data-testid="textarea-notes"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingBatch ? "Update Batch" : "Create Batch"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} data-testid="button-cancel">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {fermentationBatches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Grape className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Fermentation Batches</h3>
              <p className="text-gray-600 mb-4">Start tracking your fermentation process by adding your first batch.</p>
              <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first-batch">
                <Plus className="h-4 w-4 mr-2" />
                Add First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          fermentationBatches.map((batch: FermentationBatch) => (
            <Card key={batch.id} data-testid={`card-batch-${batch.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5" />
                    {batch.fermentationId}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(batch)} data-testid={`button-edit-${batch.id}`}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(batch.id)} data-testid={`button-delete-${batch.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(batch.date), 'PPP')}
                  <Badge variant="secondary">{batch.volume} gallons</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {batch.juiceSource && (
                    <div>
                      <span className="font-medium">Source:</span>
                      <p data-testid={`text-source-${batch.id}`}>{batch.juiceSource}</p>
                    </div>
                  )}
                  {batch.brix && (
                    <div>
                      <span className="font-medium">Brix:</span>
                      <p data-testid={`text-brix-${batch.id}`}>{batch.brix}</p>
                    </div>
                  )}
                  {batch.abv && (
                    <div>
                      <span className="font-medium">ABV:</span>
                      <p data-testid={`text-abv-${batch.id}`}>{batch.abv}%</p>
                    </div>
                  )}
                  {batch.ph && (
                    <div>
                      <span className="font-medium">pH:</span>
                      <p data-testid={`text-ph-${batch.id}`}>{batch.ph}</p>
                    </div>
                  )}
                  {batch.yeastStrain && (
                    <div>
                      <span className="font-medium">Yeast:</span>
                      <p data-testid={`text-yeast-${batch.id}`}>{batch.yeastStrain}</p>
                    </div>
                  )}
                  {batch.sulfiteAdded && (
                    <div>
                      <span className="font-medium">Sulfite:</span>
                      <p data-testid={`text-sulfite-${batch.id}`}>{batch.sulfiteAdded}g</p>
                    </div>
                  )}
                  {batch.rackingDates && batch.rackingDates.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium">Racking Dates:</span>
                      <p data-testid={`text-racking-${batch.id}`}>{batch.rackingDates.join(", ")}</p>
                    </div>
                  )}
                </div>
                {batch.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1" data-testid={`text-notes-${batch.id}`}>{batch.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
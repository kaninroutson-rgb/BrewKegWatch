import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Beer, Plus, Edit, Beaker, Calendar, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCiderTypeSchema, insertCiderBatchSchema, type CiderType, type CiderBatch } from "@shared/schema";
import { z } from "zod";
import BottomNavigation from "@/components/bottom-navigation";
import MobileHeader from "@/components/mobile-header";

const ciderTypeFormSchema = insertCiderTypeSchema.extend({
  abv: z.string().optional(),
  ibu: z.string().optional(),
  srm: z.string().optional(),
});

const ciderBatchFormSchema = insertCiderBatchSchema.extend({
  date: z.string().optional(),
  brix: z.string().optional(),
  liquidIngredient1Volume: z.string().optional(),
  liquidIngredient2Volume: z.string().optional(),
  liquidIngredient3Volume: z.string().optional(),
  liquidIngredient4Volume: z.string().optional(),
  liquidIngredient5Volume: z.string().optional(),
  juice1Volume: z.string().optional(),
  juice2Volume: z.string().optional(),
  juice3Volume: z.string().optional(),
  poundsSugar: z.string().optional(),
  productLostDuringPackaging: z.string().optional(),
  halfBarrelsPackaged: z.string().optional(),
  sixthBarrelsPackaged: z.string().optional(),
  cansFilled: z.array(z.object({
    date: z.string(),
    quantity: z.number(),
  })).optional(),
});

export default function CiderTypes() {
  const { toast } = useToast();
  const [selectedCiderType, setSelectedCiderType] = useState<CiderType | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<CiderBatch | null>(null);
  const [showCiderTypeDialog, setShowCiderTypeDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [editingCiderType, setEditingCiderType] = useState<CiderType | null>(null);
  const [editingBatch, setEditingBatch] = useState<CiderBatch | null>(null);
  const [canEntries, setCanEntries] = useState<Array<{date: string, quantity: number}>>([]);

  // Fetch cider types
  const { data: ciderTypes = [], isLoading: ciderTypesLoading } = useQuery<CiderType[]>({
    queryKey: ["/api/cider-types"],
  });

  // Fetch batches for selected cider type
  const { data: batches = [] } = useQuery({
    queryKey: ["/api/cider-batches", selectedCiderType?.id],
    queryFn: () =>
      selectedCiderType 
        ? fetch(`/api/cider-batches?ciderTypeId=${selectedCiderType.id}`).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!selectedCiderType,
  });

  // Cider type form
  const ciderTypeForm = useForm<z.infer<typeof ciderTypeFormSchema>>({
    resolver: zodResolver(ciderTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      style: "",
      abv: "",
      ibu: "",
      srm: "",
      isActive: true,
    },
  });

  // Cider batch form
  const ciderBatchForm = useForm<z.infer<typeof ciderBatchFormSchema>>({
    resolver: zodResolver(ciderBatchFormSchema),
    defaultValues: {
      ciderTypeId: "",
      batchNumber: "",
      date: "",
      brix: "",
      liquidIngredient1Type: "",
      liquidIngredient1Volume: "",
      liquidIngredient2Type: "",
      liquidIngredient2Volume: "",
      liquidIngredient3Type: "",
      liquidIngredient3Volume: "",
      liquidIngredient4Type: "",
      liquidIngredient4Volume: "",
      liquidIngredient5Type: "",
      liquidIngredient5Volume: "",
      juice1Type: "",
      juice1Volume: "",
      juice2Type: "",
      juice2Volume: "",
      juice3Type: "",
      juice3Volume: "",
      poundsSugar: "",
      additionalIngredientNotes: "",
      batchNotes: "",
      halfBarrelsPackaged: "0",
      sixthBarrelsPackaged: "0",
      productLostDuringPackaging: "0",
    },
  });

  // Mutations
  const createCiderTypeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/cider-types", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cider-types"] });
      setShowCiderTypeDialog(false);
      ciderTypeForm.reset();
      toast({ title: "Success", description: "Cider type created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create cider type", variant: "destructive" });
    },
  });

  const updateCiderTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/cider-types/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cider-types"] });
      setShowCiderTypeDialog(false);
      setEditingCiderType(null);
      ciderTypeForm.reset();
      toast({ title: "Success", description: "Cider type updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update cider type", variant: "destructive" });
    },
  });

  const createCiderBatchMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/cider-batches", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cider-batches", selectedCiderType?.id] });
      setShowBatchDialog(false);
      ciderBatchForm.reset();
      setCanEntries([]);
      toast({ title: "Success", description: "Cider batch created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create cider batch", variant: "destructive" });
    },
  });

  const updateCiderBatchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/cider-batches/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cider-batches", selectedCiderType?.id] });
      setShowBatchDialog(false);
      setEditingBatch(null);
      ciderBatchForm.reset();
      setCanEntries([]);
      toast({ title: "Success", description: "Cider batch updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update cider batch", variant: "destructive" });
    },
  });

  const handleCiderTypeSubmit = (data: z.infer<typeof ciderTypeFormSchema>) => {
    const payload = {
      ...data,
      abv: data.abv ? parseFloat(data.abv) : null,
      ibu: data.ibu ? parseInt(data.ibu) : null,
      srm: data.srm ? parseFloat(data.srm) : null,
    };

    if (editingCiderType) {
      updateCiderTypeMutation.mutate({ id: editingCiderType.id, data: payload });
    } else {
      createCiderTypeMutation.mutate(payload);
    }
  };

  const handleBatchSubmit = (data: z.infer<typeof ciderBatchFormSchema>) => {
    const payload = {
      ...data,
      ciderTypeId: selectedCiderType?.id,
      date: data.date ? new Date(data.date) : null,
      brix: data.brix ? parseFloat(data.brix) : null,
      liquidIngredient1Volume: data.liquidIngredient1Volume ? parseFloat(data.liquidIngredient1Volume) : null,
      liquidIngredient2Volume: data.liquidIngredient2Volume ? parseFloat(data.liquidIngredient2Volume) : null,
      liquidIngredient3Volume: data.liquidIngredient3Volume ? parseFloat(data.liquidIngredient3Volume) : null,
      liquidIngredient4Volume: data.liquidIngredient4Volume ? parseFloat(data.liquidIngredient4Volume) : null,
      liquidIngredient5Volume: data.liquidIngredient5Volume ? parseFloat(data.liquidIngredient5Volume) : null,
      juice1Volume: data.juice1Volume ? parseFloat(data.juice1Volume) : null,
      juice2Volume: data.juice2Volume ? parseFloat(data.juice2Volume) : null,
      juice3Volume: data.juice3Volume ? parseFloat(data.juice3Volume) : null,
      poundsSugar: data.poundsSugar ? parseFloat(data.poundsSugar) : null,
      halfBarrelsPackaged: data.halfBarrelsPackaged ? parseInt(data.halfBarrelsPackaged) : 0,
      sixthBarrelsPackaged: data.sixthBarrelsPackaged ? parseInt(data.sixthBarrelsPackaged) : 0,
      productLostDuringPackaging: data.productLostDuringPackaging ? parseFloat(data.productLostDuringPackaging) : 0,
      cansFilled: canEntries.length > 0 ? canEntries : null,
    };

    if (editingBatch) {
      updateCiderBatchMutation.mutate({ id: editingBatch.id, data: payload });
    } else {
      createCiderBatchMutation.mutate(payload);
    }
  };

  const openEditCiderType = (ciderType: CiderType) => {
    setEditingCiderType(ciderType);
    ciderTypeForm.reset({
      name: ciderType.name,
      description: ciderType.description || "",
      style: ciderType.style || "",
      abv: ciderType.abv || "",
      ibu: ciderType.ibu?.toString() || "",
      srm: ciderType.srm || "",
      isActive: ciderType.isActive,
    });
    setShowCiderTypeDialog(true);
  };

  const openEditBatch = (batch: CiderBatch) => {
    setEditingBatch(batch);
    ciderBatchForm.reset({
      ciderTypeId: batch.ciderTypeId,
      batchNumber: batch.batchNumber,
      date: batch.date ? new Date(batch.date).toISOString().split('T')[0] : "",
      brix: batch.brix || "",
      liquidIngredient1Type: batch.liquidIngredient1Type || "",
      liquidIngredient1Volume: batch.liquidIngredient1Volume || "",
      liquidIngredient2Type: batch.liquidIngredient2Type || "",
      liquidIngredient2Volume: batch.liquidIngredient2Volume || "",
      liquidIngredient3Type: batch.liquidIngredient3Type || "",
      liquidIngredient3Volume: batch.liquidIngredient3Volume || "",
      liquidIngredient4Type: batch.liquidIngredient4Type || "",
      liquidIngredient4Volume: batch.liquidIngredient4Volume || "",
      liquidIngredient5Type: batch.liquidIngredient5Type || "",
      liquidIngredient5Volume: batch.liquidIngredient5Volume || "",
      juice1Type: batch.juice1Type || "",
      juice1Volume: batch.juice1Volume || "",
      juice2Type: batch.juice2Type || "",
      juice2Volume: batch.juice2Volume || "",
      juice3Type: batch.juice3Type || "",
      juice3Volume: batch.juice3Volume || "",
      poundsSugar: batch.poundsSugar || "",
      additionalIngredientNotes: batch.additionalIngredientNotes || "",
      batchNotes: batch.batchNotes || "",
      halfBarrelsPackaged: batch.halfBarrelsPackaged?.toString() || "0",
      sixthBarrelsPackaged: batch.sixthBarrelsPackaged?.toString() || "0",
      productLostDuringPackaging: batch.productLostDuringPackaging || "0",
    });
    setCanEntries(Array.isArray(batch.cansFilled) ? batch.cansFilled : []);
    setShowBatchDialog(true);
  };

  const addCanEntry = () => {
    setCanEntries([...canEntries, { date: "", quantity: 0 }]);
  };

  const updateCanEntry = (index: number, field: string, value: string | number) => {
    const updated = [...canEntries];
    updated[index] = { ...updated[index], [field]: value };
    setCanEntries(updated);
  };

  const removeCanEntry = (index: number) => {
    setCanEntries(canEntries.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen-ios bg-gray-50">
      <MobileHeader title="Cider Types" />
      
      <main className="px-4 py-6 max-w-7xl mx-auto pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Cider Type Management</h1>
          <p className="text-gray-600">Manage cider types and batch production details</p>
        </div>
        <Dialog open={showCiderTypeDialog} onOpenChange={setShowCiderTypeDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCiderType(null);
                ciderTypeForm.reset();
              }}
              className="gap-2"
              data-testid="button-add-cider-type"
            >
              <Plus className="w-4 h-4" />
              Add Cider Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCiderType ? "Edit Cider Type" : "Add New Cider Type"}
              </DialogTitle>
              <DialogDescription>
                Create or edit cider type information including ABV, IBU, and SRM values.
              </DialogDescription>
            </DialogHeader>
            <Form {...ciderTypeForm}>
              <form onSubmit={ciderTypeForm.handleSubmit(handleCiderTypeSubmit)} className="space-y-4">
                <FormField
                  control={ciderTypeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cider-type-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ciderTypeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="textarea-cider-type-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ciderTypeForm.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Traditional, Fruit, etc." data-testid="input-cider-type-style" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ciderTypeForm.control}
                    name="abv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ABV (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" data-testid="input-cider-type-abv" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ciderTypeForm.control}
                    name="ibu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBU</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-cider-type-ibu" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ciderTypeForm.control}
                    name="srm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SRM</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.1" data-testid="input-cider-type-srm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCiderTypeDialog(false)}
                    data-testid="button-cancel-cider-type"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCiderTypeMutation.isPending || updateCiderTypeMutation.isPending}
                    data-testid="button-save-cider-type"
                  >
                    {editingCiderType ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cider Types List */}
        <Card data-testid="card-cider-types-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beer className="w-5 h-5" />
              Cider Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ciderTypesLoading && (
                <div className="text-center text-gray-500 py-4">Loading cider types...</div>
              )}
              {ciderTypes.map((ciderType) => (
                <div
                  key={ciderType.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCiderType?.id === ciderType.id 
                      ? "bg-blue-50 border-blue-200" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedCiderType(ciderType);
                    setSelectedBatch(null);
                  }}
                  data-testid={`cider-type-card-${ciderType.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium" data-testid={`cider-type-name-${ciderType.id}`}>
                        {ciderType.name}
                      </h3>
                      {ciderType.style && (
                        <p className="text-sm text-gray-600">{ciderType.style}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {ciderType.abv && (
                          <Badge variant="secondary" className="text-xs">
                            {ciderType.abv}% ABV
                          </Badge>
                        )}
                        {ciderType.ibu && (
                          <Badge variant="secondary" className="text-xs">
                            {ciderType.ibu} IBU
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCiderType(ciderType);
                      }}
                      data-testid={`button-edit-cider-type-${ciderType.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Batches List */}
        <Card data-testid="card-batches-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="w-5 h-5" />
              Production Batches
              {selectedCiderType && (
                <span className="text-sm font-normal text-gray-600">
                  ({selectedCiderType.name})
                </span>
              )}
            </CardTitle>
            {selectedCiderType && (
              <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingBatch(null);
                      ciderBatchForm.reset({
                        ciderTypeId: selectedCiderType.id,
                        batchNumber: "",
                        date: "",
                        brix: "",
                        halfBarrelsPackaged: "0",
                        sixthBarrelsPackaged: "0",
                        productLostDuringPackaging: "0",
                      });
                      setCanEntries([]);
                    }}
                    data-testid="button-add-batch"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Batch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBatch ? "Edit Production Batch" : "Add New Production Batch"}
                    </DialogTitle>
                    <DialogDescription>
                      Track production details including ingredients, volumes, and packaging information.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...ciderBatchForm}>
                    <form onSubmit={ciderBatchForm.handleSubmit(handleBatchSubmit)} className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={ciderBatchForm.control}
                          name="batchNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch Number</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-batch-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={ciderBatchForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" data-testid="input-batch-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={ciderBatchForm.control}
                        name="brix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brix</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.1" data-testid="input-batch-brix" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Liquid Ingredients */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Liquid Ingredients (Gallons)</h3>
                        {[1, 2, 3, 4, 5].map(num => (
                          <div key={num} className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ciderBatchForm.control}
                              name={`liquidIngredient${num}Type` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ingredient {num} Type</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Base malt extract" data-testid={`input-liquid-ingredient-${num}-type`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ciderBatchForm.control}
                              name={`liquidIngredient${num}Volume` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Volume (Gallons)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" step="0.1" data-testid={`input-liquid-ingredient-${num}-volume`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Juice Ingredients */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Juice Ingredients (Gallons)</h3>
                        {[1, 2, 3].map(num => (
                          <div key={num} className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ciderBatchForm.control}
                              name={`juice${num}Type` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Juice {num} Type</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Apple juice" data-testid={`input-juice-${num}-type`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={ciderBatchForm.control}
                              name={`juice${num}Volume` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Volume (Gallons)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" step="0.1" data-testid={`input-juice-${num}-volume`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Sugar and Notes */}
                      <div className="space-y-4">
                        <FormField
                          control={ciderBatchForm.control}
                          name="poundsSugar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pounds of Sugar</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" data-testid="input-pounds-sugar" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={ciderBatchForm.control}
                          name="additionalIngredientNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Ingredient Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="textarea-additional-ingredient-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={ciderBatchForm.control}
                          name="batchNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="textarea-batch-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Packaging */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Packaging</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={ciderBatchForm.control}
                            name="halfBarrelsPackaged"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Half Barrels</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" data-testid="input-half-barrels" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={ciderBatchForm.control}
                            name="sixthBarrelsPackaged"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sixth Barrels</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" data-testid="input-sixth-barrels" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={ciderBatchForm.control}
                            name="productLostDuringPackaging"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Lost (Gallons)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.1" data-testid="input-product-lost" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Cans Filled */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Cans Filled</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addCanEntry} data-testid="button-add-can-entry">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Entry
                          </Button>
                        </div>
                        {canEntries.map((entry, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 items-end">
                            <div>
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={entry.date}
                                onChange={(e) => updateCanEntry(index, 'date', e.target.value)}
                                data-testid={`input-can-date-${index}`}
                              />
                            </div>
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                value={entry.quantity}
                                onChange={(e) => updateCanEntry(index, 'quantity', parseInt(e.target.value) || 0)}
                                data-testid={`input-can-quantity-${index}`}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCanEntry(index)}
                              data-testid={`button-remove-can-${index}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBatchDialog(false)}
                          data-testid="button-cancel-batch"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCiderBatchMutation.isPending || updateCiderBatchMutation.isPending}
                          data-testid="button-save-batch"
                        >
                          {editingBatch ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCiderType ? (
              <div className="text-center text-gray-500 py-8">
                Select a cider type to view production batches
              </div>
            ) : (
              <div className="space-y-3">
                {batches.map((batch: CiderBatch) => (
                  <div
                    key={batch.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedBatch?.id === batch.id 
                        ? "bg-green-50 border-green-200" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                    data-testid={`batch-card-${batch.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium" data-testid={`batch-number-${batch.id}`}>
                          Batch {batch.batchNumber}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {batch.brix && (
                            <Badge variant="outline" className="text-xs">
                              {batch.brix} Brix
                            </Badge>
                          )}
                          {(batch.halfBarrelsPackaged || batch.sixthBarrelsPackaged) && (
                            <Badge variant="secondary" className="text-xs">
                              {batch.halfBarrelsPackaged}½ + {batch.sixthBarrelsPackaged}⅙ bbls
                            </Badge>
                          )}
                        </div>
                        {batch.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Date: {new Date(batch.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditBatch(batch);
                        }}
                        data-testid={`button-edit-batch-${batch.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {batches.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No production batches found for this cider type
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Details Panel */}
      {selectedBatch && (
        <Card data-testid="card-batch-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Batch Details - {selectedBatch.batchNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedBatch.brix && (
              <div>
                <Label className="text-sm font-medium">Brix:</Label>
                <p className="text-sm text-gray-600">{selectedBatch.brix}</p>
              </div>
            )}

            {/* Liquid Ingredients Summary */}
            {[1, 2, 3, 4, 5].some(num => 
              (selectedBatch as any)[`liquidIngredient${num}Type`]) && (
              <div>
                <Label className="text-sm font-medium">Liquid Ingredients:</Label>
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map(num => {
                    const type = (selectedBatch as any)[`liquidIngredient${num}Type`];
                    const volume = (selectedBatch as any)[`liquidIngredient${num}Volume`];
                    return type ? (
                      <p key={num} className="text-sm text-gray-600">
                        {type}: {volume} gallons
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Juice Ingredients Summary */}
            {[1, 2, 3].some(num => 
              (selectedBatch as any)[`juice${num}Type`]) && (
              <div>
                <Label className="text-sm font-medium">Juice Ingredients:</Label>
                <div className="space-y-1">
                  {[1, 2, 3].map(num => {
                    const type = (selectedBatch as any)[`juice${num}Type`];
                    const volume = (selectedBatch as any)[`juice${num}Volume`];
                    return type ? (
                      <p key={num} className="text-sm text-gray-600">
                        {type}: {volume} gallons
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {selectedBatch.poundsSugar && (
              <div>
                <Label className="text-sm font-medium">Sugar:</Label>
                <p className="text-sm text-gray-600">{selectedBatch.poundsSugar} lbs</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Packaging:</Label>
              <p className="text-sm text-gray-600">
                {selectedBatch.halfBarrelsPackaged || 0} half barrels, {selectedBatch.sixthBarrelsPackaged || 0} sixth barrels
              </p>
              {selectedBatch.productLostDuringPackaging && (
                <p className="text-sm text-red-600">
                  Product lost: {selectedBatch.productLostDuringPackaging} gallons
                </p>
              )}
            </div>

            {Array.isArray(selectedBatch.cansFilled) && selectedBatch.cansFilled.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Cans Filled:</Label>
                <div className="space-y-1">
                  {selectedBatch.cansFilled.map((entry: any, index: number) => (
                    <p key={index} className="text-sm text-gray-600">
                      {new Date(entry.date).toLocaleDateString()}: {entry.quantity} cans
                    </p>
                  ))}
                </div>
              </div>
            )}

            {selectedBatch.batchNotes && (
              <div>
                <Label className="text-sm font-medium">Batch Notes:</Label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedBatch.batchNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </main>
      <BottomNavigation />
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Package, Trash2, Check, X, Scan, Upload } from "lucide-react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Keg } from "@shared/schema";

interface BatchScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string }>;
  ciderTypes: Array<{ id: string; name: string }>;
}

interface ScannedKeg {
  id: string;
  qrCode: string;
  currentStatus: string;
  newStatus?: string;
  ciderType?: string;
  location?: string;
  customerId?: string;
  notes?: string;
  error?: string;
}

export default function BatchScanner({ open, onOpenChange, customers, ciderTypes }: BatchScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedKegs, setScannedKegs] = useState<ScannedKeg[]>([]);
  const [codeReader, setCodeReader] = useState<BrowserQRCodeReader | null>(null);
  const [globalSettings, setGlobalSettings] = useState({
    status: "",
    ciderType: "",
    location: "",
    customerId: "",
    notes: "",
  });

  // Initialize camera and scanner
  useEffect(() => {
    if (open && !codeReader) {
      const reader = new BrowserQRCodeReader();
      setCodeReader(reader);
    }

    return () => {
      stopScanning();
    };
  }, [open, codeReader]);

  const startScanning = async () => {
    if (!codeReader || !videoRef.current) return;

    try {
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start continuous scanning
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
        if (result) {
          handleQRCodeScanned(result.getText());
        }
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    console.log("Stopping camera...");
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    // Check if already scanned
    if (scannedKegs.some(keg => keg.qrCode === qrCode)) {
      toast({
        title: "Already Scanned",
        description: "This keg has already been scanned.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch keg details
      const response = await fetch(`/api/kegs/qr/${qrCode}`);
      if (!response.ok) {
        throw new Error('Keg not found');
      }
      
      const keg: Keg = await response.json();
      
      const newScannedKeg: ScannedKeg = {
        id: keg.id,
        qrCode: qrCode,
        currentStatus: keg.status,
        newStatus: globalSettings.status || keg.status,
        ciderType: globalSettings.ciderType || keg.ciderType || "",
        location: globalSettings.location || keg.location || "",
        customerId: globalSettings.customerId || keg.customerId || "",
        notes: globalSettings.notes,
      };

      setScannedKegs(prev => [...prev, newScannedKeg]);
      
      toast({
        title: "Keg Scanned",
        description: `Added ${keg.id} to batch`,
      });
    } catch (error) {
      const errorKeg: ScannedKeg = {
        id: qrCode,
        qrCode: qrCode,
        currentStatus: "unknown",
        error: "Keg not found",
      };
      
      setScannedKegs(prev => [...prev, errorKeg]);
      
      toast({
        title: "Error",
        description: "Keg not found in system",
        variant: "destructive",
      });
    }
  };

  const updateScannedKeg = (index: number, field: string, value: string) => {
    setScannedKegs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeScannedKeg = (index: number) => {
    setScannedKegs(prev => prev.filter((_, i) => i !== index));
  };

  const applyGlobalSettings = () => {
    setScannedKegs(prev => prev.map(keg => ({
      ...keg,
      newStatus: globalSettings.status || keg.currentStatus,
      ciderType: globalSettings.ciderType || keg.ciderType || "",
      location: globalSettings.location || keg.location || "",
      customerId: globalSettings.customerId || keg.customerId || "",
      notes: globalSettings.notes,
    })));
    
    toast({
      title: "Settings Applied",
      description: "Global settings applied to all scanned kegs",
    });
  };

  // Process batch mutation
  const processBatchMutation = useMutation({
    mutationFn: async (kegs: ScannedKeg[]) => {
      const promises = kegs
        .filter(keg => !keg.error)
        .map(keg => 
          apiRequest(`/api/kegs/${keg.id}/status`, "PATCH", {
            status: keg.newStatus,
            ciderType: keg.ciderType,
            location: keg.location,
            customerId: keg.customerId,
            notes: keg.notes,
          })
        );
      
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kegs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      
      toast({
        title: "Batch Processed",
        description: `Successfully updated ${results.length} kegs`,
      });
      
      // Reset state
      setScannedKegs([]);
      setGlobalSettings({
        status: "",
        ciderType: "",
        location: "",
        customerId: "",
        notes: "",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process some kegs",
        variant: "destructive",
      });
    },
  });

  const handleProcessBatch = () => {
    const validKegs = scannedKegs.filter(keg => !keg.error && keg.newStatus);
    if (validKegs.length === 0) {
      toast({
        title: "No Valid Kegs",
        description: "Please scan kegs and set their status",
        variant: "destructive",
      });
      return;
    }

    processBatchMutation.mutate(validKegs);
  };

  // Manual QR entry
  const [manualQR, setManualQR] = useState("");
  const handleManualEntry = () => {
    if (manualQR.trim()) {
      handleQRCodeScanned(manualQR.trim());
      setManualQR("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Batch Scanner
          </DialogTitle>
          <DialogDescription>
            Scan multiple keg QR codes and process status changes in batch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Settings</CardTitle>
              <p className="text-sm text-gray-600">Apply these settings to all scanned kegs</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={globalSettings.status}
                    onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger data-testid="select-global-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="dirty">Dirty</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="deployed">Deployed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cider Type</Label>
                  <Select
                    value={globalSettings.ciderType}
                    onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, ciderType: value }))}
                  >
                    <SelectTrigger data-testid="select-global-cider-type">
                      <SelectValue placeholder="Select cider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {ciderTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={globalSettings.location}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                    data-testid="input-global-location"
                  />
                </div>

                <div>
                  <Label>Customer</Label>
                  <Select
                    value={globalSettings.customerId}
                    onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, customerId: value }))}
                  >
                    <SelectTrigger data-testid="select-global-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={globalSettings.notes}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes for all kegs"
                  data-testid="textarea-global-notes"
                />
              </div>

              <Button onClick={applyGlobalSettings} variant="outline" data-testid="button-apply-global">
                <Upload className="w-4 h-4 mr-2" />
                Apply to All Scanned Kegs
              </Button>
            </CardContent>
          </Card>

          {/* Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {!isScanning ? (
                  <Button onClick={startScanning} className="gap-2" data-testid="button-start-scanning">
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="outline" className="gap-2" data-testid="button-stop-scanning">
                    <X className="w-4 h-4" />
                    Stop Camera
                  </Button>
                )}
              </div>

              {isScanning && (
                <div className="relative w-full max-w-md mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border"
                    style={{ maxHeight: '300px' }}
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
              )}

              {/* Manual QR Entry */}
              <div className="space-y-2">
                <Label>Manual QR Code Entry</Label>
                <div className="flex gap-2">
                  <Input
                    value={manualQR}
                    onChange={(e) => setManualQR(e.target.value)}
                    placeholder="Enter QR code manually"
                    data-testid="input-manual-qr"
                  />
                  <Button onClick={handleManualEntry} disabled={!manualQR.trim()} data-testid="button-add-manual">
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanned Kegs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Scanned Kegs ({scannedKegs.length})
                </span>
                {scannedKegs.length > 0 && (
                  <Button
                    onClick={handleProcessBatch}
                    disabled={processBatchMutation.isPending}
                    className="gap-2"
                    data-testid="button-process-batch"
                  >
                    <Check className="w-4 h-4" />
                    Process Batch
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scannedKegs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No kegs scanned yet. Start scanning to add kegs to the batch.
                </div>
              ) : (
                <div className="space-y-3">
                  {scannedKegs.map((keg, index) => (
                    <div
                      key={`${keg.qrCode}-${index}`}
                      className={`p-4 rounded-lg border ${
                        keg.error ? "bg-red-50 border-red-200" : "bg-gray-50"
                      }`}
                      data-testid={`scanned-keg-${index}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{keg.id}</h3>
                          <p className="text-sm text-gray-600">QR: {keg.qrCode}</p>
                          {keg.error && (
                            <Badge variant="destructive" className="mt-1">
                              {keg.error}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScannedKeg(index)}
                          data-testid={`button-remove-keg-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {!keg.error && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Current Status</Label>
                            <Badge variant="outline">{keg.currentStatus}</Badge>
                          </div>
                          
                          <div>
                            <Label className="text-xs">New Status</Label>
                            <Select
                              value={keg.newStatus || ""}
                              onValueChange={(value) => updateScannedKeg(index, "newStatus", value)}
                            >
                              <SelectTrigger className="h-8" data-testid={`select-status-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clean">Clean</SelectItem>
                                <SelectItem value="dirty">Dirty</SelectItem>
                                <SelectItem value="full">Full</SelectItem>
                                <SelectItem value="deployed">Deployed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Cider Type</Label>
                            <Select
                              value={keg.ciderType || ""}
                              onValueChange={(value) => updateScannedKeg(index, "ciderType", value)}
                            >
                              <SelectTrigger className="h-8" data-testid={`select-cider-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {ciderTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.name}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Location</Label>
                            <Input
                              value={keg.location || ""}
                              onChange={(e) => updateScannedKeg(index, "location", e.target.value)}
                              className="h-8"
                              data-testid={`input-location-${index}`}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs">Customer</Label>
                            <Select
                              value={keg.customerId || ""}
                              onValueChange={(value) => updateScannedKeg(index, "customerId", value)}
                            >
                              <SelectTrigger className="h-8" data-testid={`select-customer-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={keg.notes || ""}
                              onChange={(e) => updateScannedKeg(index, "notes", e.target.value)}
                              className="h-8"
                              placeholder="Enter notes"
                              data-testid={`input-notes-${index}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKegScanned: (kegId: string) => void;
}

export default function QRScannerModal({ open, onOpenChange, onKegScanned }: QRScannerModalProps) {
  const [manualEntry, setManualEntry] = useState(false);
  const [kegId, setKegId] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kegId.trim()) {
      onKegScanned(kegId.trim());
      setKegId("");
      setManualEntry(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setManualEntry(false);
    setKegId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="scanner-modal-title">
              {manualEntry ? "Enter Keg ID" : "Scan Keg QR Code"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-close-scanner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {!manualEntry ? (
            <>
              <div 
                className="relative bg-gray-900 rounded-xl overflow-hidden mb-4"
                style={{ height: "240px" }}
                data-testid="camera-view"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
                <div className="absolute inset-4 border-2 border-white rounded-lg opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Position QR code in frame</p>
                </div>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-32 border-2 border-primary rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Point your camera at a keg QR code to scan</p>
                <Button
                  onClick={() => setManualEntry(true)}
                  className="w-full"
                  variant="outline"
                  data-testid="button-manual-entry"
                >
                  Enter Keg ID Manually
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="kegId" data-testid="label-keg-id">Keg ID</Label>
                <Input
                  id="kegId"
                  value={kegId}
                  onChange={(e) => setKegId(e.target.value)}
                  placeholder="e.g., K-001847"
                  className="mt-1"
                  data-testid="input-keg-id"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManualEntry(false)}
                  className="flex-1"
                  data-testid="button-back-to-scanner"
                >
                  Back to Scanner
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  data-testid="button-submit-keg-id"
                >
                  Find Keg
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

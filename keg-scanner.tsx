import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, QrCode, Keyboard, Camera, CameraOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Keg } from "@shared/schema";

interface KegScannerProps {
  open: boolean;
  onClose: () => void;
  onKegScanned: (keg: Keg) => void;
}

export default function KegScanner({ open, onClose, onKegScanned }: KegScannerProps) {
  const [manualEntry, setManualEntry] = useState(false);
  const [kegId, setKegId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  const { refetch: searchByQrCode } = useQuery({
    queryKey: ["/api/kegs/qr", qrCode],
    enabled: false,
  });

  const { refetch: searchById } = useQuery({
    queryKey: ["/api/kegs", kegId],
    enabled: false,
  });

  const handleManualSubmit = async () => {
    if (!kegId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keg ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await searchById();
      if (result.data) {
        onKegScanned(result.data as Keg);
        setKegId("");
        setManualEntry(false);
      } else {
        toast({
          title: "Error",
          description: "Keg not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find keg",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    
    setIsScanning(true);
    setCameraError(null);
    
    try {
      console.log('Requesting camera access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      // Safari/iOS specific constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      videoRef.current.srcObject = stream;
      
      // Set video attributes for iOS compatibility
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      
      // Handle video loading for Safari
      const handleVideoReady = () => {
        if (!videoRef.current) return;
        
        console.log('Video is ready, starting QR scanner...');
        
        try {
          // Initialize QR code reader
          codeReaderRef.current = new BrowserMultiFormatReader();
          
          // Start continuous decoding with error handling
          codeReaderRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result, error) => {
              if (result) {
                console.log('QR code detected:', result.getText());
                handleQRCodeScanned(result.getText());
              }
              // Ignore NotFoundException as it's expected when no QR code is visible
              if (error && error.name !== 'NotFoundException') {
                console.warn('QR scanning error:', error.name, error.message);
              }
            }
          );
        } catch (scanError) {
          console.error('QR scanner initialization error:', scanError);
          setCameraError('QR scanner initialization failed');
          setIsScanning(false);
        }
      };
      
      // Wait for video to be ready
      if (videoRef.current.readyState >= 2) {
        handleVideoReady();
      } else {
        videoRef.current.onloadedmetadata = handleVideoReady;
        videoRef.current.oncanplay = handleVideoReady;
      }
      
      // Auto-play for iOS
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((playError) => {
          console.error('Video play error:', playError);
          // On iOS, user gesture may be required
          setCameraError('Tap to start camera (user interaction required)');
        });
      }
      
    } catch (error: any) {
      console.error('Camera access error:', error);
      let errorMessage = 'Camera access failed. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setCameraError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped camera track:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    if (codeReaderRef.current) {
      try {
        // Reset the reader
        codeReaderRef.current = null;
      } catch (error) {
        console.error('Error stopping QR reader:', error);
      }
    }
    
    setIsScanning(false);
  };

  const handleQRCodeScanned = async (scannedCode: string) => {
    setQrCode(scannedCode);
    stopCamera();
    
    try {
      // Try to find the keg by QR code
      const result = await searchByQrCode();
      if (result.data) {
        onKegScanned(result.data as Keg);
        handleClose();
      } else {
        toast({
          title: "Keg not found",
          description: `No keg found with QR code: ${scannedCode}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lookup scanned keg",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setManualEntry(false);
      setKegId("");
      setQrCode("");
      setCameraError(null);
    }
    
    return () => stopCamera();
  }, [open]);

  const handleClose = () => {
    stopCamera();
    setManualEntry(false);
    setKegId("");
    setQrCode("");
    setCameraError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {manualEntry ? "Enter Keg ID" : "Scan Keg QR Code"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} data-testid="button-close-scanner">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {!manualEntry ? (
            <>
              {/* Camera View */}
              <div 
                className="relative bg-gray-900 rounded-xl overflow-hidden"
                style={{ height: "240px" }}
                data-testid="camera-view"
              >
                {cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                    <CameraOff className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm opacity-75 mb-3">{cameraError}</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={startCamera}
                        className="text-white border-white hover:bg-white hover:text-gray-900 w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Enable Camera
                      </Button>
                      {cameraError.includes('user interaction') && (
                        <p className="text-xs opacity-60">
                          Safari requires user interaction to start camera
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      webkit-playsinline="true"
                      muted
                      autoPlay
                      onClick={() => {
                        // Handle iOS requirement for user gesture
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().catch(console.error);
                        }
                      }}
                    />
                    
                    {/* Scanning Reticle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-2 border-primary rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {isScanning && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        Scanning for QR codes...
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  {isScanning ? "Position QR code within the frame to scan" : "Tap 'Start Camera' to begin scanning"}
                </p>
                
                {!isScanning && !cameraError && (
                  <Button 
                    onClick={startCamera}
                    className="w-full mb-3"
                    data-testid="button-start-camera"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setManualEntry(true)}
                    data-testid="button-manual-entry"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // Simulate scanning a random keg for testing
                      const randomKegs = ["K-25157883", "K-25520235", "K-25106662"];
                      const randomKeg = randomKegs[Math.floor(Math.random() * randomKegs.length)];
                      handleQRCodeScanned(`SK${randomKeg.replace('K-', '')}`);
                    }}
                    data-testid="button-test-scan"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Test Scan
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="kegId">Keg ID</Label>
                <Input
                  id="kegId"
                  placeholder="Enter keg ID (e.g., K-001847)"
                  value={kegId}
                  onChange={(e) => setKegId(e.target.value)}
                  data-testid="input-keg-id"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setManualEntry(false)}
                  data-testid="button-back-to-scanner"
                >
                  Back to Scanner
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleManualSubmit}
                  data-testid="button-search-keg"
                >
                  Search
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

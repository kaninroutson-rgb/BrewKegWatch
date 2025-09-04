import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Beer, Download, Plus, QrCode, Users } from "lucide-react";
import BatchScanner from "@/components/batch-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import KegCard from "@/components/keg-card";
import KegDetailsModal from "@/components/keg-details-modal";
import AddKegModal from "@/components/add-keg-modal";
import KegScanner from "@/components/keg-scanner";
import { exportKegQRCodesPDF } from "@/lib/pdf-export";
import { useToast } from "@/hooks/use-toast";
import type { Keg } from "@shared/schema";

const statusFilters = [
  { label: "All Kegs", value: "all" },
  { label: "Full", value: "full" },
  { label: "Deployed", value: "deployed" },
  { label: "Dirty", value: "dirty" },
  { label: "Clean", value: "clean" },
];

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKeg, setSelectedKeg] = useState<Keg | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBatchScanner, setShowBatchScanner] = useState(false);
  const { toast } = useToast();

  const { data: kegs = [], isLoading } = useQuery<Keg[]>({
    queryKey: statusFilter !== "all" ? [`/api/kegs?status=${statusFilter}`] : ["/api/kegs"],
  });

  // Fetch customers and cider types for batch scanner
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: ciderTypes = [] } = useQuery({
    queryKey: ["/api/cider-types"],
  });

  const filteredKegs = kegs.filter((keg: Keg) => {
    const matchesSearch = keg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keg.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keg.ciderType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExportAllQRCodes = async () => {
    if (filteredKegs.length === 0) {
      toast({
        title: "No kegs to export",
        description: "No kegs found with current filters",
        variant: "destructive"
      });
      return;
    }

    try {
      const qrData = filteredKegs.map((keg: Keg) => ({
        id: keg.id,
        qrCode: keg.qrCode
      }));
      
      const filename = `all-keg-qr-codes-${new Date().toISOString().split('T')[0]}.pdf`;
      await exportKegQRCodesPDF(qrData, filename);
      
      toast({
        title: "PDF exported successfully",
        description: `Downloaded ${filename} with ${filteredKegs.length} QR codes`
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

  const handleKegScanned = (keg: Keg) => {
    setShowScanner(false);
    setSelectedKeg(keg);
  };

  return (
    <div className="min-h-screen-ios bg-gray-50">
      <MobileHeader title="Inventory" />

      <main className="px-4 py-6 max-w-7xl mx-auto pb-20">
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <Button 
            onClick={() => setShowScanner(true)}
            className="flex-1"
            data-testid="button-scan-qr"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan Keg
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowBatchScanner(true)}
            data-testid="button-batch-scan"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportAllQRCodes}
            data-testid="button-export-all-qr"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            data-testid="button-add-kegs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search kegs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-kegs"
              />
            </div>
            <Button variant="outline" size="icon" data-testid="button-open-filters">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap rounded-full"
                onClick={() => setStatusFilter(filter.value)}
                data-testid={`filter-${filter.value}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Keg List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8" data-testid="loading-kegs">
              Loading kegs...
            </div>
          ) : filteredKegs.length === 0 ? (
            <div className="text-center text-gray-500 py-8" data-testid="no-kegs-found">
              {searchTerm ? "No kegs found matching your search" : "No kegs found"}
            </div>
          ) : (
            filteredKegs.map((keg: Keg) => (
              <KegCard
                key={keg.id}
                keg={keg}
                onClick={() => setSelectedKeg(keg)}
              />
            ))
          )}
        </div>
      </main>

      {selectedKeg && (
        <KegDetailsModal
          keg={selectedKeg}
          open={!!selectedKeg}
          onClose={() => setSelectedKeg(null)}
        />
      )}

      <AddKegModal 
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      <KegScanner 
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onKegScanned={handleKegScanned}
      />

      <BatchScanner
        open={showBatchScanner}
        onOpenChange={setShowBatchScanner}
        customers={customers}
        ciderTypes={ciderTypes}
      />

      <BottomNavigation />
    </div>
  );
}

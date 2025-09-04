import { Beer, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Keg } from "@shared/schema";

const getStatusIcon = (status: string) => {
  return <Beer className={`w-5 h-5 ${
    status === "full" ? "text-keg-full" :
    status === "deployed" ? "text-keg-deployed" :
    status === "dirty" ? "text-keg-dirty" :
    status === "clean" ? "text-keg-clean" : "text-gray-500"
  }`} />;
};

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

interface KegCardProps {
  keg: Keg;
  onClick?: () => void;
}

export default function KegCard({ keg, onClick }: KegCardProps) {
  return (
    <Card 
      className="rounded-xl cursor-pointer hover:shadow-md transition-shadow" 
      onClick={onClick}
      data-testid={`keg-card-${keg.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              keg.status === "full" ? "bg-green-100" :
              keg.status === "deployed" ? "bg-orange-100" :
              keg.status === "dirty" ? "bg-red-100" :
              keg.status === "clean" ? "bg-blue-100" : "bg-gray-100"
            }`}>
              {getStatusIcon(keg.status)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900" data-testid={`keg-id-${keg.id}`}>
                {keg.id}
              </h4>
              <p className="text-xs text-gray-500" data-testid={`keg-location-${keg.id}`}>
                {keg.location || "Unknown location"}
              </p>
              {keg.beerType && (
                <p className="text-xs text-gray-400" data-testid={`keg-beer-type-${keg.id}`}>
                  {keg.beerType}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(keg.status)} data-testid={`keg-status-badge-${keg.id}`}>
              {formatStatus(keg.status)}
            </Badge>
            <Badge className={getSizeColor(keg.size)} data-testid={`keg-size-badge-${keg.id}`}>
              {formatSize(keg.size)}
            </Badge>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

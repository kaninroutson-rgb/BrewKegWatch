import { useQuery } from "@tanstack/react-query";
import { Beer, CheckCircle, Truck, AlertTriangle, Sparkles, QrCode, Plus, Bell, UserCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import KegScanner from "@/components/keg-scanner";
import KegDetailsModal from "@/components/keg-details-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { formatDistanceToNow } from "date-fns";
import type { Keg, Activity } from "@shared/schema";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "full": return <CheckCircle className="w-4 h-4 text-keg-full" />;
    case "deployed": return <Truck className="w-4 h-4 text-keg-deployed" />;
    case "dirty": return <AlertTriangle className="w-4 h-4 text-keg-dirty" />;
    case "clean": return <Sparkles className="w-4 h-4 text-keg-clean" />;
    default: return <Beer className="w-4 h-4" />;
  }
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

export default function Dashboard() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedKeg, setSelectedKeg] = useState<Keg | null>(null);
  const [notificationCount] = useState(3);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: overdueKegs } = useQuery({
    queryKey: ["/api/analytics/overdue"],
  });

  const handleKegScanned = (keg: Keg) => {
    setSelectedKeg(keg);
    setScannerOpen(false);
  };

  return (
    <div className="min-h-screen-ios bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Beer className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold text-gray-900">StoicKegs</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-profile">
              <UserCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-7xl mx-auto pb-20">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-keg-full" />
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-full">
                  {statsLoading ? "..." : stats?.full || 0}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Full Kegs</p>
              <p className="text-xs text-gray-400 mt-1">Ready for delivery</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-keg-deployed" />
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-deployed">
                  {statsLoading ? "..." : stats?.deployed || 0}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Deployed</p>
              <p className="text-xs text-gray-400 mt-1">At customer sites</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-keg-dirty" />
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-dirty">
                  {statsLoading ? "..." : stats?.dirty || 0}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Dirty</p>
              <p className="text-xs text-gray-400 mt-1">Need cleaning</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-keg-clean" />
                </div>
                <span className="text-2xl font-bold text-gray-900" data-testid="stat-clean">
                  {statsLoading ? "..." : stats?.clean || 0}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Clean</p>
              <p className="text-xs text-gray-400 mt-1">Ready to fill</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex justify-center">
            <Button
              className="bg-primary text-white rounded-xl px-8 py-4 h-auto flex items-center space-x-3 hover:bg-blue-700"
              onClick={() => setScannerOpen(true)}
              data-testid="button-scan-keg"
            >
              <QrCode className="w-6 h-6" />
              <span className="font-medium">Scan Keg</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Button variant="link" className="text-primary text-sm font-medium p-0" data-testid="button-view-all-activity">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {activitiesLoading ? (
              <div className="text-center text-gray-500 py-8">Loading activities...</div>
            ) : activities?.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No recent activities</div>
            ) : (
              activities?.slice(0, 3).map((activity: Activity) => (
                <Card key={activity.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activity.newStatus === "deployed" ? "bg-orange-100" :
                          activity.newStatus === "full" ? "bg-green-100" :
                          activity.newStatus === "clean" ? "bg-blue-100" : "bg-red-100"
                        }`}>
                          {getStatusIcon(activity.newStatus)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900" data-testid={`activity-description-${activity.id}`}>
                            Keg {activity.kegId} {activity.action}
                            {activity.location && ` at ${activity.location}`}
                          </p>
                          <p className="text-xs text-gray-400" data-testid={`activity-timestamp-${activity.id}`}>
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Alerts & Notifications */}
        {overdueKegs && overdueKegs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
            <Alert className="border-red-200 bg-red-50 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                <p className="text-sm font-medium text-red-800">
                  {overdueKegs.length} kegs overdue for return
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Some kegs are 5+ days overdue
                </p>
                <Button variant="link" className="text-xs text-red-700 font-medium mt-2 p-0 h-auto hover:text-red-900" data-testid="button-view-overdue-kegs">
                  View Details →
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {stats && stats.clean < 15 && (
          <Alert className="border-orange-200 bg-orange-50 mb-6">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              <p className="text-sm font-medium text-orange-800">Low clean keg inventory</p>
              <p className="text-xs text-orange-600 mt-1">
                Only {stats.clean} clean kegs remaining
              </p>
              <Button variant="link" className="text-xs text-orange-700 font-medium mt-2 p-0 h-auto hover:text-orange-900" data-testid="button-manage-inventory">
                Manage Inventory →
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </main>

      <KegScanner 
        open={scannerOpen} 
        onClose={() => setScannerOpen(false)}
        onKegScanned={handleKegScanned}
      />

      {selectedKeg && (
        <KegDetailsModal
          keg={selectedKeg}
          open={!!selectedKeg}
          onClose={() => setSelectedKeg(null)}
        />
      )}

      <BottomNavigation />
    </div>
  );
}

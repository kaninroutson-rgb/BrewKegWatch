import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Download, FileText, TrendingUp, Users, Package } from "lucide-react";
import { exportOrdersToPDF, type OrderWithCustomer } from "@/lib/order-export";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import MobileHeader from "@/components/mobile-header";

export default function Reports() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Fetch orders by date range
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['/api/orders/date-range', startDate, endDate],
    queryFn: () => 
      fetch(`/api/orders/date-range?startDate=${startDate}&endDate=${endDate}`)
        .then(res => res.json()),
    enabled: !!startDate && !!endDate,
  });

  const orders: OrderWithCustomer[] = ordersData || [];

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    totalKegs: orders.reduce((sum, order) => sum + order.totalKegs, 0),
    pendingOrders: orders.filter(order => order.status === "pending").length,
    confirmedOrders: orders.filter(order => order.status === "confirmed").length,
    fulfilledOrders: orders.filter(order => order.status === "fulfilled").length,
    cancelledOrders: orders.filter(order => order.status === "cancelled").length,
  };

  // Calculate beer type breakdown
  const beerTypeStats: Record<string, number> = {};
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(itemStr => {
        try {
          const item = JSON.parse(itemStr);
          if (item.quantity > 0) {
            beerTypeStats[item.beerType] = (beerTypeStats[item.beerType] || 0) + item.quantity;
          }
        } catch (e) {
          // Skip invalid items
        }
      });
    }
  });

  // Top customers by keg volume
  const customerStats: Record<string, { name: string; kegs: number; orders: number }> = {};
  orders.forEach(order => {
    const key = order.customer.id;
    if (!customerStats[key]) {
      customerStats[key] = { name: order.customer.name, kegs: 0, orders: 0 };
    }
    customerStats[key].kegs += order.totalKegs;
    customerStats[key].orders += 1;
  });

  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.kegs - a.kegs)
    .slice(0, 5);

  const handleExportToPDF = async () => {
    if (orders.length === 0) {
      toast({
        title: "No Data",
        description: "No orders found for the selected date range.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportOrdersToPDF(orders, startDate, endDate);
      toast({
        title: "Export Successful",
        description: `Exported ${orders.length} orders to PDF.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export orders to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isDateRangeValid = startDate && endDate && new Date(startDate) <= new Date(endDate);

  return (
    <div className="min-h-screen-ios bg-gray-50">
      <MobileHeader title="Reports" />
      
      <main className="px-4 py-6 max-w-7xl mx-auto pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reports</h1>
          <p className="text-gray-600">Order analytics and export tools</p>
        </div>
        <Button
          onClick={handleExportToPDF}
          disabled={!isDateRangeValid || orders.length === 0 || isLoading}
          className="gap-2"
          data-testid="button-export-pdf"
        >
          <Download className="w-4 h-4" />
          Export to PDF
        </Button>
      </div>

      {/* Date Range Selection */}
      <Card data-testid="card-date-range">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
          {startDate && endDate && (
            <p className="text-sm text-gray-600 mt-2">
              Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading and Error States */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-600">Loading order data...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">Failed to load order data. Please try again.</div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {!isLoading && !error && isDateRangeValid && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-stat-total-orders">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold" data-testid="text-total-orders">{stats.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-total-kegs">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Kegs</p>
                    <p className="text-2xl font-bold" data-testid="text-total-kegs">{stats.totalKegs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending-orders">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold" data-testid="text-pending-orders">{stats.pendingOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-fulfilled-orders">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fulfilled Orders</p>
                    <p className="text-2xl font-bold" data-testid="text-fulfilled-orders">{stats.fulfilledOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Breakdown */}
          <Card data-testid="card-order-status">
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600" data-testid="text-status-pending">{stats.pendingOrders}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-status-confirmed">{stats.confirmedOrders}</div>
                  <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="text-status-fulfilled">{stats.fulfilledOrders}</div>
                  <div className="text-sm text-gray-600">Fulfilled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600" data-testid="text-status-cancelled">{stats.cancelledOrders}</div>
                  <div className="text-sm text-gray-600">Cancelled</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beer Type Analytics */}
          {Object.keys(beerTypeStats).length > 0 && (
            <Card data-testid="card-beer-types">
              <CardHeader>
                <CardTitle>Beer Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(beerTypeStats)
                    .sort(([,a], [,b]) => b - a)
                    .map(([beerType, count]) => (
                      <div key={beerType} className="flex justify-between items-center">
                        <span className="font-medium" data-testid={`text-beer-type-${beerType}`}>
                          {beerType === "DNA" ? "Don't Need Anything" : beerType}
                        </span>
                        <span className="text-2xl font-bold text-blue-600" data-testid={`text-beer-count-${beerType}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <Card data-testid="card-top-customers">
              <CardHeader>
                <CardTitle>Top Customers by Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium" data-testid={`text-customer-name-${index}`}>{customer.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({customer.orders} order{customer.orders !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-600" data-testid={`text-customer-kegs-${index}`}>
                        {customer.kegs} kegs
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data Message */}
          {orders.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-600">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No orders found</p>
                  <p className="text-sm">Try adjusting your date range to see order data.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </main>
      <BottomNavigation />
    </div>
  );
}
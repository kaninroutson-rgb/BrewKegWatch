import { Home, Package, Users, BarChart3, Beer, Beaker } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Beer, label: "Cider Types", path: "/beer-types" },
  { icon: Beaker, label: "Fermentation", path: "/fermentation" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 ios-safe-area">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center px-2 py-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center space-y-1 py-2 px-3 h-auto min-h-[48px] rounded-lg transition-colors min-w-[60px] ${
                    isActive ? "text-primary bg-primary/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

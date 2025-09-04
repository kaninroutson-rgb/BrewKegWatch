import { Beer, Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface MobileHeaderProps {
  title?: string;
  action?: ReactNode;
}

export default function MobileHeader({ title = "StoicKegs", action }: MobileHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Beer className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {action}
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-profile">
            <UserCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

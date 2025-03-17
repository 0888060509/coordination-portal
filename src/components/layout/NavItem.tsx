
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Home, 
  Users, 
  DoorClosed, 
  LayoutDashboard,
  Shield,
  CalendarClock
} from "lucide-react";
import { 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";

interface NavItemProps {
  icon: "dashboard" | "rooms" | "bookings" | "admin" | "roomManagement" | "userManagement" | "security" | "bookRoom";
  to: string;
  isActive?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

const NavItem = ({ icon, to, children, isActive, onClick }: NavItemProps) => {
  // Map icon names to Lucide icon components
  const getIcon = () => {
    switch (icon) {
      case "dashboard":
        return <Home className="h-5 w-5" />;
      case "rooms":
        return <DoorClosed className="h-5 w-5" />;
      case "bookings":
        return <Calendar className="h-5 w-5" />;
      case "bookRoom":
        return <CalendarClock className="h-5 w-5" />;
      case "admin":
        return <LayoutDashboard className="h-5 w-5" />;
      case "roomManagement":
        return <DoorClosed className="h-5 w-5" />;
      case "userManagement":
        return <Users className="h-5 w-5" />;
      case "security":
        return <Shield className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <NavLink to={to} onClick={onClick}>
          {getIcon()}
          <span>{children}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default NavItem;

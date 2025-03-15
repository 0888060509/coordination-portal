
import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Home, 
  Users, 
  DoorClosed, 
  LayoutDashboard,
  User
} from "lucide-react";

interface MobileNavItemProps {
  icon: "dashboard" | "rooms" | "bookings" | "profile" | "admin" | "roomManagement" | "userManagement";
  label: string;
  to: string;
  onClick?: () => void;
}

const MobileNavItem = ({ icon, label, to, onClick }: MobileNavItemProps) => {
  // Map icon names to Lucide icon components
  const getIcon = () => {
    switch (icon) {
      case "dashboard":
        return <Home className="h-5 w-5" />;
      case "rooms":
        return <DoorClosed className="h-5 w-5" />;
      case "bookings":
        return <Calendar className="h-5 w-5" />;
      case "profile":
        return <User className="h-5 w-5" />;
      case "admin":
        return <LayoutDashboard className="h-5 w-5" />;
      case "roomManagement":
        return <DoorClosed className="h-5 w-5" />;
      case "userManagement":
        return <Users className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center p-2 rounded-md space-x-3 w-full ${
          isActive ? 'bg-meeting-primary text-white' : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      {getIcon()}
      <span>{label}</span>
    </NavLink>
  );
};

export default MobileNavItem;

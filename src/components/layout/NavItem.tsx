
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Home, 
  Users, 
  DoorClosed, 
  LayoutDashboard,
  Shield
} from "lucide-react";
import { 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar";

interface NavItemProps {
  icon: ReactNode;
  to: string;
  isActive?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

const NavItem = ({ icon, to, children, isActive, onClick }: NavItemProps) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <NavLink to={to} onClick={onClick}>
          {icon}
          <span>{children}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default NavItem;

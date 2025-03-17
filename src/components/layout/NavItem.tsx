
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: ReactNode;
  to: string;
  expanded: boolean;
  children?: ReactNode;
}

const NavItem = ({ icon, to, expanded, children }: NavItemProps) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center py-2 px-3 rounded-md transition-colors",
        expanded ? "justify-start" : "justify-center",
        isActive 
          ? "bg-primary/10 text-primary hover:bg-primary/20" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <span className={cn("flex-shrink-0", expanded && "mr-3")}>
        {icon}
      </span>
      {expanded && <span className="truncate">{children}</span>}
    </NavLink>
  );
};

export default NavItem;

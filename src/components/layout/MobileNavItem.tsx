
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface MobileNavItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}

const MobileNavItem = ({ icon, label, to, onClick }: MobileNavItemProps) => {
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
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

export default MobileNavItem;

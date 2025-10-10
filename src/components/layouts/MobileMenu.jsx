import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building, Users, Settings, HelpCircle, LogOut, Menu, Shield, Monitor, ClipboardList,
} from 'lucide-react';
import { GiElevator } from 'react-icons/gi';
import { VscOrganization } from "react-icons/vsc";
import { useAuth } from '../../contexts/AuthContext';

const MobileMenu = ({ hiddenOnScroll = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActivePath = (pathname, path, { exact } = { exact: false }) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  const getProfileImageSrc = (imgUrl) => {
    if (imgUrl) {
      return `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}`;
    }
    return 'https://via.placeholder.com/150';
  };

  const getMenuItemsByRole = (role) => {
    switch (role) {
      case "super_admin":
        return [
          { id: 'dashboard', path: '/dashboardsuperadmin', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'monitor', path: '/monitor', icon: Monitor, label: 'Monitor' },
          { id: 'organizations', path: '/organizations', icon: VscOrganization, label: 'Orgs' },
          { id: 'buildings', path: '/buildings', icon: Building, label: 'Buildings' },
          { id: 'admin-assign', path: '/admin-assign', icon: ClipboardList, label: 'Assign' },
          { id: 'admin-users', path: '/admin-users', icon: Users, label: 'Users' },
        ];
      case "admin":
        return [
          { id: 'dashboard', path: '/dashboardadmin', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'monitor', path: '/monitor', icon: Monitor, label: 'Monitor' },
          { id: 'buildings', path: '/buildings', icon: Building, label: 'Buildings' },
          { id: 'elevators', path: '/elevators', icon: GiElevator, label: 'Lifts' },
          { id: 'admin-assign', path: '/admin-assign', icon: ClipboardList, label: 'Assign' },
        ];
      case "technician":
        return [
          { id: 'dashboard', path: '/dashboardtechnician', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'monitor', path: '/monitor', icon: Monitor, label: 'Monitor' },
          { id: 'my-tasks', path: '/my-tasks', icon: ClipboardList, label: 'My Tasks' },
        ];
      case "user":
      default:
        return [
          { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'monitor', path: '/monitor', icon: Monitor, label: 'Monitor' },
        ];
    }
  };

  const menuItems = useMemo(() => getMenuItemsByRole(user?.role), [user?.role]);

  const dropdownItems = [
    { id: 'profile', path: '/profile', icon: Users, label: 'Profile' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
    { id: '2fa-setup', path: '/2fa-setup', icon: Shield, label: '2FA Setup' },
    { id: 'help', path: '/help', icon: HelpCircle, label: 'Help' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-xl z-50 md:hidden",
        "transition-transform duration-300 will-change-transform",
        hiddenOnScroll ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <nav className="flex justify-around p-2 relative">
        <div className="flex flex-grow overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={[
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200",
                "flex-shrink-0 min-w-[70px]",
                isActivePath(location.pathname, item.path, { exact: item.path === '/' })
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-500',
              ].join(" ")}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium whitespace-nowrap mt-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="h-10 w-px bg-gray-200 self-center mx-2"></div>

        <div className="flex items-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 text-gray-500 hover:text-blue-500"
          >
            <Menu size={20} />
            <span className="text-xs font-medium mt-1">Menu</span>
          </button>
        </div>

        <div
          className={[
            "absolute bottom-full right-2 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50",
            "transition-all duration-300 ease-in-out transform origin-bottom-right",
            isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
          ].join(" ")}
        >
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-2 p-2 border-b border-gray-200 mb-2">
              {user?.user_img ? (
                <img
                  src={getProfileImageSrc(user.user_img)}
                  alt="User Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || user?.username}
                </p>
              </div>
            </div>

            {dropdownItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-left"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;

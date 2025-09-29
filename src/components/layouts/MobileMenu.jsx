import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Building, Users, Settings, HelpCircle, LogOut, Menu, Shield, Monitor, ClipboardList // เพิ่ม ClipboardList ที่นี่
} from 'lucide-react';
import { GiElevator } from 'react-icons/gi';
import { VscOrganization } from "react-icons/vsc";
import { PiElevatorBold } from "react-icons/pi";
import { useAuth } from '../../contexts/AuthContext';

const MobileMenu = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getProfileImageSrc = (imgUrl) => {
    if (imgUrl) {
      return `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}`;
    }
    return 'https://via.placeholder.com/150';
  };

  const menuItems = [
    { id: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'monitor',          path: '/monitor',          icon: Monitor,         label: 'Monitor',           exact: true }, 
    { id: 'monitor-overview', path: '/monitor/overview', icon: Monitor,         label: 'Monitor Overview',  exact: true }, 
    { id: 'organizations', path: '/organizations', icon: VscOrganization, label: 'Org' },
    { id: 'buildings', path: '/buildings', icon: Building, label: 'Buildings' },
    { id: 'elevators', path: '/elevators', icon: GiElevator, label: 'Elevators' },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'Notifications' },
    ...(user?.role === 'admin' ? [{ id: 'admin-users', path: '/admin-users', icon: Users, label: 'Users' }] : []),
    // เมนูสำหรับ technician
    ...(user?.role === 'technician' ? [{ id: 'my-tasks', path: '/my-tasks', icon: ClipboardList, label: 'My Tasks' }] : []),
  ];

  const dropdownItems = [
    { id: 'profile', path: '/profile', icon: Users, label: 'Profile' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
    { id: '2fa-setup', path: '/2fa-setup', icon: Shield, label: '2FA Setup' }, // เพิ่มเมนู 2FA Setup
    { id: 'help', path: '/help', icon: HelpCircle, label: 'Help' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-xl z-50 md:hidden">
      <nav className="flex justify-around p-2 relative">
        <div className="flex flex-grow overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 flex-shrink-0 min-w-[70px]
                ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}
              `}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* เส้นแบ่งแนวตั้ง */}
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

        <div className={`
          absolute bottom-full right-2 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50
          transition-all duration-300 ease-in-out transform origin-bottom-right
          ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}>
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
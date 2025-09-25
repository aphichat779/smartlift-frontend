// src/components/layout/Sidebar.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, Users, Building, ChevronDown, Square, SquareCheckBig, Monitor
} from 'lucide-react';
import { GiElevator } from 'react-icons/gi';
import { VscOrganization } from "react-icons/vsc";
import { TbMessageReport } from "react-icons/tb";
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    navigate(path);
    setIsUserMenuOpen(false);
  };

  // helper: รองรับ exact match
  const isActivePath = (pathname, path, { exact } = { exact: false }) =>
    exact ? pathname === path : (pathname === path || pathname.startsWith(path + '/'));

  const is2FAEnabled = user?.ga_enabled;

  // ใส่ exact:true ให้เมนูหลักทั้งหมด (โดยเฉพาะ /monitor และ /monitor/overview)
  const menuItems = [
    { id: 'dashboard',        path: '/',                 icon: LayoutDashboard, label: 'Dashboard',         exact: true },
    { id: 'monitor',          path: '/monitor',          icon: Monitor,         label: 'Monitor',           exact: true }, 
    { id: 'monitor-overview', path: '/monitor/overview', icon: Monitor,         label: 'Monitor Overview',  exact: true }, 
    { id: 'organizations',    path: '/organizations',    icon: VscOrganization, label: 'Organizations',     exact: true },
    { id: 'buildings',        path: '/buildings',        icon: Building,        label: 'Buildings',         exact: true },
    { id: 'elevators',        path: '/elevators',        icon: GiElevator,      label: 'Elevators',         exact: true },
    { id: 'reports',          path: '/reports',          icon: TbMessageReport, label: 'Reports',           exact: true },
    { id: 'notifications',    path: '/notifications',    icon: Bell,            label: 'Notifications',     exact: true },
  ];

  const adminItems = [
    { id: 'admin-users', path: '/admin-users', icon: Users, label: 'User Management', exact: true }
  ];

  const userMenuItems = [
    { id: 'profile',    path: '/profile',    icon: Users,   label: 'UserProfile' },
    { id: 'settings',   path: '/settings',   icon: Settings,label: 'Settings' },
    { id: '2fa-setup',  path: '/2fa-setup',  icon: Shield,  label: '2FA Setup' },
    { id: 'help',       path: '/help',       icon: Users,   label: 'Help' } // ถ้ายังไม่มี route จะไม่ไปหน้าใด
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileImageSrc = (imgUrl) => {
    if (imgUrl) return `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}`;
    return 'https://via.placeholder.com/150';
  };

  const MenuItem = ({ path, icon: Icon, label, onClick, exact = false, variant = 'default' }) => {
    const active = isActivePath(location.pathname, path, { exact });
    return (
      <button
        onClick={() => onClick(path)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left
          ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
          ${isCollapsed ? 'justify-center px-2' : ''}
          ${variant === 'danger' ? 'hover:bg-red-100 hover:text-red-600' : ''}
        `}
      >
        <Icon size={20} className="flex-shrink-0" />
        <span
          className={`
            text-sm font-medium transition-all duration-300
            ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
          `}
        >
          {label}
        </span>
      </button>
    );
  };

  const UserMenuItem = ({ item, onClick, isCollapsed }) => {
    const colorClass = item.id === '2fa-setup'
      ? (is2FAEnabled ? 'text-green-600' : 'text-red-600')
      : 'text-gray-700';

    return (
      <button
        key={item.id}
        onClick={() => onClick(item.path)}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md transition-colors
          hover:bg-gray-100
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <item.icon size={16} className={colorClass} />
          {!isCollapsed && <span className={colorClass}>{item.label}</span>}
        </div>
        {item.id === '2fa-setup' && !isCollapsed && (
          <div className="flex items-center ml-auto">
            {is2FAEnabled ? (
              <SquareCheckBig size={16} className="text-green-600" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className={`
        bg-white text-gray-900 shadow-lg transition-all duration-300 ease-in-out flex flex-col h-screen
        fixed top-0 z-50 rounded-r-xl
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-lg">SmartLift</span>}
        </div>
        <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
          {isCollapsed ? <ChevronRight size={16} className="text-gray-700" /> : <ChevronLeft size={16} className="text-gray-700" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
            onClick={handleNavigate}
            exact={item.exact}
          />
        ))}

        {user?.role === 'admin' && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4">
                  Administration
                </p>
              </div>
            )}
            {adminItems.map((item) => (
              <MenuItem
                key={item.id}
                path={item.path}
                icon={item.icon}
                label={item.label}
                onClick={handleNavigate}
                exact={item.exact}
              />
            ))}
          </>
        )}
      </nav>

      <div className="p-2 border-t border-gray-200 space-y-2 relative">
        {user && (
          <div className="relative">
            <button
              className={`w-full p-2 hover:bg-gray-100 transition-colors rounded-lg flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              {user.user_img ? (
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
              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email || user.username}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            <div
              className={`
                absolute bottom-full left-0 right-0 p-2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50
                transition-all duration-300 ease-in-out origin-bottom
                ${isUserMenuOpen && !isCollapsed ? 'max-h-96 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 pointer-events-none'}
              `}
            >
              <div className="space-y-1">
                {userMenuItems.map((item) => (
                  <UserMenuItem
                    key={item.id}
                    item={item}
                    onClick={handleNavigate}
                    isCollapsed={isCollapsed}
                  />
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

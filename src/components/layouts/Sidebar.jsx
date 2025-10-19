import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Settings, LogOut, ChevronLeft, ChevronRight, Shield, Users,
  Building, ChevronDown, Square, SquareCheckBig, Monitor, ClipboardList,
  UserCog, Crown, Factory, X,
} from "lucide-react";
import { FaTools } from "react-icons/fa";
import { GiElevator } from "react-icons/gi";
import { VscOrganization } from "react-icons/vsc";
import { TbMessageReport } from "react-icons/tb";
import { useAuth } from "../../contexts/AuthContext";

const DESKTOP_COLLAPSED_W = 64;
const DESKTOP_EXPANDED_W = 256;
const MOBILE_DRAWER_W = 280;

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen = false,
  setMobileOpen = () => { },
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMobileOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsUserMenuOpen(false);
    setMobileOpen(false);
  };

  const isActivePath = (pathname, path, { exact } = { exact: false }) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  const is2FAEnabled = !!user?.ga_enabled;

  const getProfileImageSrc = (imgUrl) =>
    imgUrl ? `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}` : "https://via.placeholder.com/150";

  const getMenuItemsByRole = (role) => {
    switch (role) {
      case "super_admin":
        return [
          { id: "dashboardsuperadmin", path: "/dashboardsuperadmin", icon: LayoutDashboard, label: "Dashboard", exact: true },
          { id: "monitor", path: "/monitor", icon: Monitor, label: "Lift Monitor", exact: true },
          { id: "orgs-buildings", path: "/orgs-buildings", icon: VscOrganization, label: "Organizations & Buildings", exact: true },
          { id: "elevators", path: "/elevators", icon: GiElevator, label: "Add Lift", exact: true },
          { id: "tools", path: "/tools", icon: FaTools, label: "Tools", exact: true },
          { id: "admin-assign", path: "/admin-assign", icon: ClipboardList, label: "Assign Task", exact: true },
          { id: "admin-users", path: "/admin-users", icon: Users, label: "User Management", exact: true },
        ];
      case "admin":
        return [
          { id: "dashboardadmin", path: "/dashboardadmin", icon: LayoutDashboard, label: "Dashboard", exact: true },
          { id: "monitor", path: "/monitor", icon: Monitor, label: "Lift Monitor", exact: true },
          { id: "orgs-buildings", path: "/orgs-buildings", icon: VscOrganization, label: "Organizations & Buildings", exact: true },
          { id: "elevators", path: "/elevators", icon: GiElevator, label: "Add Lift", exact: true },
          { id: "tools", path: "/tools", icon: FaTools, label: "Tools", exact: true },
          { id: "admin-assign", path: "/admin-assign", icon: ClipboardList, label: "Assign Task", exact: true },
        ];
      case "technician":
        return [
          { id: "dashboardtechnician", path: "/dashboardtechnician", icon: LayoutDashboard, label: "Dashboard", exact: true },
          { id: "monitor", path: "/monitor", icon: Monitor, label: "Lift Monitor", exact: true },
          { id: "reports", path: "/reports", icon: TbMessageReport, label: "Reports", exact: true },
          { id: "my-tasks", path: "/my-tasks", icon: ClipboardList, label: "My Tasks", exact: true },
        ];
      default:
        return [
          { id: "dashboard", path: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
          { id: "monitor", path: "/monitor", icon: Monitor, label: "Lift Monitor", exact: true },
          { id: "reports", path: "/reports", icon: TbMessageReport, label: "Reports", exact: true },
        ];
    }
  };

  const menuItems = useMemo(() => getMenuItemsByRole(user?.role), [user?.role]);

  const userMenuItems = [
    { id: "profile", path: "/profile", icon: Users, label: "UserProfile" },
    { id: "settings", path: "/settings", icon: Settings, label: "Settings" },
    { id: "2fa-setup", path: "/2fa-setup", icon: Shield, label: "2FA Setup" },
  ];

  const toggleSidebarDesktop = () => {
    setIsCollapsed(!isCollapsed);
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColor =
    user?.role === "super_admin" ? "bg-red-500"
      : user?.role === "admin" ? "bg-blue-500"
        : user?.role === "technician" ? "bg-green-500"
          : "bg-gray-500";

  const RoleIcon = (() => {
    switch (user?.role) {
      case "super_admin": return Crown;
      case "admin": return UserCog;
      case "technician": return Factory;
      default: return Users;
    }
  })();

  const MenuItem = ({ path, icon: Icon, label, exact = false }) => {
    const active = isActivePath(location.pathname, path, { exact });
    return (
      <button
        onClick={() => handleNavigate(path)}
        className={[
          "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left",
          active ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100",
          isCollapsed && !isMobile ? "justify-center px-2" : "",
        ].join(" ")}
        role="menuitem"
      >
        <Icon size={20} className="flex-shrink-0" />
        <span className={[
          "text-sm font-medium transition-all duration-300",
          isCollapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto",
        ].join(" ")}
        >
          {label}
        </span>
      </button>
    );
  };

  const UserMenuItem = ({ item }) => {
    const colorClass =
      item.id === "2fa-setup"
        ? is2FAEnabled ? "text-green-600" : "text-red-600"
        : "text-gray-700";

    const bgHover =
      item.id === "2fa-setup"
        ? is2FAEnabled ? "hover:bg-green-50" : "hover:bg-red-50"
        : "hover:bg-gray-100";

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.path)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${bgHover}`}
        role="menuitem"
      >
        <item.icon size={16} className={colorClass} />
        <span className={colorClass}>{item.label}</span>

        {item.id === "2fa-setup" && (
          <span className={`ml-auto flex items-center gap-1 ${colorClass}`}>
            {is2FAEnabled ? (
              <>
                <SquareCheckBig size={16} />
                <span className="text-xs font-medium">Enabled</span>
              </>
            ) : (
              <>
                <Square size={16} />
                <span className="text-xs font-medium">Disabled</span>
              </>
            )}
          </span>
        )}
      </button>
    );
  };

  const SidebarBody = (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${roleColor} rounded-lg flex items-center justify-center`}>
            <img
              src="/11.avif" 
              alt="SmartLift Logo"
              className="w-full h-full object-contain rounded-lg" 
            />
          </div>
          {(!isCollapsed || isMobile) && <span className="font-semibold  text-lg">SmartLift</span>}
        </div>

        {!isMobile ? (
          <button
            onClick={toggleSidebarDesktop}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight size={16} className="text-gray-700" /> : <ChevronLeft size={16} className="text-gray-700" />}
          </button>
        ) : (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} className="text-gray-700" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-auto" role="menu" aria-label="Primary">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            label={item.label}
            exact={item.exact}
          />
        ))}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-gray-200 space-y-2">
        {user && (
          <div>
            <button
              className="w-full p-2 hover:bg-gray-100 transition-colors rounded-lg flex items-center gap-2"
              onClick={() => setIsUserMenuOpen((v) => !v)}
              aria-expanded={isUserMenuOpen}
              aria-controls="sidebar-user-menu"
            >
              {user.user_img ? (
                <img
                  src={getProfileImageSrc(user.user_img)}
                  alt="User Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full ${roleColor} flex items-center justify-center`}>
                  <RoleIcon className="w-4 h-4 text-white" />
                </div>
              )}
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
                className={`text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              id="sidebar-user-menu"
              className={[
                "mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden",
                "transition-all duration-300 ease-in-out",
                isUserMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <div className="p-2 space-y-1">
                {userMenuItems.map((it) => (
                  <UserMenuItem key={it.id} item={it} />
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={[
          "hidden md:flex bg-white text-gray-900 shadow-lg transition-all duration-300 ease-in-out",
          "flex-col h-screen fixed top-0 z-50 rounded-r-xl",
          isCollapsed ? "w-16" : "w-64",
        ].join(" ")}
        style={{ width: isCollapsed ? DESKTOP_COLLAPSED_W : DESKTOP_EXPANDED_W }}
        aria-hidden={false}
      >
        {SidebarBody}
      </div>

      {/* Mobile drawer */}
      <div
        className={[
          "md:hidden fixed top-0 bottom-0 left-0 z-[70] w-[280px] max-w-[85vw] bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "flex flex-col rounded-r-2xl",
        ].join(" ")}
        style={{
          width: MOBILE_DRAWER_W,
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {SidebarBody}
      </div>

      {/* Overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        className={[
          "md:hidden fixed inset-0 z-[65] bg-black/40 backdrop-blur-[1px]",
          "transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      />
    </>
  );
}

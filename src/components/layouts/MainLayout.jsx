// src/components/layouts/MainLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileMenu from "./MobileMenu";
import { useLocation } from "react-router-dom";

const SIDEBAR_EXPANDED_PX = 256; // 16rem
const SIDEBAR_COLLAPSED_PX = 64;  // 4rem

export default function MainLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("sl:sidebar-collapsed") === "1"; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(false);
  const { pathname } = useLocation();

  // เส้นทางที่อยากให้เต็มจอ (ไม่บังคับ max width / padding หนา)
  const fullBleed = useMemo(() => {
    return pathname.startsWith("/monitor"); // ปรับเพิ่มเส้นทางอื่นได้
  }, [pathname]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sl:sidebar-collapsed", isCollapsed ? "1" : "0"); } catch {}
  }, [isCollapsed]);

  const desktopPaddingLeft = isCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800">
      {isMobile ? (
        <div className="flex flex-col min-h-dvh">
          <Header />
          <main className="flex-1 h-dvh overflow-hidden pt-[4.4rem] pb-[5rem]">
            <div className="h-full overflow-auto px-2">
              {children}
            </div>
          </main>
          <MobileMenu />
        </div>
      ) : (
        <>
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <main
            className="h-dvh overflow-hidden transition-[padding] duration-300 ease-in-out"
            style={{ paddingLeft: desktopPaddingLeft }}
          >
            <div className={`h-full overflow-auto ${fullBleed ? "px-0" : "px-6 md:px-8 py-6"}`}>
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

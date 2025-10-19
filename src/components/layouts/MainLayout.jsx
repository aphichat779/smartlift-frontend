import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./Sidebar";
import MobileTopBar from "./MobileTopBar";
import { useLocation } from "react-router-dom";

const SIDEBAR_EXPANDED_PX = 256;
const SIDEBAR_COLLAPSED_PX = 64;

export default function MainLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("sl:sidebar-collapsed") === "1"; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { pathname } = useLocation();
  const fullBleed = useMemo(() => pathname.startsWith("/monitor"), [pathname]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sl:sidebar-collapsed", isCollapsed ? "1" : "0"); } catch {}
  }, [isCollapsed]);

  // ปิดเมนูเมื่อเปลี่ยน route และล็อก scroll เมื่อเมนูเปิด
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const body = document.body;
    if (mobileOpen) {
      const prev = body.style.overflow;
      body.style.overflow = "hidden";
      return () => { body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const desktopPaddingLeft = isCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  return (
    <div className="min-h-[100dvh] text-slate-800 relative overflow-hidden">
      {/* พื้นหลังแบบไล่เฉด + glow */}
      <div className="absolute inset-0 -z-10
                      bg-[linear-gradient(180deg,#f7f8fb_0%,#eef1f7_40%,#e9ecf5_70%,#f7f8fb_100%)]" />
      <div className="pointer-events-none absolute -top-24 -left-24 w-[900px] h-[500px]
                      bg-[radial-gradient(600px_300px_at_center,rgba(59,130,246,0.22),transparent_60%)]
                      blur-2xl -z-10" />
      <div className="pointer-events-none absolute -top-28 -right-20 w-[1000px] h-[520px]
                      bg-[radial-gradient(700px_320px_at_center,rgba(236,72,153,0.20),transparent_60%)]
                      blur-2xl -z-10" />

      {/* Sidebar (desktop + mobile drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {isMobile && <MobileTopBar onMenu={() => setMobileOpen(true)} />}

      {/* Content */}
      {isMobile ? (
        <main
          id="app-content"
          className={`min-h-[100dvh] overflow-auto ${fullBleed ? "px-0" : "px-4 py-4"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 56px)" }}
        >
          {children}
        </main>
      ) : (
        <main
          id="app-content"
          className="h-[100dvh] overflow-auto transition-[padding] duration-300 ease-in-out"
          style={{ paddingLeft: desktopPaddingLeft }}
        >
          <div className={`${fullBleed ? "px-0" : "px-6 md:px-8 py-6"}`}>
            {children}
          </div>
        </main>
      )}
    </div>
  );
}

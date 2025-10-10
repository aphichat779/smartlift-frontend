// src/components/layouts/MainLayout.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileMenu from "./MobileMenu";
import { useLocation } from "react-router-dom";

const SIDEBAR_EXPANDED_PX = 256;
const SIDEBAR_COLLAPSED_PX = 64;

// ตั้งให้ตรงกับ header/menu จริงของคุณ (โดยประมาณ)
const HEADER_H = 70;
const MENU_H = 72;

export default function MainLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("sl:sidebar-collapsed") === "1"; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [hideBars, setHideBars] = useState(false);
  const scrollRef = useRef(null);

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

  // ตรวจการเลื่อนเฉพาะคอนเทนเนอร์ที่เลื่อนจริง
  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;

    let lastY = el.scrollTop;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currY = el.scrollTop;
        const dy = currY - lastY;
        if (Math.abs(dy) > 8) {
          setHideBars(dy > 0 && currY > 0);
          lastY = currY;
        }
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const desktopPaddingLeft = isCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  // คิด padding ตามสถานะซ่อน/โชว์
  const topPad = `calc(var(--safe-top) + ${hideBars ? 0 : HEADER_H}px)`;
  const bottomPad = `calc(var(--safe-bottom) + ${hideBars ? 0 : MENU_H}px)`;

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800">
      {isMobile ? (
        <div className="flex flex-col min-h-svh">
          <Header hiddenOnScroll={hideBars} />
          <main
            className="flex-1 h-svh overflow-hidden transition-[padding] duration-200"
            style={{ paddingTop: topPad, paddingBottom: bottomPad }}
          >
            <div
              ref={scrollRef}
              className={`h-full overflow-auto ${fullBleed ? "px-0" : "px-2"}`}
            >
              {children}
            </div>
          </main>
          <MobileMenu hiddenOnScroll={hideBars} />
        </div>
      ) : (
        <>
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <main
            className="h-svh overflow-hidden transition-[padding] duration-300 ease-in-out"
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

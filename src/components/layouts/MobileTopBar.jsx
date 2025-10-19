import React from "react";
import { Menu } from "lucide-react";

export default function MobileTopBar({ onMenu }) {
  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-[60] h-14
                 bg-white/40 backdrop-blur-2xl
                 ring-1 ring-white/40 shadow-[0_8px_30px_rgba(2,6,23,0.15)]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      role="banner"
    >
      <div className="h-full flex items-center px-3 gap-3">
        {/* Hamburger */}
        <button
          aria-label="Open menu"
          aria-controls="mobile-drawer"
          aria-expanded="false"
          onClick={onMenu}
          className="p-2 rounded-xl hover:bg-white/40 active:bg-white/50 transition-colors ring-1 ring-white/30"
        >
          <Menu size={22} className="text-slate-700" />
        </button>

        {/* Title / brand */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate leading-none text-slate-900">SmartLift</div>
          <div className="text-xs text-slate-600 truncate leading-none mt-0.5">
            my.smartlift
          </div>
        </div>
      </div>
    </div>
  );
}

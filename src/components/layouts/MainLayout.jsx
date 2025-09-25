// src/components/layouts/MainLayout.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';

const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 md:flex-row">
      {isMobile ? (
        <>
          <Header />
          <main className="flex-1 overflow-auto px-2 pt-[4.4rem] pb-[5rem]">
            {children}
          </main>
          <MobileMenu />
        </>
      ) : (
        <>
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <main
            className="flex-1 overflow-auto transition-all duration-300 ease-in-out"
            style={{ marginLeft: isCollapsed ? '4rem' : '16rem' }}
          >
            <div className="p-8">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default MainLayout;
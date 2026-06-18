import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2.5 text-white/90 transition hover:bg-white/10"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">
              Admin panel
            </p>
            <p className="truncate text-[11px] text-white/45">DOST Marinduque</p>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

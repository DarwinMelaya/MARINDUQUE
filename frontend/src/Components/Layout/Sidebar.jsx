import { NavLink, useNavigate } from "react-router-dom";
import { ADMIN_TOKEN_KEY } from "../../api/client";

const navClass = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]"
      : "text-white/65 hover:bg-white/5 hover:text-white",
  ].join(" ");

const Sidebar = ({ mobileOpen = false, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate("/login", { replace: true });
    onClose?.();
  };

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => onClose?.()}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={[
          "z-50 flex w-64 shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm",
          "fixed inset-y-0 left-0 md:sticky md:top-0 md:h-screen",
          "transition-transform duration-200 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
      <div className="border-b border-white/10 px-5 py-6">
        <div className="mb-4 flex items-center justify-between md:hidden">
          <span className="text-xs font-semibold tracking-wide text-white/65">
            Menu
          </span>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2 text-white/90 transition hover:bg-white/10"
            aria-label="Close menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FDB913] shadow-[0_0_12px_rgba(253,185,19,.6)]" />
          Admin
        </div>
        <p className="mt-3 text-lg font-semibold tracking-tight text-white">
          DOST Marinduque
        </p>
        <p className="mt-1 text-xs text-white/45">Control panel</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <NavLink
          to="/dashboard"
          end
          className={navClass}
          onClick={() => onClose?.()}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#0054A6]/25 text-[#7dd3fc]"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </span>
          Dashboard
        </NavLink>

        <NavLink
          to="/admin-programs"
          className={navClass}
          onClick={() => onClose?.()}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#0054A6]/25 text-[#7dd3fc]"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </span>
          Programs
        </NavLink>

        <NavLink
          to="/admin-post"
          className={navClass}
          onClick={() => onClose?.()}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#0054A6]/25 text-[#7dd3fc]"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </span>
          Posts
        </NavLink>

        <NavLink
          to="/admin-coral-reef-mapping"
          className={navClass}
          onClick={() => onClose?.()}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#0054A6]/25 text-[#7dd3fc]"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 20.25h12M6.75 3.75h10.5A2.25 2.25 0 0119.5 6v8.25a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 14.25V6a2.25 2.25 0 012.25-2.25zM9 7.5h6m-6 3h4.5"
              />
            </svg>
          </span>
          Coral Reef Mapping
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <NavLink
          to="/"
          className="mb-3 block rounded-xl px-4 py-2.5 text-center text-sm text-white/55 transition hover:bg-white/5 hover:text-white/90"
          onClick={() => onClose?.()}
        >
          ← Public site
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          Log out
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;

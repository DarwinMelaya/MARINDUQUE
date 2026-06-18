const Head = () => {
  return (
    <header className="relative w-full overflow-hidden">
      <div
        className="relative isolate"
        style={{
          backgroundImage: "url('/Assets/DostBackground.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A2E5C]/95 via-[#0B3B76]/85 to-black/60" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(99,179,237,.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.25)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(253,185,19,.20),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#FDB913] shadow-[0_0_18px_rgba(253,185,19,.65)]" />
            DOST Region IV-B • Tech-enabled services
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            <span className="block text-white/90">Welcome to</span>
            <span className="relative block">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-y-[2px] bg-gradient-to-r from-[#0054A6] via-cyan-300 to-[#FDB913] bg-clip-text text-transparent blur-md opacity-80"
              >
                DOST-MARINDUQUE
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0054A6] via-cyan-300 to-[#FDB913] bg-clip-text text-transparent opacity-70 [text-shadow:0_0_14px_rgba(34,211,238,.55),0_0_28px_rgba(0,84,166,.45),0_0_44px_rgba(253,185,19,.25)]"
              >
                DOST-MARINDUQUE
              </span>
              <span className="relative bg-gradient-to-r from-[#0054A6] via-cyan-300 to-[#FDB913] bg-[length:220%_220%] bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(0,84,166,.55)] motion-safe:animate-[gradient_6s_ease-in-out_infinite]">
                DOST-MARINDUQUE
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
            Empowering Marinduque through Science, Technology, and Innovation
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/map-view"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,84,166,.35)] transition hover:bg-[#0A5EC0] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-[#07162C]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 2.25 19.18V6.695c0-.710.401-1.360 1.037-1.677L7.162 2.58h1Zm-.161.92v13.5l.084-.042 4.994 2.498a.375.375 0 0 0 .336 0l4.875-2.437a.375.375 0 0 0 .211-.337V4.82a.375.375 0 0 0-.543-.334l-3.869 1.934a1.875 1.875 0 0 1-1.678 0L8.161 3.922A.375.375 0 0 0 8 3.5Z"
                  clipRule="evenodd"
                />
              </svg>
              Map Projects
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Digital Services", value: "Fast & Paperless" },
              { label: "Transparency", value: "Trackable Requests" },
              { label: "Support", value: "Ready Assistance" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur"
              >
                <div className="text-xs font-medium tracking-wide text-white/60">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Head;

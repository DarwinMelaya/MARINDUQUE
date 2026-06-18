const About = () => {
  return (
    <div className="relative min-h-0 w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(99,179,237,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(253,185,19,.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(0,84,166,.16),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-200 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.55)]" />
            About us
          </div>
          <h2 className="mt-3 text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white/90 bg-clip-text text-transparent">
              DOST Marinduque
            </span>
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            The Provincial Science and Technology Office connects Marinduque with the Department of
            Science and Technology—working with local government, communities, schools, and
            businesses to deliver Science, Technology, and Innovation (STI) services that support
            inclusive development. As part of{" "}
            <span className="font-medium text-white/85">DOST MIMAROPA</span>, we help implement
            regional programs, technical assistance, and STI promotion tailored to provincial needs.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur sm:p-7">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FDB913]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FDB913]" />
              Vision
            </div>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-white/90 sm:text-base">
              The standard of performance excellence and well-esteemed prime mover of Science,
              Technology, and Innovation (STI) for inclusive growth in MIMAROPA.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur sm:p-7">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Mission
            </div>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-white/90 sm:text-base">
              To plan and implement Science, Technology, and Innovation (STI) services toward
              inclusive regional development.
            </p>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0054A6]/15 via-white/[0.04] to-white/[0.02] p-6 backdrop-blur sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Quality policy
          </div>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
            We are committed to provide relevant services to both the government and private sectors
            in MIMAROPA Region with the highest standards of quality and reliability within our
            capabilities and resources according to customer and all applicable regulatory and
            statutory requirements and to continually improve the effectiveness of our QMS at all
            times in order to meet customer satisfaction.
          </p>
        </article>
      </div>
    </div>
  );
};

export default About;

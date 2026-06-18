const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const SOCIALS = [
  {
    id: "facebook",
    name: "Facebook",
    handle: "@pstc.marinduque",
    description:
      "Official DOST Marinduque (PSTC) page — programs, advisories, and community updates.",
    href: "https://www.facebook.com/psto.marinduque",
    Icon: FacebookIcon,
    accent: "from-[#1877F2]/25 to-white/[0.03]",
    ring: "hover:border-[#1877F2]/45",
  },
];

const CONTACT = {
  addressLines: [
    "PSTC Building, PEO Capitol Compound",
    "Bangbangalon, Boac, Marinduque",
  ],
  phone: "(042) 332-0302",
  phoneHref: "tel:+63423320302",
  email: "pstc.marinduque@mimaropa.dost.gov.ph",
  emailHref: "mailto:pstc.marinduque@mimaropa.dost.gov.ph",
};

const ContactUs = () => {
  return (
    <div className="relative min-h-0 w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(99,179,237,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(253,185,19,.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_100%,rgba(0,84,166,.18),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FDB913]/30 bg-[#FDB913]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#FDB913] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#FDB913] shadow-[0_0_12px_rgba(253,185,19,.55)]" />
            Contact
          </div>
          <h2 className="mt-3 text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white/90 bg-clip-text text-transparent">
              DOST Marinduque
            </span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Reach the Provincial Science and Technology Center (PSTC) for
            inquiries, coordination, and STI services. Follow our official
            social page for the latest news and announcements.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur sm:p-7">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Office &amp; contact
            </h3>
            <address className="mt-4 not-italic text-sm leading-relaxed text-white/85">
              {CONTACT.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/45">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a
                    href={CONTACT.phoneHref}
                    className="font-medium text-cyan-200/95 underline decoration-cyan-400/35 underline-offset-2 transition hover:text-cyan-100 hover:decoration-cyan-300/60"
                  >
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-white/45">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={CONTACT.emailHref}
                    className="break-all font-medium text-cyan-200/95 underline decoration-cyan-400/35 underline-offset-2 transition hover:text-cyan-100 hover:decoration-cyan-300/60"
                  >
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Social media
            </h3>
            <ul className="mt-4 flex flex-col gap-4">
              {SOCIALS.map(
                ({
                  id,
                  name,
                  handle,
                  description,
                  href,
                  Icon,
                  accent,
                  ring,
                }) => (
                  <li key={id}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex gap-4 rounded-2xl border border-white/10 bg-gradient-to-br ${accent} p-4 transition ${ring} hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#FDB913]/50 focus:ring-offset-2 focus:ring-offset-black sm:p-5`}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner ring-1 ring-white/10 transition group-hover:bg-white/15">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-white">
                            {name}
                          </span>
                          <span className="text-xs font-medium text-white/50">
                            {handle}
                          </span>
                        </span>
                        <span className="mt-1 block text-pretty text-sm leading-relaxed text-white/70">
                          {description}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200/90 transition group-hover:text-cyan-100">
                          Visit page
                          <span
                            aria-hidden="true"
                            className="translate-x-0 transition group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </span>
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

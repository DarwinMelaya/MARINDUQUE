import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { supabase, getApiErrorMessage } from "../../api/client";
import CoralReefMap from "../../Components/Admin/CoralReefMap";

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function pct(part, total) {
  if (!total) return 0;
  return clamp01(part / total);
}

function formatPct(n) {
  return `${Math.round(n * 100)}%`;
}

function formatDateTime(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SparkBars({ series = [] }) {
  const max = Math.max(1, ...series.map((x) => Number(x?.count) || 0));
  return (
    <div className="flex h-10 w-full items-end gap-1">
      {series.map((x) => {
        const v = Number(x?.count) || 0;
        const h = Math.max(2, Math.round((v / max) * 40));
        return (
          <div
            key={x.day}
            className="flex-1 rounded-sm bg-cyan-300/25"
            style={{ height: h }}
            title={`${x.day}: ${v}`}
          />
        );
      })}
    </div>
  );
}

const STATUS_COLORS = {
  Healthy: "#22C55E",
  "Bleached Damaged": "#F59E0B",
  Recovering: "#38BDF8",
  Dead: "#EF4444",
};

function StatusDonut({ counts }) {
  const total =
    Object.values(counts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0) || 0;
  const segments = ["Healthy", "Recovering", "Bleached Damaged", "Dead"].map((k) => ({
    key: k,
    value: Number(counts?.[k] || 0),
    color: STATUS_COLORS[k] || "#94a3b8",
  }));

  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = acc;
      const span = total ? (s.value / total) * 100 : 0;
      const end = start + span;
      acc = end;
      return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    })
    .filter(Boolean)
    .join(", ");

  const bg = total
    ? `conic-gradient(${stops})`
    : "conic-gradient(#334155 0% 100%)";

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-20 w-20 rounded-full border border-white/10"
        style={{ background: bg }}
      >
        <div className="absolute inset-3 rounded-full border border-white/10 bg-slate-950/95" />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/85">
          {total}
        </div>
      </div>
      <div className="grid gap-1 text-xs text-white/75">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-semibold text-white/85">{s.key}</span>
            <span className="text-white/40">•</span>
            <span className="tabular-nums text-white/80">{s.value}</span>
            <span className="text-white/40">({formatPct(pct(s.value, total))})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all tables in parallel
        const [coralRes, projectsRes, announcementsRes] = await Promise.all([
          supabase.from("coral_reefs").select("*").order("created_at", { ascending: false }),
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          supabase.from("announcements").select("id").order("created_at", { ascending: false }),
        ]);

        if (coralRes.error) throw coralRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (announcementsRes.error) throw announcementsRes.error;

        const corals = coralRes.data ?? [];
        const projects = projectsRes.data ?? [];

        // ── Coral KPIs ─────────────────────────────────────────────────────
        const totalCoralReefs = corals.length;
        const coralMappedCount = corals.filter(
          (c) => c.latitude != null && c.longitude != null,
        ).length;
        const coralWithAreaCount = corals.filter(
          (c) => Array.isArray(c.area_coordinates) && c.area_coordinates.length >= 3,
        ).length;
        const coralPhotosTotal = corals.reduce(
          (sum, c) => sum + (Array.isArray(c.photos) ? c.photos.length : 0),
          0,
        );

        // ── Coral by status ────────────────────────────────────────────────
        const coralByStatus = corals.reduce((acc, c) => {
          acc[c.coral_status] = (acc[c.coral_status] ?? 0) + 1;
          return acc;
        }, {});

        // ── Coral daily creation (last 30 days) ────────────────────────────
        const now = new Date();
        const dayMap = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          dayMap[d.toISOString().slice(0, 10)] = 0;
        }
        for (const c of corals) {
          const day = c.created_at?.slice(0, 10);
          if (day && dayMap[day] !== undefined) dayMap[day]++;
        }
        const coralCreatedDaily = Object.entries(dayMap).map(([day, count]) => ({
          day,
          count,
        }));

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const coralCreatedLast7 = corals.filter(
          (c) => c.created_at && new Date(c.created_at) >= sevenDaysAgo,
        ).length;

        // ── Needs attention ────────────────────────────────────────────────
        const needsAttention = corals
          .filter((c) => {
            const criticalStatus = ["Bleached Damaged", "Dead"].includes(c.coral_status);
            const missingCoordinates = c.latitude == null || c.longitude == null;
            const missingArea =
              !Array.isArray(c.area_coordinates) || c.area_coordinates.length < 3;
            const missingPhotos = !Array.isArray(c.photos) || c.photos.length === 0;
            return criticalStatus || missingCoordinates || missingArea || missingPhotos;
          })
          .slice(0, 10)
          .map((c) => ({
            id: c.id,
            coralName: c.coral_name,
            coralStatus: c.coral_status,
            hasCoordinates: c.latitude != null && c.longitude != null,
            areaPoints: Array.isArray(c.area_coordinates) ? c.area_coordinates.length : 0,
            photoCount: Array.isArray(c.photos) ? c.photos.length : 0,
            updatedAt: c.updated_at,
            flags: {
              criticalStatus: ["Bleached Damaged", "Dead"].includes(c.coral_status),
              missingCoordinates: c.latitude == null || c.longitude == null,
              missingArea:
                !Array.isArray(c.area_coordinates) || c.area_coordinates.length < 3,
              missingPhotos: !Array.isArray(c.photos) || c.photos.length === 0,
            },
          }));

        // ── Recent coral activity ──────────────────────────────────────────
        const recentActivity = corals.slice(0, 5).map((c) => ({
          id: c.id,
          coralName: c.coral_name,
          coralStatus: c.coral_status,
          photoCount: Array.isArray(c.photos) ? c.photos.length : 0,
          areaPoints: Array.isArray(c.area_coordinates) ? c.area_coordinates.length : 0,
          updatedAt: c.updated_at,
        }));

        // ── Projects KPIs ──────────────────────────────────────────────────
        const projectByStatus = projects.reduce((acc, p) => {
          acc[p.project_status] = (acc[p.project_status] ?? 0) + 1;
          return acc;
        }, {});
        const projectByProgramType = projects.reduce((acc, p) => {
          acc[p.program_type] = (acc[p.program_type] ?? 0) + 1;
          return acc;
        }, {});
        const recentProjects = projects.slice(0, 5).map((p) => ({
          id: p.id,
          title: p.title,
          programType: p.program_type,
          projectStatus: p.project_status,
          beneficiary: p.beneficiary,
          updatedAt: p.updated_at,
        }));

        // ── Map records (coral reefs with coords) ──────────────────────────
        const mapRecords = corals
          .filter((c) => c.latitude != null && c.longitude != null)
          .map((c) => ({
            id: c.id,
            coralName: c.coral_name,
            coralType: c.coral_type,
            reefStructure: c.reef_structure,
            description: c.description,
            coralStatus: c.coral_status,
            location: { latitude: c.latitude, longitude: c.longitude },
            areaCoordinates: Array.isArray(c.area_coordinates) ? c.area_coordinates : [],
            photos: Array.isArray(c.photos) ? c.photos : [],
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }));

        if (!cancelled) {
          setData({
            kpis: {
              totalCoralReefs,
              coralMappedCount,
              coralWithAreaCount,
              coralPhotosTotal,
              totalProjects: projects.length,
              totalAnnouncements: (announcementsRes.data ?? []).length,
              coralCreatedLast7,
            },
            coralByStatus,
            coralCreatedDaily,
            needsAttention,
            recentActivity,
            projectByStatus,
            projectByProgramType,
            recentProjects,
            mapRecords,
            generatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(err, "Could not load dashboard.");
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = data?.kpis || {};
  const coralByStatus = data?.coralByStatus || {};
  const daily = Array.isArray(data?.coralCreatedDaily) ? data.coralCreatedDaily : [];

  const last30 = useMemo(() => daily.slice(-30), [daily]);
  const last7 = useMemo(() => daily.slice(-7), [daily]);

  const attention = Array.isArray(data?.needsAttention) ? data.needsAttention : [];
  const recent = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const projectByStatus = data?.projectByStatus || {};
  const projectByProgramType = data?.projectByProgramType || {};
  const recentProjects = Array.isArray(data?.recentProjects) ? data.recentProjects : [];

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Quick health snapshot, mapping coverage, and items that need attention.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Link
            to="/admin-coral-reef-mapping"
            className="w-full rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 sm:w-auto"
          >
            Open Coral Reef Mapping
          </Link>
          <Link
            to="/admin-programs"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white/85 transition hover:bg-white/10 sm:w-auto"
          >
            Open Admin Programs
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-8 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total coral reef records",
              value: kpis.totalCoralReefs ?? (loading ? "..." : 0),
              hint: "All entries in the system",
            },
            {
              label: "Mapped (with coordinates)",
              value: kpis.coralMappedCount ?? (loading ? "..." : 0),
              hint: "Has latitude + longitude",
            },
            {
              label: "With drawn area (polygon)",
              value: kpis.coralWithAreaCount ?? (loading ? "..." : 0),
              hint: "At least 3 area points",
            },
            {
              label: "Photos uploaded (total)",
              value: kpis.coralPhotosTotal ?? (loading ? "..." : 0),
              hint: "Across all coral records",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                {card.label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {card.value}
              </div>
              <div className="mt-2 text-xs text-white/45">{card.hint}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                Coral health snapshot
              </div>
              <div className="mt-1 text-sm font-semibold text-white/85">
                Status breakdown
              </div>
            </div>
            <div className="text-[11px] text-white/50">
              Updated: {formatDateTime(data?.generatedAt)}
            </div>
          </div>
          <div className="mt-4">
            <StatusDonut counts={coralByStatus} />
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-white/80">New records</div>
              <div className="text-xs text-white/55">
                last 7 days:{" "}
                <span className="font-semibold text-white/85">
                  {kpis.coralCreatedLast7 ?? 0}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <SparkBars series={last7} />
            </div>
            <div className="mt-2 text-[11px] text-white/45">
              30-day trend preview
            </div>
            <div className="mt-2">
              <SparkBars series={last30} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                Projects snapshot
              </div>
              <div className="mt-1 text-sm font-semibold text-white/85">
                Program + status breakdown
              </div>
            </div>
            <div className="text-xs text-white/55">
              Total:{" "}
              <span className="font-semibold text-white/85">
                {kpis.totalProjects ?? (loading ? "..." : 0)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-semibold text-white/80">By status</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70">
                {["Ongoing", "Graduated", "Terminated"].map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
                  >
                    <span className="font-semibold text-white/85">{k}</span>{" "}
                    <span className="text-white/40">•</span>{" "}
                    <span className="tabular-nums text-white/80">
                      {Number(projectByStatus?.[k] || 0)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-semibold text-white/80">By program</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70">
                {["GIA", "CEST", "SSCP", "SETUP"].map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
                  >
                    <span className="font-semibold text-white/85">{k}</span>{" "}
                    <span className="text-white/40">•</span>{" "}
                    <span className="tabular-nums text-white/80">
                      {Number(projectByProgramType?.[k] || 0)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-white/80">Recent projects</div>
                <Link
                  to="/admin-programs"
                  className="text-xs font-semibold text-white/70 hover:text-white"
                >
                  View all
                </Link>
              </div>
              {loading ? (
                <div className="mt-3 text-sm text-white/55">Loading…</div>
              ) : recentProjects.length === 0 ? (
                <div className="mt-3 text-sm text-white/55">No projects yet.</div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {recentProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {p.title}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/60">
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
                            {p.programType}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
                            {p.projectStatus}
                          </span>
                          <span className="truncate">
                            Beneficiary:{" "}
                            <span className="text-white/80">{p.beneficiary}</span>
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] text-white/45">
                        {formatDateTime(p.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                  Map preview
                </div>
                <div className="mt-1 text-sm font-semibold text-white/85">
                  Coral reefs on map (pins + polygons)
                </div>
              </div>
              <Link
                to="/admin-coral-reef-mapping"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                View full map
              </Link>
            </div>
            <div className="mt-4">
              <CoralReefMap records={Array.isArray(data?.mapRecords) ? data.mapRecords : []} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                  Attention needed
                </div>
                <div className="mt-1 text-sm font-semibold text-white/85">
                  Prioritize these records
                </div>
              </div>
              <div className="text-xs text-white/55">
                {attention.length} items
              </div>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-white/55">Loading…</div>
            ) : attention.length === 0 ? (
              <div className="mt-4 text-sm text-white/55">
                No items need attention right now.
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {attention.map((x) => (
                  <div
                    key={x.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {x.coralName}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/60">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                            {x.coralStatus}
                          </span>
                          {x.flags?.criticalStatus ? (
                            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-100/90">
                              Critical
                            </span>
                          ) : null}
                          {x.flags?.missingCoordinates ? (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-100/90">
                              Missing coordinates
                            </span>
                          ) : null}
                          {x.flags?.missingArea ? (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-100/90">
                              Missing area
                            </span>
                          ) : null}
                          {x.flags?.missingPhotos ? (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-100/90">
                              Missing photos
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] text-white/45">
                        {formatDateTime(x.updatedAt)}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/55">
                      <span>Coords: {x.hasCoordinates ? "Yes" : "No"}</span>
                      <span>Area points: {x.areaPoints ?? 0}</span>
                      <span>Photos: {x.photoCount ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
                  Recent activity
                </div>
                <div className="mt-1 text-sm font-semibold text-white/85">
                  Latest updates
                </div>
              </div>
              <div className="text-xs text-white/55">
                Projects: <span className="font-semibold text-white/85">{kpis.totalProjects ?? 0}</span>{" "}
                • Posts:{" "}
                <span className="font-semibold text-white/85">{kpis.totalAnnouncements ?? 0}</span>
              </div>
            </div>
            {loading ? (
              <div className="mt-4 text-sm text-white/55">Loading…</div>
            ) : (
              <div className="mt-4 grid gap-2">
                {recent.map((x) => (
                  <div
                    key={x.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white/90">
                        {x.coralName}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/60">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                          {x.coralStatus}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                          Photos: {x.photoCount ?? 0}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                          Area: {x.areaPoints ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] text-white/45">
                      {formatDateTime(x.updatedAt)}
                    </div>
                  </div>
                ))}
                {recent.length === 0 ? (
                  <div className="text-sm text-white/55">No recent updates.</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

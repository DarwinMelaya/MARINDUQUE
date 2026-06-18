import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { getApiErrorMessage } from "../../api/client";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "../../api/projectsApi";
import AdminProgramMap from "../../Components/Admin/AdminProgramMap";
import ProgramsModals from "../../Components/Modals/AdminModals/ProgramsModals";
import { PROGRAM_STYLES } from "../../Components/Map/programMarkers";
import {
  PROGRAM_ORDER,
  countProjectsByProgramType,
  projectHasMapCoordinates,
} from "../../utils/projectSites";

const AdminPrograms = () => {
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [pickLat, setPickLat] = useState("");
  const [pickLng, setPickLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProjects();
        if (!cancelled) {
          setProjects(list);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(
            err,
            "Could not load projects from the server.",
          );
          setLoadError(msg);
          toast.error(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickerPosition = useMemo(() => {
    const lat = Number.parseFloat(String(pickLat).replace(",", "."));
    const lng = Number.parseFloat(String(pickLng).replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [pickLat, pickLng]);

  const countsByProgram = useMemo(
    () => countProjectsByProgramType(projects),
    [projects],
  );

  const withoutMapPin = useMemo(
    () => projects.filter((p) => !projectHasMapCoordinates(p)),
    [projects],
  );

  const handleSave = async (payload) => {
    if (payload.editingId) {
      const { editingId, ...rest } = payload;
      const updated = await updateProject(editingId, rest);
      setProjects((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x)),
      );
      toast.success("Project updated.");
    } else {
      const created = await createProject(payload);
      setProjects((prev) => [created, ...prev]);
      toast.success("Project saved.");
    }
  };

  const openModal = () => {
    setEditingProject(null);
    setPickLat("");
    setPickLng("");
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProject(p);
    setPickLat(
      p.location?.latitude != null ? String(p.location.latitude) : "",
    );
    setPickLng(
      p.location?.longitude != null ? String(p.location.longitude) : "",
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProject(null);
    setPickLat("");
    setPickLng("");
  };

  const handleDeleteRow = async (p) => {
    if (
      !window.confirm(
        `Delete "${p.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(p.id);
    try {
      await deleteProject(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Project deleted.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete project."));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePickOnMap = (lat, lng) => {
    setPickLat(lat.toFixed(6));
    setPickLng(lng.toFixed(6));
    toast.success("Location set from map.");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickLat(position.coords.latitude.toFixed(6));
        setPickLng(position.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Current location set.");
      },
      (error) => {
        setLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Allow location access to use this."
            : "Could not get current location.";
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="w-full max-w-none">
      {loadError ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {loadError}
        </p>
      ) : null}

      {!modalOpen ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Programs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
                Projects are stored in the database. Use{" "}
                <span className="text-white/75">Add project</span> to open the
                form — click the map there to place a pin, or type coordinates.
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="w-full shrink-0 rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 sm:w-auto"
            >
              Add project
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROGRAM_ORDER.map((key) => {
              const style = PROGRAM_STYLES[key];
              if (!style) return null;
              const n = countsByProgram[key] ?? 0;
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: style.color,
                        boxShadow: `0 0 12px ${style.color}66`,
                      }}
                    />
                    <span className="text-xs font-semibold tracking-wide text-white/70">
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                    {n}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {n === 1 ? "project" : "projects"} (all)
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <AdminProgramMap projects={projects} />
          </div>

          {projects.length > 0 ? (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-white">
                Saved projects
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Mag-edit o mag-delete mula sa table. Ang Edit ay bubuksan ang
                parehong form na may mapa.
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/30 text-xs font-semibold uppercase tracking-wide text-white/55">
                      <th className="px-3 py-3 sm:px-4">Photo</th>
                      <th className="px-3 py-3 sm:px-4">Title</th>
                      <th className="px-3 py-3 sm:px-4">Program</th>
                      <th className="px-3 py-3 sm:px-4">Status</th>
                      <th className="px-3 py-3 sm:px-4">Beneficiary</th>
                      <th className="px-3 py-3 sm:px-4">Funding</th>
                      <th className="px-3 py-3 sm:px-4">Map pin</th>
                      <th className="px-3 py-3 text-right sm:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const imgs = Array.isArray(p.images)
                        ? p.images.filter(Boolean)
                        : [];
                      const accent =
                        PROGRAM_STYLES[p.programType]?.color ?? "#22D3EE";
                      const hasPin = projectHasMapCoordinates(p);
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.04]"
                        >
                          <td className="px-3 py-2.5 align-middle sm:px-4">
                            {imgs[0] ? (
                              <img
                                src={imgs[0]}
                                alt=""
                                className="h-11 w-14 rounded-lg object-cover ring-1 ring-white/10"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-11 w-14 items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/35">
                                —
                              </div>
                            )}
                          </td>
                          <td className="max-w-[200px] px-3 py-2.5 align-middle font-medium text-white sm:px-4">
                            <span className="line-clamp-2">{p.title}</span>
                          </td>
                          <td className="px-3 py-2.5 align-middle sm:px-4">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90"
                              style={{
                                boxShadow: `0 0 0 1px ${accent}33`,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: accent }}
                              />
                              {p.programType}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 align-middle text-white/80 sm:px-4">
                            {p.projectStatus}
                          </td>
                          <td className="max-w-[180px] px-3 py-2.5 align-middle text-white/65 sm:px-4">
                            <span className="line-clamp-2">{p.beneficiary}</span>
                          </td>
                          <td className="px-3 py-2.5 align-middle sm:px-4">
                            {(() => {
                              const parse = (v) => { const n = Number(String(v ?? "").replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
                              const dost  = parse(p.amountOfAssistance);
                              const cp    = parse(p.counterpartAmount);
                              const total = dost + cp;
                              return (
                                <div className="min-w-[120px] text-[11px]">
                                  {p.amountOfAssistance ? (
                                    <div className="flex justify-between gap-2 text-white/60">
                                      <span>DOST</span>
                                      <span className="font-semibold">₱{p.amountOfAssistance}</span>
                                    </div>
                                  ) : null}
                                  {p.counterpartName ? (
                                    <div className="flex justify-between gap-2 text-white/50">
                                      <span className="truncate max-w-[80px]">{p.counterpartName}</span>
                                      <span className="font-semibold shrink-0">{p.counterpartAmount ? `₱${p.counterpartAmount}` : "—"}</span>
                                    </div>
                                  ) : null}
                                  {total > 0 ? (
                                    <div className="flex justify-between gap-2 border-t border-white/10 pt-0.5 mt-0.5 font-semibold text-white/90">
                                      <span>Total</span>
                                      <span>₱{total.toLocaleString("en-PH")}</span>
                                    </div>
                                  ) : null}
                                  {!p.amountOfAssistance && !p.counterpartName ? (
                                    <span className="text-white/30">—</span>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 align-middle text-xs sm:px-4">
                            {hasPin ? (
                              <span className="text-emerald-300/90">Yes</span>
                            ) : (
                              <span className="text-amber-200/80">No</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle sm:px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => handleDeleteRow(p)}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100/95 transition hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                {deletingId === p.id ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {withoutMapPin.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
              <p className="font-medium text-amber-50/95">
                {withoutMapPin.length} project
                {withoutMapPin.length === 1 ? "" : "s"} without map coordinates
              </p>
              <p className="mt-1 text-xs text-amber-100/70">
                Add latitude and longitude when creating a project to show a pin
                on the map. Saved entries:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-white/85">
                {withoutMapPin.map((p) => (
                  <li key={p.id}>
                    <span className="font-semibold">{p.title}</span> (
                    {p.programType})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="fixed inset-0 z-[100] flex h-full min-h-0 flex-col overflow-y-auto bg-slate-950 md:flex-row md:overflow-hidden">
          <div className="relative flex min-h-[42vh] w-full flex-[1.2] flex-col md:min-h-0 md:overflow-hidden">
            <AdminProgramMap
              className="h-full min-h-[42vh] rounded-none border-x-0 border-t-0 md:min-h-0"
              splitLayout
              projects={projects}
              pickMode
              onPickLocation={handlePickOnMap}
              pickerPosition={pickerPosition}
            />
          </div>
          <div className="flex min-h-0 w-full min-w-0 flex-[0.95] flex-col overflow-y-auto border-t border-white/10 md:max-w-xl md:border-l md:border-t-0 lg:max-w-lg">
            <ProgramsModals
              onClose={closeModal}
              onSave={handleSave}
              latitude={pickLat}
              longitude={pickLng}
              onLatitudeChange={setPickLat}
              onLongitudeChange={setPickLng}
              onUseCurrentLocation={handleUseCurrentLocation}
              locating={locating}
              editingProject={editingProject}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrograms;

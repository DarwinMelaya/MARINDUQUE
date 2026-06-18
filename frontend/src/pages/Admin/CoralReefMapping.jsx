import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  createCoralReef,
  deleteCoralReef,
  fetchCoralReefs,
  updateCoralReef,
} from "../../api/coralReefsApi";
import { getApiErrorMessage } from "../../api/client";
import CoralReefMap from "../../Components/Admin/CoralReefMap";
import AddCoralReefModal from "../../Components/Modals/AdminModals/AddCoralReefModal";

const CoralReefMapping = () => {
  const [records, setRecords] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [pickLat, setPickLat] = useState("");
  const [pickLng, setPickLng] = useState("");
  const [pickAreaCoordinates, setPickAreaCoordinates] = useState([]);
  const [drawMode, setDrawMode] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsInitialLoading(true);
      const loadingStartedAt = Date.now();
      try {
        const list = await fetchCoralReefs();
        if (!cancelled) {
          setRecords(list);
          setLoadError("");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(
            err,
            "Could not load coral reef records from the server."
          );
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) {
          const elapsed = Date.now() - loadingStartedAt;
          const minLoaderMs = 800;
          const remaining = Math.max(0, minLoaderMs - elapsed);
          window.setTimeout(() => {
            if (!cancelled) setIsInitialLoading(false);
          }, remaining);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (payload) => {
    if (editingRecord?.id) {
      const updated = await updateCoralReef(editingRecord.id, payload);
      setRecords((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      return;
    }
    const created = await createCoralReef(payload);
    setRecords((prev) => [created, ...prev]);
  };

  const pickerPosition = useMemo(() => {
    const lat = Number.parseFloat(String(pickLat).replace(",", "."));
    const lng = Number.parseFloat(String(pickLng).replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [pickLat, pickLng]);

  const openModal = () => {
    setEditingRecord(null);
    setPickLat("");
    setPickLng("");
    setPickAreaCoordinates([]);
    setDrawMode(false);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const lat =
      record?.location?.latitude != null ? Number(record.location.latitude) : null;
    const lng =
      record?.location?.longitude != null ? Number(record.location.longitude) : null;
    setPickLat(lat == null || Number.isNaN(lat) ? "" : lat.toFixed(6));
    setPickLng(lng == null || Number.isNaN(lng) ? "" : lng.toFixed(6));
    setPickAreaCoordinates(
      Array.isArray(record?.areaCoordinates) ? record.areaCoordinates : []
    );
    setDrawMode(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    setPickLat("");
    setPickLng("");
    setPickAreaCoordinates([]);
    setDrawMode(false);
  };

  const handlePickOnMap = (lat, lng) => {
    if (drawMode) {
      setPickAreaCoordinates((prev) => [...prev, { latitude: lat, longitude: lng }]);
      return;
    }
    setPickLat(lat.toFixed(6));
    setPickLng(lng.toFixed(6));
    toast.success("Location set from map.");
  };

  const toggleDrawMode = () => {
    setDrawMode((prev) => !prev);
  };

  const handleUndoLastPoint = () => {
    setPickAreaCoordinates((prev) => prev.slice(0, -1));
  };

  const handleMoveDraftPoint = (index, lat, lng) => {
    setPickAreaCoordinates((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      next[index] = { latitude: lat, longitude: lng };
      return next;
    });
  };

  const handleClearArea = () => {
    setPickAreaCoordinates([]);
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete "${record.coralName}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(record.id);
    try {
      await deleteCoralReef(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
      toast.success("Coral reef record deleted.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete coral reef record."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative w-full max-w-none">
      {isInitialLoading ? (
        <div className="absolute inset-0 z-[120] flex min-h-[55vh] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <span className="h-11 w-11 animate-spin rounded-full border-4 border-cyan-400/25 border-t-cyan-300" />
            <p className="text-sm font-medium text-white/85">
              Loading coral reef data...
            </p>
            <p className="text-xs text-white/55">
              Please wait, enabled ang controls kapag ready na ang records.
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={isInitialLoading ? "pointer-events-none select-none opacity-70" : ""}
        aria-busy={isInitialLoading}
      >
      {loadError ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Coral Reef Mapping
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Add and monitor coral reef entries with type, health status, photo,
            and location coordinates.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          disabled={isInitialLoading}
          className="w-full shrink-0 rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 sm:w-auto"
        >
          Add coral reef
        </button>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex h-full min-h-0 flex-col overflow-y-auto bg-slate-950 md:flex-row md:overflow-hidden">
          <div className="relative flex min-h-[42vh] w-full flex-[1.2] flex-col md:min-h-0 md:overflow-hidden">
            <CoralReefMap
              className="h-full min-h-[42vh] rounded-none border-x-0 border-t-0 md:min-h-0"
              splitLayout
              records={records}
              pickMode
              onPickLocation={handlePickOnMap}
              pickerPosition={pickerPosition}
              drawMode={drawMode}
              onToggleDrawMode={toggleDrawMode}
              draftAreaCoordinates={pickAreaCoordinates}
              onUndoLastPoint={handleUndoLastPoint}
              enableDraftPointDrag={Boolean(editingRecord)}
              onMoveDraftPoint={handleMoveDraftPoint}
            />
          </div>
          <div className="flex min-h-0 w-full min-w-0 flex-[0.95] flex-col overflow-y-auto border-t border-white/10 md:max-w-xl md:border-l md:border-t-0 lg:max-w-lg">
            <AddCoralReefModal
              onClose={closeModal}
              onSave={handleSave}
              mode={editingRecord ? "edit" : "add"}
              initialValues={editingRecord}
              existingPhotoUrls={
                Array.isArray(editingRecord?.photos) && editingRecord.photos.length > 0
                  ? editingRecord.photos
                  : typeof editingRecord?.photo === "string" && editingRecord.photo
                    ? [editingRecord.photo]
                    : []
              }
              latitude={pickLat}
              longitude={pickLng}
              onLatitudeChange={setPickLat}
              onLongitudeChange={setPickLng}
              areaCoordinates={pickAreaCoordinates}
              areaPointCount={pickAreaCoordinates.length}
              onClearArea={handleClearArea}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 sm:mt-8">
            <CoralReefMap records={records} />
          </div>

          {records.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] sm:mt-8">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30 text-xs font-semibold uppercase tracking-wide text-white/55">
                    <th className="px-3 py-3 sm:px-4">Photo</th>
                    <th className="px-3 py-3 sm:px-4">Coral name</th>
                    <th className="px-3 py-3 sm:px-4">Coral type</th>
                    <th className="px-3 py-3 sm:px-4">Reef structure</th>
                    <th className="px-3 py-3 sm:px-4">Description</th>
                    <th className="px-3 py-3 sm:px-4">Status</th>
                    <th className="px-3 py-3 sm:px-4">Location</th>
                    <th className="px-3 py-3 sm:px-4">Area</th>
                    <th className="px-3 py-3 text-right sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const photos =
                      Array.isArray(record.photos) && record.photos.length > 0
                        ? record.photos
                        : typeof record.photo === "string" && record.photo
                          ? [record.photo]
                          : [];
                    const firstPhoto = photos[0] || "";
                    const hasCoordinates =
                      record.location?.latitude != null &&
                      record.location?.longitude != null;
                    return (
                      <tr
                        key={record.id}
                        className="border-b border-white/[0.06] transition hover:bg-white/[0.04]"
                      >
                        <td className="px-3 py-2.5 align-middle sm:px-4">
                          {firstPhoto ? (
                            <div className="relative inline-block">
                              <img
                                src={firstPhoto}
                                alt=""
                                className="h-11 w-14 rounded-lg object-cover ring-1 ring-white/10"
                                loading="lazy"
                              />
                              {photos.length > 1 ? (
                                <span className="absolute -right-1.5 -top-1.5 rounded-full border border-white/10 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/85">
                                  +{photos.length - 1}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="flex h-11 w-14 items-center justify-center rounded-lg bg-white/5 text-[10px] text-white/35">
                              -
                            </div>
                          )}
                        </td>
                        <td className="max-w-[180px] px-3 py-2.5 align-middle font-medium text-white sm:px-4">
                          <span className="line-clamp-2">{record.coralName}</span>
                        </td>
                        <td className="max-w-[150px] px-3 py-2.5 align-middle text-white/80 sm:px-4">
                          <span className="line-clamp-2">{record.coralType}</span>
                        </td>
                        <td className="max-w-[140px] px-3 py-2.5 align-middle text-white/80 sm:px-4">
                          <span className="line-clamp-2">
                            {record.reefStructure || "CNU"}
                          </span>
                        </td>
                        <td className="max-w-[220px] px-3 py-2.5 align-middle text-white/65 sm:px-4">
                          <span className="line-clamp-2">{record.description || "-"}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle text-white/90 sm:px-4">
                          {record.coralStatus}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle text-xs text-white/75 sm:px-4">
                          {hasCoordinates
                            ? `${Number(record.location.latitude).toFixed(6)}, ${Number(
                                record.location.longitude
                              ).toFixed(6)}`
                            : "No coordinates"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle text-xs text-white/75 sm:px-4">
                          {Array.isArray(record.areaCoordinates) &&
                          record.areaCoordinates.length >= 3
                            ? `${record.areaCoordinates.length} points`
                            : "No drawn area"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle sm:px-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(record)}
                            className="mr-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 sm:px-3.5 sm:py-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === record.id}
                            onClick={() => handleDelete(record)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100/95 transition hover:bg-rose-500/20 disabled:opacity-50 sm:px-3.5 sm:py-2"
                          >
                            {deletingId === record.id ? "..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-white/60">
              No coral reef records yet. Click{" "}
              <span className="text-white/80">Add coral reef</span> to create your first
              entry.
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default CoralReefMapping;

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CORAL_STATUSES = ["Healthy", "Bleached Damaged", "Recovering", "Dead"];
const REEF_STRUCTURES = ["CNU", "Reefblocks"];
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_PHOTOS = 3;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#0054A6] transition placeholder:text-white/35 focus:border-[#0054A6]/50 focus:ring-2";

const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

const AddCoralReefModal = ({
  onClose,
  onSave,
  mode = "add",
  initialValues = null,
  existingPhotoUrls = [],
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  areaCoordinates = [],
  areaPointCount = 0,
  onClearArea,
}) => {
  const [coralName, setCoralName] = useState("");
  const [coralType, setCoralType] = useState("");
  const [reefStructure, setReefStructure] = useState("CNU");
  const [description, setDescription] = useState("");
  const [coralStatus, setCoralStatus] = useState("Healthy");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [keptExistingPhotoUrls, setKeptExistingPhotoUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      setCoralName(initialValues.coralName ?? "");
      setCoralType(initialValues.coralType ?? "");
      setReefStructure(initialValues.reefStructure ?? "CNU");
      setDescription(initialValues.description ?? "");
      setCoralStatus(initialValues.coralStatus ?? "Healthy");
      setPhotoFiles([]);
      setKeptExistingPhotoUrls(
        Array.isArray(existingPhotoUrls) ? existingPhotoUrls.slice(0, MAX_PHOTOS) : []
      );
      return;
    }
    if (mode === "add") {
      setCoralName("");
      setCoralType("");
      setReefStructure("CNU");
      setDescription("");
      setCoralStatus("Healthy");
      setPhotoFiles([]);
      setKeptExistingPhotoUrls([]);
    }
  }, [existingPhotoUrls, initialValues, mode]);

  const previewUrls = useMemo(() => photoFiles.map((f) => URL.createObjectURL(f)), [photoFiles]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const resetForm = () => {
    if (mode === "edit" && initialValues) {
      setCoralName(initialValues.coralName ?? "");
      setCoralType(initialValues.coralType ?? "");
      setReefStructure(initialValues.reefStructure ?? "CNU");
      setDescription(initialValues.description ?? "");
      setCoralStatus(initialValues.coralStatus ?? "Healthy");
      onLatitudeChange(
        initialValues.location?.latitude != null
          ? String(Number(initialValues.location.latitude).toFixed(6))
          : ""
      );
      onLongitudeChange(
        initialValues.location?.longitude != null
          ? String(Number(initialValues.location.longitude).toFixed(6))
          : ""
      );
      if (onClearArea) onClearArea();
      setPhotoFiles([]);
      setKeptExistingPhotoUrls(
        Array.isArray(existingPhotoUrls) ? existingPhotoUrls.slice(0, MAX_PHOTOS) : []
      );
      return;
    }
    setCoralName("");
    setCoralType("");
    setReefStructure("CNU");
    setDescription("");
    setCoralStatus("Healthy");
    onLatitudeChange("");
    onLongitudeChange("");
    if (onClearArea) onClearArea();
    setPhotoFiles([]);
    setKeptExistingPhotoUrls([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const latStr = String(latitude || "").trim();
      const lngStr = String(longitude || "").trim();
      const lat =
        latStr === "" ? null : Number.parseFloat(latStr.replace(",", "."));
      const lng =
        lngStr === "" ? null : Number.parseFloat(lngStr.replace(",", "."));

      if ((latStr !== "" && Number.isNaN(lat)) || (lngStr !== "" && Number.isNaN(lng))) {
        toast.error("Latitude and longitude must be valid numbers.");
        return;
      }
      if ((latStr !== "" && lngStr === "") || (latStr === "" && lngStr !== "")) {
        toast.error("Provide both latitude and longitude, or leave both empty.");
        return;
      }
      if (areaCoordinates.length > 0 && areaCoordinates.length < 3) {
        toast.error("Drawn area must have at least 3 points.");
        return;
      }

      await onSave({
        coralName,
        coralType,
        reefStructure,
        description,
        coralStatus,
        location: {
          latitude: lat,
          longitude: lng,
        },
        areaCoordinates,
        photoFiles,
        keptPhotoUrls: mode === "edit" ? keptExistingPhotoUrls : undefined,
      });

      toast.success(mode === "edit" ? "Coral reef entry updated." : "Coral reef entry added.");
      if (mode !== "edit") resetForm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save coral reef entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-950/98">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            {mode === "edit" ? "Edit coral reef record" : "Add coral reef record"}
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            {mode === "edit"
              ? "Update coral details, status, photo, and mapped area."
              : "Save coral details, status, photo, and map coordinates."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-5 pb-4">
          <div>
            <label className={labelClass} htmlFor="coral-name">
              Coral name
            </label>
            <input
              id="coral-name"
              required
              value={coralName}
              onChange={(e) => setCoralName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Acropora millepora"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-type">
              Coral type
            </label>
            <input
              id="coral-type"
              required
              value={coralType}
              onChange={(e) => setCoralType(e.target.value)}
              className={inputClass}
              placeholder="e.g. Branching coral"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="reef-structure">
              Reef structure
            </label>
            <select
              id="reef-structure"
              value={reefStructure}
              onChange={(e) => setReefStructure(e.target.value)}
              className={inputClass}
            >
              {REEF_STRUCTURES.map((structure) => (
                <option key={structure} value={structure} className="bg-slate-900">
                  {structure}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-description">
              Description
            </label>
            <textarea
              id="coral-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-y min-h-[100px]`}
              placeholder="Short notes about this reef area"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-status">
              Coral status
            </label>
            <select
              id="coral-status"
              value={coralStatus}
              onChange={(e) => setCoralStatus(e.target.value)}
              className={inputClass}
            >
              {CORAL_STATUSES.map((status) => (
                <option key={status} value={status} className="bg-slate-900">
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-photo">
              Coral photos <span className="font-normal text-white/45">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-white/45">
              JPEG, PNG, WebP, or GIF. Max {Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB each. Up to {MAX_PHOTOS} photos.
            </p>
            {mode === "edit" && keptExistingPhotoUrls.length > 0 ? (
              <div className="mb-3">
                <div className="flex items-center justify-between gap-2 text-xs text-white/70">
                  <span>
                    Existing photos:{" "}
                    <span className="font-semibold text-white/90">
                      {keptExistingPhotoUrls.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setKeptExistingPhotoUrls([])}
                    disabled={submitting}
                    className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Remove all existing
                  </button>
                </div>
              </div>
            ) : null}
            <input
              id="coral-photo"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0054A6]/30 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0054A6]/45"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                e.target.value = "";
                if (picked.length === 0) return;
                const next = [];
                for (const file of picked) {
                  if (file.size > MAX_IMAGE_BYTES) {
                    toast.error(
                      `Each image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`
                    );
                    return;
                  }
                  next.push(file);
                }
                setPhotoFiles((prev) => {
                  const allowedSlots = Math.max(
                    0,
                    MAX_PHOTOS - (mode === "edit" ? keptExistingPhotoUrls.length : 0)
                  );
                  const merged = [...prev, ...next].slice(0, allowedSlots);
                  if (prev.length + next.length > allowedSlots) {
                    toast.error(`You can upload up to ${MAX_PHOTOS} photos only.`);
                  }
                  return merged;
                });
              }}
            />
            {previewUrls.length > 0 ? (
              <div className="mt-3 grid w-full grid-cols-3 gap-2">
                {previewUrls.map((url, idx) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                  >
                    <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute right-1.5 top-1.5 rounded-md border border-white/15 bg-black/60 px-2 py-1 text-[11px] font-semibold text-white/85 hover:bg-black/75"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : mode === "edit" &&
              Array.isArray(keptExistingPhotoUrls) &&
              keptExistingPhotoUrls.length > 0 ? (
              <div className="mt-3 grid w-full grid-cols-3 gap-2">
                {keptExistingPhotoUrls.slice(0, MAX_PHOTOS).map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                  >
                    <img
                      src={url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setKeptExistingPhotoUrls((prev) => prev.filter((p) => p !== url))
                      }
                      disabled={submitting}
                      className="absolute right-1.5 top-1.5 rounded-md border border-white/15 bg-black/60 px-2 py-1 text-[11px] font-semibold text-white/85 hover:bg-black/75 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Location</p>
            <p className="mb-3 text-xs text-white/45">
              Click the map on the left to drop a pin, or type coordinates.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="coral-latitude">
                  Latitude
                </label>
                <input
                  id="coral-latitude"
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => onLatitudeChange(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 13.4769"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="coral-longitude">
                  Longitude
                </label>
                <input
                  id="coral-longitude"
                  type="text"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => onLongitudeChange(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 122.0837"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
              <span>
                Drawn area points: <span className="font-semibold text-white/90">{areaPointCount}</span>
              </span>
              <button
                type="button"
                onClick={onClearArea}
                disabled={submitting || areaPointCount === 0}
                className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
              >
                Clear drawn area
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : mode === "edit" ? "Update record" : "Save record"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-60"
          >
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCoralReefModal;

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { compressImages } from "../../../utils/compressImage";

const PROGRAM_TYPES = ["GIA", "CEST", "SSCP", "SETUP"];

const MAX_PROJECT_IMAGES = 12;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const PROJECT_STATUSES = ["Ongoing", "Graduated", "Terminated"];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#0054A6] transition placeholder:text-white/35 focus:border-[#0054A6]/50 focus:ring-2";

const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

const formatAmountInput = (value) => {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const [intRaw, ...decimalParts] = cleaned.split(".");
  const intPart = intRaw.replace(/^0+(?=\d)/, "") || "0";
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalParts.length === 0) return withCommas;
  return `${withCommas}.${decimalParts.join("")}`;
};

/**
 * Form panel for adding a project. Location lat/lng are controlled by the parent
 * so the AdminPrograms map can update them when the user clicks the map.
 */
const ProgramsModals = ({
  onClose,
  onSave,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
  onUseCurrentLocation,
  locating = false,
  editingProject = null,
}) => {
  const [programType, setProgramType] = useState("");
  const [title, setTitle] = useState("");
  const [amountOfAssistance, setAmountOfAssistance] = useState("");
  const [counterpartName, setCounterpartName] = useState("");
  const [counterpartAmount, setCounterpartAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [projectStatus, setProjectStatus] = useState("Ongoing");
  const [imageFiles, setImageFiles] = useState([]);
  /** Existing image URLs kept on update (edit mode). */
  const [keptImageUrls, setKeptImageUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const previewUrls = useMemo(
    () => imageFiles.map((f) => URL.createObjectURL(f)),
    [imageFiles]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  const resetForm = () => {
    setProgramType("");
    setTitle("");
    setAmountOfAssistance("");
    setCounterpartName("");
    setCounterpartAmount("");
    setBeneficiary("");
    setContactPerson("");
    setBriefDescription("");
    setDescription("");
    setAddress("");
    setImageFiles([]);
    setKeptImageUrls([]);
    onLatitudeChange("");
    onLongitudeChange("");
  };

  const resetFromEditing = () => {
    if (!editingProject) {
      resetForm();
      return;
    }
    setProgramType(editingProject.programType || "");
    setTitle(editingProject.title || "");
    setAmountOfAssistance(formatAmountInput(editingProject.amountOfAssistance || ""));
    setCounterpartName(editingProject.counterpartName || "");
    setCounterpartAmount(formatAmountInput(editingProject.counterpartAmount || ""));
    setBeneficiary(editingProject.beneficiary || "");
    setContactPerson(editingProject.contactPerson || "");
    setBriefDescription(editingProject.briefDescription || "");
    setDescription(editingProject.description || "");
    setAddress(editingProject.address || "");
    setProjectStatus(editingProject.projectStatus || "Ongoing");
    const lat = editingProject.location?.latitude;
    const lng = editingProject.location?.longitude;
    onLatitudeChange(lat != null ? String(lat) : "");
    onLongitudeChange(lng != null ? String(lng) : "");
    setKeptImageUrls(
      Array.isArray(editingProject.images) ? [...editingProject.images] : [],
    );
    setImageFiles([]);
  };

  useEffect(() => {
    if (!editingProject) return;
    setProgramType(editingProject.programType || "");
    setTitle(editingProject.title || "");
    setAmountOfAssistance(formatAmountInput(editingProject.amountOfAssistance || ""));
    setCounterpartName(editingProject.counterpartName || "");
    setCounterpartAmount(formatAmountInput(editingProject.counterpartAmount || ""));
    setBeneficiary(editingProject.beneficiary || "");
    setContactPerson(editingProject.contactPerson || "");
    setBriefDescription(editingProject.briefDescription || "");
    setDescription(editingProject.description || "");
    setAddress(editingProject.address || "");
    setProjectStatus(editingProject.projectStatus || "Ongoing");
    const lat = editingProject.location?.latitude;
    const lng = editingProject.location?.longitude;
    onLatitudeChange(lat != null ? String(lat) : "");
    onLongitudeChange(lng != null ? String(lng) : "");
    setKeptImageUrls(
      Array.isArray(editingProject.images) ? [...editingProject.images] : [],
    );
    setImageFiles([]);
  }, [editingProject]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      toast.error("Please select a program type (GIA, CEST, SSCP, or SETUP).");
      return;
    }
    setSubmitting(true);
    try {
      const latStr = String(latitude ?? "").trim();
      const lngStr = String(longitude ?? "").trim();
      const lat =
        latStr === "" ? null : Number.parseFloat(latStr.replace(",", "."));
      const lng =
        lngStr === "" ? null : Number.parseFloat(lngStr.replace(",", "."));

      if (
        (latStr !== "" && Number.isNaN(lat)) ||
        (lngStr !== "" && Number.isNaN(lng))
      ) {
        toast.error("Latitude and longitude must be valid numbers.");
        return;
      }
      if (
        (latStr !== "" && lngStr === "") ||
        (latStr === "" && lngStr !== "")
      ) {
        toast.error("Provide both latitude and longitude, or leave both empty.");
        return;
      }

      const payload = {
        programType,
        title,
        amountOfAssistance,
        counterpartName,
        counterpartAmount,
        beneficiary,
        contactPerson,
        briefDescription,
        description,
        address,
        projectStatus,
        location: {
          latitude: lat,
          longitude: lng,
        },
        imageFiles,
      };
      if (editingProject) {
        payload.editingId = editingProject.id;
        payload.keptImageUrls = keptImageUrls;
      }
      await onSave(payload);
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Could not save project. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-950/98">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2
            id="programs-modal-title"
            className="text-lg font-semibold text-white sm:text-xl"
          >
            {editingProject ? "Edit DOST project" : "Add DOST project"}
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            {editingProject
              ? "Update details or photos. Map click still sets the pin."
              : "Click the map to set the pin, or type coordinates. Saved projects appear on the Programs page map."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6"
      >
        <div className="space-y-6 pb-4">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
              Program type
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROGRAM_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:px-4 sm:py-3 ${
                    programType === type
                      ? "border-[#0054A6]/70 bg-[#0054A6]/20 text-white shadow-[0_0_0_1px_rgba(0,84,166,.4)_inset]"
                      : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="programType"
                    value={type}
                    checked={programType === type}
                    onChange={() => {
                      setProgramType(type);
                      // clear counterpart if switching to a non-counterpart program
                      if (type !== "CEST" && type !== "SSCP") {
                        setCounterpartName("");
                        setCounterpartAmount("");
                      }
                    }}
                    className="sr-only"
                  />
                  {type}
                </label>
              ))}
            </div>
          </section>

          {programType ? (
            <>
              <div>
                <label htmlFor="modal-project-title" className={labelClass}>
                  Title
                </label>
                <input
                  id="modal-project-title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Project title"
                />
              </div>

              {/* ── Funding section ── */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Funding
                </h3>

                <div>
                  <label htmlFor="modal-amount-assistance" className={labelClass}>
                    DOST-MIMAROPA amount of assistance
                  </label>
                  <input
                    id="modal-amount-assistance"
                    name="amountOfAssistance"
                    type="text"
                    inputMode="decimal"
                    value={amountOfAssistance}
                    onChange={(e) =>
                      setAmountOfAssistance(formatAmountInput(e.target.value))
                    }
                    className={inputClass}
                    placeholder="e.g. 500,000"
                  />
                </div>

                {(programType === "CEST" || programType === "SSCP") && (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-white/55">Counterpart</p>
                  <div>
                    <label htmlFor="modal-counterpart-name" className={labelClass}>
                      Counterpart provider
                    </label>
                    <input
                      id="modal-counterpart-name"
                      name="counterpartName"
                      type="text"
                      value={counterpartName}
                      onChange={(e) => setCounterpartName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Sangguniang Barangay of Yook"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-counterpart-amount" className={labelClass}>
                      Counterpart amount
                    </label>
                    <input
                      id="modal-counterpart-amount"
                      name="counterpartAmount"
                      type="text"
                      inputMode="decimal"
                      value={counterpartAmount}
                      onChange={(e) =>
                        setCounterpartAmount(formatAmountInput(e.target.value))
                      }
                      className={inputClass}
                      placeholder="e.g. 150,000"
                    />
                  </div>
                </div>
                )}
              </div>

              <div>
                <label htmlFor="modal-beneficiary" className={labelClass}>
                  Beneficiary
                </label>
                <input
                  id="modal-beneficiary"
                  name="beneficiary"
                  type="text"
                  required
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className={inputClass}
                  placeholder="Name of beneficiary or organization"
                />
              </div>

              <div>
                <label htmlFor="modal-contact-person" className={labelClass}>
                  Contact person
                </label>
                <input
                  id="modal-contact-person"
                  name="contactPerson"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className={inputClass}
                  placeholder="Name and role if applicable"
                />
              </div>

              <div>
                <label htmlFor="modal-address" className={labelClass}>
                  Address
                </label>
                <input
                  id="modal-address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Barangay Malbog, Buenavista, Marinduque"
                />
              </div>

              <div>
                <label htmlFor="modal-brief-description" className={labelClass}>
                  Brief description
                </label>
                <textarea
                  id="modal-brief-description"
                  name="briefDescription"
                  rows={4}
                  value={briefDescription}
                  onChange={(e) => setBriefDescription(e.target.value)}
                  className={`${inputClass} resize-y min-h-[100px]`}
                  placeholder="Short summary of the project"
                />
              </div>

              <div>
                <label htmlFor="modal-description" className={labelClass}>
                  Description{" "}
                  <span className="font-normal text-white/45">(detailed)</span>
                </label>
                <textarea
                  id="modal-description"
                  name="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} resize-y min-h-[140px]`}
                  placeholder="Full project description — shown on the public Programs page"
                />
              </div>

              <div>
                <label htmlFor="modal-project-images" className={labelClass}>
                  Project photos{" "}
                  <span className="font-normal text-white/45">(optional)</span>
                </label>
                <p className="mb-2 text-xs text-white/45">
                  Up to {MAX_PROJECT_IMAGES} images (JPEG, PNG, WebP), max{" "}
                  {Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB each.
                  Images are automatically compressed to ≤ 800 KB before upload.
                </p>
                {keptImageUrls.length > 0 ? (
                  <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {keptImageUrls.map((url, idx) => (
                      <li
                        key={url}
                        className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                      >
                        <img
                          src={url}
                          alt=""
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setKeptImageUrls((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute right-1 top-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-black/90"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <input
                  id="modal-project-images"
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0054A6]/30 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0054A6]/45"
                  onChange={async (e) => {
                    const picked = Array.from(e.target.files || []);
                    e.target.value = "";
                    const oversized = picked.filter((f) => f.size > MAX_IMAGE_BYTES);
                    if (oversized.length > 0) {
                      toast.error(
                        `Each image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`
                      );
                      return;
                    }
                    // Compress before storing — converts MB → KB
                    const compressed = await compressImages(picked);
                    const cap = MAX_PROJECT_IMAGES - keptImageUrls.length;
                    setImageFiles((prev) => {
                      const next = [...prev, ...compressed].slice(0, cap);
                      if (prev.length + compressed.length > cap) {
                        toast.error(
                          `Max ${MAX_PROJECT_IMAGES} images total (including saved photos).`
                        );
                      }
                      return next;
                    });
                  }}
                />
                {imageFiles.length > 0 ? (
                  <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {imageFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${file.size}-${idx}`}
                        className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                      >
                        <img
                          src={previewUrls[idx]}
                          alt=""
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImageFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute right-1 top-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-black/90"
                        >
                          Remove
                        </button>
                        <div className="truncate px-1.5 py-1 text-[10px] text-white/50">
                          {file.name}{" "}
                          <span className="text-emerald-300/80">
                            {file.size < 1024 * 1024
                              ? `${Math.round(file.size / 1024)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div>
                <label htmlFor="modal-project-status" className={labelClass}>
                  Project status
                </label>
                <select
                  id="modal-project-status"
                  name="projectStatus"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className={inputClass}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={labelClass}>Location</p>
                <p className="mb-3 text-xs text-white/45">
                  Click the map on the left (or above on small screens) to drop a
                  pin. You can fine-tune values here.
                </p>
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={locating}
                  className="mb-3 rounded-lg border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locating ? "Getting current location..." : "Use current location"}
                </button>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="modal-latitude"
                      className="mb-1.5 block text-xs font-medium text-white/60"
                    >
                      Latitude
                    </label>
                    <input
                      id="modal-latitude"
                      name="latitude"
                      type="text"
                      inputMode="decimal"
                      value={latitude}
                      onChange={(e) => onLatitudeChange(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 13.4769"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="modal-longitude"
                      className="mb-1.5 block text-xs font-medium text-white/60"
                    >
                      Longitude
                    </label>
                    <input
                      id="modal-longitude"
                      name="longitude"
                      type="text"
                      inputMode="decimal"
                      value={longitude}
                      onChange={(e) => onLongitudeChange(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 122.0837"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/45">
              Select a program type to continue.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={submitting || !programType}
            className="rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : editingProject
                ? "Update project"
                : "Save project"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (editingProject) resetFromEditing();
              else resetForm();
            }}
            className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgramsModals;

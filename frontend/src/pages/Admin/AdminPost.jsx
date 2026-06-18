import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

import DeleteHighlightModal from "../../Components/Modals/AdminModals/DeleteHighlightModal";
import PostModal from "../../Components/Modals/AdminModals/PostModal";
import {
  deleteAnnouncement,
  fetchAnnouncements,
} from "../../api/announcementsApi";
import { getApiErrorMessage } from "../../api/client";

const AdminPost = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const list = await fetchAnnouncements();
      setAnnouncements(Array.isArray(list) ? list : []);
      setLoadError(null);
    } catch (err) {
      const msg = getApiErrorMessage(
        err,
        "Could not load announcements from the server."
      );
      setLoadError(msg);
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSaved = (saved) => {
    setAnnouncements((prev) => {
      const id = saved?.id;
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  };

  const closeDeleteModal = () => {
    if (deleteConfirming) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteConfirming(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success("Announcement deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not delete announcement.")
      );
    } finally {
      setDeleteConfirming(false);
    }
  };

  const formatWhen = (iso) => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "MMM d, yyyy h:mm a");
    } catch {
      return "—";
    }
  };

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Highlight posts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            The <strong className="font-medium text-white/75">newest</strong> post is what
            visitors see in Today&apos;s highlight on the home page. Images use Supabase;
            everything else is in MongoDB.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="w-full shrink-0 rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 sm:w-auto"
        >
          Add highlight
        </button>
      </div>

      {loadError ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {loadError}
        </p>
      ) : null}

      <div className="mt-6 sm:mt-8">
        {announcements.length === 0 && !loadError ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/50">
            No announcements yet. Click <span className="text-white/70">Add highlight</span> to
            create one.
          </p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((row, index) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
              >
                <div className="min-w-0 flex gap-3">
                  {row.images?.[0]?.url ? (
                    <img
                      src={row.images[0].url}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-lg object-cover sm:h-14 sm:w-20"
                    />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-[10px] text-white/40 sm:h-14 sm:w-20">
                      No img
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-white sm:truncate sm:text-base">
                        {row.title}
                      </p>
                      {row.facebookPostUrl ? (
                        <span className="shrink-0 rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200/90">
                          FB link
                        </span>
                      ) : null}
                      {index === 0 ? (
                        <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">
                          On homepage
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-white/45 sm:text-xs">
                      Updated {formatWhen(row.updatedAt || row.createdAt)} ·{" "}
                      {(row.images || []).length} image
                      {(row.images || []).length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 sm:flex-none"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="flex-1 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200/95 transition hover:bg-rose-500/20 sm:flex-none"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <PostModal
            onClose={closeModal}
            onSaved={handleSaved}
            editingAnnouncement={editing}
          />
        </div>
      ) : null}

      <DeleteHighlightModal
        open={Boolean(deleteTarget)}
        highlightTitle={deleteTarget?.title}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
        confirming={deleteConfirming}
      />
    </div>
  );
};

export default AdminPost;

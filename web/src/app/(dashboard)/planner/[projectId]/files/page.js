"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import { Upload, Trash2, FileText, Image, Film, File, FolderOpen, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

const FOLDERS = ["general", "contracts", "venue", "vendors", "design", "media"];

function fileIcon(mime) {
  if (!mime) return File;
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("video/")) return Film;
  if (mime.includes("pdf") || mime.includes("document")) return FileText;
  return File;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function UploadModal({ projectId, folder, onClose }) {
  const { uploadFile } = usePlannerStore();
  const [form, setForm] = useState({ file_name: "", file_url: "", mime_type: "", file_size: "", tags: "", is_public: false });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.file_name.trim() || !form.file_url.trim()) return;
    setSaving(true);
    const tagArr = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const res = await uploadFile(projectId, {
      folder,
      file_name: form.file_name,
      file_url: form.file_url,
      mime_type: form.mime_type || "application/octet-stream",
      file_size: form.file_size ? parseInt(form.file_size) : null,
      tags: tagArr,
      is_public: form.is_public,
    });
    setSaving(false);
    if (res.success) { toast.success("File added"); onClose(); }
    else toast.error(res.error || "Failed to add file");
  }

  const input = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111127] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Add File Reference</p>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-500">Paste a URL to a file stored in your cloud storage or CDN.</p>
        <input className={input} placeholder="File Name *" value={form.file_name} onChange={e => setForm(p => ({ ...p, file_name: e.target.value }))} />
        <input className={input} placeholder="File URL *" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className={input} placeholder="MIME type" value={form.mime_type} onChange={e => setForm(p => ({ ...p, mime_type: e.target.value }))} />
          <input className={input} placeholder="Size (bytes)" type="number" value={form.file_size} onChange={e => setForm(p => ({ ...p, file_size: e.target.value }))} />
        </div>
        <input className={input} placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.is_public} onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))} className="accent-indigo-500" />
          Public file
        </label>
        <button onClick={submit} disabled={saving || !form.file_name.trim() || !form.file_url.trim()} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add File"}
        </button>
      </div>
    </div>
  );
}

export default function FilesPage() {
  const { projectId } = useParams();
  const { files, loading, fetchFiles, deleteFile } = usePlannerStore();
  const [activeFolder, setActiveFolder] = useState("general");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchFiles(projectId);
  }, [projectId]);

  async function handleDelete(fileId) {
    const res = await deleteFile(projectId, fileId);
    if (!res.success) toast.error("Failed to delete file");
    else toast.success("File removed");
  }

  const folderFiles = files.filter(f => f.folder === activeFolder);
  const totalByFolder = FOLDERS.reduce((acc, f) => {
    acc[f] = files.filter(fi => fi.folder === f).length;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col sm:flex-row">
      {/* Mobile: horizontal tab bar */}
      <div className="sm:hidden flex overflow-x-auto border-b border-white/8 px-3 py-2 gap-2 bg-[#0b0b18] shrink-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {FOLDERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-xs font-semibold transition-all ${
              activeFolder === f ? "bg-indigo-600 text-white" : "bg-white/6 text-gray-400 border border-white/8"
            }`}
          >
            <FolderOpen className="w-3 h-3" />
            <span className="capitalize">{f}</span>
            {totalByFolder[f] > 0 && (
              <span className={`text-[10px] font-bold ${activeFolder === f ? "text-indigo-200" : "text-gray-500"}`}>
                {totalByFolder[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden sm:flex w-48 shrink-0 border-r border-white/8 p-3 flex-col space-y-1">
        <p className="text-[11px] font-bold text-gray-500 uppercase px-2 mb-3">Folders</p>
        {FOLDERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFolder === f ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/6"
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="capitalize">{f}</span>
            </div>
            {totalByFolder[f] > 0 && (
              <span className={`text-[10px] font-bold ${activeFolder === f ? "text-indigo-200" : "text-gray-500"}`}>
                {totalByFolder[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* File grid */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-bold text-white capitalize">{activeFolder}</p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            <Upload className="w-3.5 h-3.5" /> Add File
          </button>
        </div>

        {loading && files.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {!loading && folderFiles.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No files in this folder</p>
            <button onClick={() => setShowUpload(true)} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm">+ Add File</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {folderFiles.map(file => {
            const Icon = fileIcon(file.mime_type);
            const isImage = file.mime_type?.startsWith("image/");
            return (
              <div key={file.id} className="group bg-[#111127] border border-white/8 rounded-xl overflow-hidden hover:border-white/16 active:border-white/20 transition-all">
                {/* Preview */}
                <div className="aspect-square flex items-center justify-center bg-white/3 relative">
                  {isImage ? (
                    <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-8 h-8 text-gray-600" />
                  )}
                  {/* Hover overlay (desktop) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center gap-2 transition-opacity">
                    <a href={file.file_url} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white active:scale-90 transition-all">
                      <Upload className="w-3.5 h-3.5 rotate-180" />
                    </a>
                    <button onClick={() => handleDelete(file.id)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 active:scale-90 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-xs font-medium text-white truncate flex-1">{file.file_name}</p>
                    {/* Mobile actions — always visible */}
                    <div className="flex items-center gap-0.5 sm:hidden shrink-0">
                      <a href={file.file_url} target="_blank" rel="noreferrer"
                        className="p-1 rounded text-gray-500 hover:text-white active:scale-90 transition-all">
                        <Upload className="w-3 h-3 rotate-180" />
                      </a>
                      <button onClick={() => handleDelete(file.id)}
                        className="p-1 rounded text-gray-500 hover:text-red-400 active:scale-90 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {file.file_size && <span className="text-[10px] text-gray-500">{formatBytes(file.file_size)}</span>}
                    {file.is_public && <span className="text-[9px] text-emerald-400 font-bold">PUBLIC</span>}
                  </div>
                  {file.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {file.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[8px] px-1 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showUpload && <UploadModal projectId={projectId} folder={activeFolder} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

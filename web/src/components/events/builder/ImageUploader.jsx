"use client";

import { useRef, useState } from "react";
import { XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { api } from "@/lib/api";

export default function ImageUploader({ eventId, value, onChange, label = "Image" }) {
  const inputRef  = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/upload-image/events/${eventId}/builder/upload-image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.cloudinary?.secure_url ?? res.data?.data?.media?.file_url;
      if (!url) throw new Error("No URL returned");
      onChange(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleUrlKeyDown = (e) => {
    if (e.key === "Enter") onChange(e.target.value.trim());
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#555a66" }}
        >
          {label}
        </span>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-md" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded"
            className="h-32 w-full object-cover"
          />
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            title="Remove image"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md py-6 transition-colors"
          style={{
            border: "1px dashed rgba(255,255,255,0.12)",
            background: uploading ? "rgba(99,102,241,0.06)" : "transparent",
          }}
        >
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          ) : (
            <ArrowUpTrayIcon className="h-5 w-5" style={{ color: "#555a66" }} />
          )}
          <span className="text-[11px]" style={{ color: "#555a66" }}>
            {uploading ? "Uploading…" : "Click or drag to upload"}
          </span>
        </div>
      )}

      {/* URL fallback input */}
      {!value && !uploading && (
        <input
          type="url"
          placeholder="Or paste an image URL…"
          onBlur={(e) => { if (e.target.value.trim()) onChange(e.target.value.trim()); }}
          onKeyDown={handleUrlKeyDown}
          className="w-full rounded-md px-3 py-2 text-[11px] outline-none"
          style={{
            background: "#1e2026",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#8b8f9a",
          }}
        />
      )}

      {error && (
        <span className="text-[11px] text-red-400">{error}</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { usePlannerStore } from "@/store/planner.store";
import { Plus, Pin, PinOff, Trash2, Loader2, FileText, Tag, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotesPage() {
  const { projectId } = useParams();
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote } = usePlannerStore();
  const [selected, setSelected] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // "list" | "editor"
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorTags, setEditorTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    fetchNotes(projectId);
  }, [projectId]);

  useEffect(() => {
    if (selected) {
      setEditorTitle(selected.title || "");
      setEditorContent(selected.content || "");
      setEditorTags((selected.tags || []).join(", "));
    }
  }, [selected?.id]);

  function scheduleAutoSave(title, content, tags) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (selected) {
        const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);
        updateNote(projectId, selected.id, { title, content, tags: tagArr });
      }
    }, 800);
  }

  function onTitleChange(v) {
    setEditorTitle(v);
    scheduleAutoSave(v, editorContent, editorTags);
  }

  function onContentChange(v) {
    setEditorContent(v);
    scheduleAutoSave(editorTitle, v, editorTags);
  }

  function onTagsChange(v) {
    setEditorTags(v);
    scheduleAutoSave(editorTitle, editorContent, v);
  }

  async function handleNew() {
    setSaving(true);
    const res = await createNote(projectId, { title: "Untitled Note", content: "" });
    setSaving(false);
    if (res.success) {
      setSelected(res.data);
    } else {
      toast.error("Failed to create note");
    }
  }

  async function handleDelete(noteId) {
    const res = await deleteNote(projectId, noteId);
    if (res.success) {
      if (selected?.id === noteId) setSelected(null);
      toast.success("Note deleted");
    } else {
      toast.error("Failed to delete note");
    }
  }

  async function togglePin(note) {
    await updateNote(projectId, note.id, { is_pinned: !note.is_pinned });
  }

  const pinned = notes.filter(n => n.is_pinned);
  const unpinned = notes.filter(n => !n.is_pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="flex h-full">
      {/* Notes list — full-width on mobile when no editor, fixed width on sm+ */}
      <div className={`
        border-r border-white/8 flex flex-col
        w-full sm:w-72 sm:shrink-0
        ${mobileView === "editor" ? "hidden sm:flex" : "flex"}
      `}>
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <p className="text-sm font-bold text-white">Notes</p>
          <button
            onClick={handleNew}
            disabled={saving}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-90"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && notes.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="text-center py-12 px-4">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notes yet.</p>
              <button onClick={handleNew} className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm">Create one →</button>
            </div>
          )}

          {sorted.map(note => (
            <div
              key={note.id}
              onClick={() => { setSelected(note); setMobileView("editor"); }}
              className={`group relative px-4 py-3 border-b border-white/5 cursor-pointer transition-colors active:bg-white/4 ${
                selected?.id === note.id ? "bg-indigo-600/10 border-l-2 border-l-indigo-500" : "hover:bg-white/3"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {note.is_pinned && <Pin className="w-2.5 h-2.5 text-amber-400" />}
                    <p className="text-sm font-semibold text-white truncate">{note.title || "Untitled"}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{note.content || "No content"}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{timeAgo(note.updated_at)}</p>
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {note.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-opacity shrink-0">
                  <button onClick={e => { e.stopPropagation(); togglePin(note); }} className="p-1.5 rounded text-gray-500 hover:text-amber-400 active:scale-90 transition-all">
                    {note.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(note.id); }} className="p-1.5 rounded text-gray-500 hover:text-red-400 active:scale-90 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor — hidden on mobile when list view is active */}
      <div className={`flex-1 flex-col ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
        {/* Mobile back button */}
        <button
          onClick={() => setMobileView("list")}
          className="sm:hidden flex items-center gap-1.5 px-4 py-3 border-b border-white/8 text-xs font-semibold text-gray-400 hover:text-white transition-all active:opacity-60"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All Notes
        </button>

        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm">Select a note to edit or create a new one</p>
              <button onClick={handleNew} className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm">+ New Note</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6">
            <input
              className="text-xl font-bold text-white bg-transparent border-none outline-none placeholder:text-gray-600 mb-4"
              value={editorTitle}
              onChange={e => onTitleChange(e.target.value)}
              placeholder="Note title…"
            />
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <input
                className="flex-1 text-xs text-gray-400 bg-transparent border-none outline-none placeholder:text-gray-600"
                value={editorTags}
                onChange={e => onTagsChange(e.target.value)}
                placeholder="Tags, comma separated…"
              />
              <span className="text-[10px] text-gray-600 italic">autosaves</span>
            </div>
            <textarea
              className="flex-1 text-sm text-gray-200 bg-transparent border-none outline-none resize-none placeholder:text-gray-600 leading-relaxed"
              value={editorContent}
              onChange={e => onContentChange(e.target.value)}
              placeholder="Start writing…"
            />
          </div>
        )}
      </div>
    </div>
  );
}

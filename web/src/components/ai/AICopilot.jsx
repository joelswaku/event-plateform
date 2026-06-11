"use client";
import { useState } from "react";
import { Sparkles, Wand2, Loader2, Plus } from "lucide-react";
import { useAIStore } from "@/store/ai.store";

export default function AICopilot({ eventId, onApplySection, onApplyAll }) {
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("generate"); // "generate" | "improve"
  const { generateBuilderPage, loading } = useAIStore();

  async function handleGenerate() {
    if (!instruction.trim()) return;
    const res = await generateBuilderPage(eventId, { styleInstruction: instruction, tone: mode === "improve" ? "refined" : "modern" });
    if (res.success) setResult(res.data);
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a] border-l border-white/8">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-white">AI Copilot</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-semibold">
          {["generate", "improve"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 capitalize transition-colors ${mode === m ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              {m === "generate" ? "Generate from scratch" : "Improve current"}
            </button>
          ))}
        </div>

        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={mode === "generate" ? "e.g. Create a luxurious wedding page with warm tones…" : "e.g. Make it feel more premium and modern…"}
          className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-indigo-500/50 resize-none h-24"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !instruction.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate</>}
        </button>
      </div>

      {result && (
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Generated Sections</p>
            <button
              onClick={() => onApplyAll?.(result.sections)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Apply All ({result.sections?.length})
            </button>
          </div>

          {(result.sections || []).map((section, i) => (
            <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-400 font-semibold uppercase">{section.type}</span>
                  <p className="text-sm text-white font-medium">{section.title}</p>
                </div>
                <button
                  onClick={() => onApplySection?.(section)}
                  className="shrink-0 flex items-center gap-1 text-xs text-indigo-400 hover:text-white px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Apply
                </button>
              </div>
              {section.body && <p className="text-xs text-gray-400 line-clamp-2">{section.body}</p>}
            </div>
          ))}

          {result.colorPalette && (
            <div className="bg-white/4 border border-white/8 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-semibold mb-2">Suggested Palette</p>
              <div className="flex gap-2">
                {Object.entries(result.colorPalette).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: color }} />
                    <p className="text-[9px] text-gray-500 mt-1 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

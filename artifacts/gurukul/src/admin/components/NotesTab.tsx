import { useState, useEffect, useCallback, useMemo } from "react";
import { StickyNote, Plus, Palette, Check, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

type Note = {
  id: number;
  ownerKey: string;
  content: string;
  date: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

const NOTE_COLORS = [
  { key: "yellow", bg: "bg-yellow-100",  border: "border-yellow-300",  dot: "bg-yellow-400",  label: "Yellow"  },
  { key: "pink",   bg: "bg-pink-100",    border: "border-pink-300",    dot: "bg-pink-400",    label: "Pink"    },
  { key: "blue",   bg: "bg-blue-100",    border: "border-blue-300",    dot: "bg-blue-400",    label: "Blue"    },
  { key: "green",  bg: "bg-green-100",   border: "border-green-300",   dot: "bg-green-400",   label: "Green"   },
  { key: "purple", bg: "bg-purple-100",  border: "border-purple-300",  dot: "bg-purple-400",  label: "Purple"  },
];

function noteStyle(color: string) {
  return NOTE_COLORS.find(c => c.key === color) ?? NOTE_COLORS[0];
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

function fmtDateLong(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function NotesTab({ standalone = false }: { standalone?: boolean }) {
  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [draft,    setDraft]    = useState("");
  const [noteDate, setNoteDate] = useState(todayStr());
  const [color,    setColor]    = useState("yellow");

  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editColor,   setEditColor]   = useState("yellow");
  const [editSaving,  setEditSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.teacherNotes.list();
      setNotes(data as Note[]);
    } catch { toast.error("Failed to load notes"); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await adminApi.teacherNotes.create({ content: draft.trim(), date: noteDate, color });
      setDraft("");
      await load();
    } catch { toast.error("Failed to save note"); }
    finally { setSaving(false); }
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditContent(n.content);
    setEditColor(n.color);
  }

  async function saveEdit(id: number) {
    if (!editContent.trim()) return;
    setEditSaving(true);
    try {
      await adminApi.teacherNotes.update(id, { content: editContent.trim(), color: editColor });
      setEditingId(null);
      await load();
    } catch { toast.error("Failed to save"); }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this note?")) return;
    try {
      await adminApi.teacherNotes.remove(id);
      await load();
    } catch { toast.error("Failed to delete"); }
  }

  const dateGroups = useMemo(() => {
    const map: Record<string, Note[]> = {};
    for (const n of notes) {
      if (!map[n.date]) map[n.date] = [];
      map[n.date].push(n);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [notes]);

  const currentStyle = noteStyle(color);

  return (
    <div className="space-y-5">

      {/* Standalone page header */}
      {standalone && (
        <div>
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <StickyNote className="w-5 h-5" /> My Sticky Notes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Private notes — only visible to you.</p>
        </div>
      )}

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              className="input text-sm h-9 px-3"
              value={noteDate}
              onChange={e => setNoteDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Palette className="w-3 h-3" /> Color
            </label>
            <div className="flex items-center gap-1.5 h-9">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full ${c.dot} transition-all border-2 ${
                    color === c.key ? "border-secondary scale-125 shadow" : "border-transparent hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <textarea
          className={`w-full rounded-xl border-2 px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:outline-none resize-none min-h-[100px] transition-colors ${currentStyle.bg} ${currentStyle.border}`}
          placeholder="Jot down a note… (only you can see this)"
          value={draft}
          maxLength={2500}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
        />

        <div className="flex items-center justify-between">
          <span className={`text-xs ${draft.length >= 2250 ? (draft.length >= 2500 ? "text-red-600 font-semibold" : "text-amber-600") : "text-muted-foreground"}`}>
            {draft.length > 0 ? `${draft.length} / 2500 chars${draft.length < 2500 ? " · Ctrl+Enter to save" : " — limit reached"}` : "Private — only visible to you · 2500 char limit"}
          </span>
          <button
            onClick={handleAdd}
            disabled={saving || !draft.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Plus className="w-4 h-4" /> Add Note</>}
          </button>
        </div>
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading notes…
        </div>
      ) : dateGroups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">No notes yet</p>
          <p className="text-xs mt-1">Start jotting ideas above — they're private to you.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map(({ date, items }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {fmtDateLong(date)}
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className="text-xs text-muted-foreground">
                  {items.length} note{items.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(n => {
                  const style     = noteStyle(n.color);
                  const isEditing = editingId === n.id;

                  return (
                    <div
                      key={n.id}
                      className={`rounded-2xl border-2 px-4 py-3 shadow-sm ${style.bg} ${style.border} relative group`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            {NOTE_COLORS.map(c => (
                              <button
                                key={c.key}
                                onClick={() => setEditColor(c.key)}
                                title={c.label}
                                className={`w-5 h-5 rounded-full ${c.dot} border-2 transition-all ${
                                  editColor === c.key ? "border-secondary scale-125" : "border-transparent hover:scale-110"
                                }`}
                              />
                            ))}
                          </div>
                          <textarea
                            className={`w-full rounded-xl border-2 px-3 py-2 text-sm text-secondary focus:outline-none resize-none min-h-[80px] bg-white/60 ${noteStyle(editColor).border}`}
                            value={editContent}
                            maxLength={2500}
                            onChange={e => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <span className={`text-xs ${editContent.length >= 2250 ? (editContent.length >= 2500 ? "text-red-600 font-semibold" : "text-amber-600") : "text-muted-foreground"}`}>
                            {editContent.length} / 2500
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(n.id)}
                              disabled={editSaving}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
                            >
                              {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-secondary hover:bg-white/50 transition-colors"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed pr-12">
                            {n.content}
                          </p>
                          <div className="text-xs text-muted-foreground/70 mt-2">
                            {new Date(n.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric", minute: "2-digit",
                            })}
                          </div>
                          <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(n)}
                              className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-secondary transition-colors shadow-sm"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="p-1.5 rounded-lg bg-white/70 hover:bg-red-50 text-red-500 transition-colors shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

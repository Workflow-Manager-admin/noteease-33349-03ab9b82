import React, { useEffect, useState } from "react";
import "./App.css";
import "./notesapp.css";

/**
 * ---- NOTES APP: Minimal Modern Notes UI ----
 * Layout: Sidebar (Notes list) | Main (Note editor/view)
 * Palette: primary #1976d2, secondary #424242, accent #ffca28
 */

// API endpoint configuration - adjust as needed for deployment
const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// ----- API Client: CRUD operations -----
// PUBLIC_INTERFACE
async function fetchNotes() {
  const res = await fetch(`${API_URL}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}
// PUBLIC_INTERFACE
async function fetchNote(noteId) {
  const res = await fetch(`${API_URL}/notes/${noteId}`);
  if (!res.ok) throw new Error("Failed to fetch note");
  return res.json();
}
// PUBLIC_INTERFACE
async function createNote(note) {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}
// PUBLIC_INTERFACE
async function updateNote(noteId, note) {
  const res = await fetch(`${API_URL}/notes/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}
// PUBLIC_INTERFACE
async function deleteNote(noteId) {
  const res = await fetch(`${API_URL}/notes/${noteId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
  return true;
}

// ----- Main App Component -----
function App() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState("view"); // view | edit | create
  const [error, setError] = useState(null);

  // Fetch notes list on mount
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadNote(selectedId);
    } else {
      setSelectedNote(null);
    }
    // eslint-disable-next-line
  }, [selectedId]);

  async function loadNotes() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotes();
      setNotes(data);
      // Autoselect first note if present
      if (data.length > 0) setSelectedId(data[0].id);
      else setSelectedId(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function loadNote(id) {
    setLoading(true);
    setError(null);
    try {
      const note = await fetchNote(id);
      setSelectedNote(note);
      setEditorMode("view");
    } catch (e) {
      setError(e.message);
      setSelectedNote(null);
    }
    setLoading(false);
  }

  function handleNewNote() {
    setSelectedNote({ title: "", content: "" });
    setEditorMode("create");
    setSelectedId(null);
  }

  function handleEditNote() {
    setEditorMode("edit");
  }

  async function handleDeleteNote(id) {
    if (
      window.confirm(
        "Are you sure you want to delete this note? This action cannot be undone."
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        await deleteNote(id);
        await loadNotes();
        setSelectedNote(null);
        setSelectedId(null);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    }
  }

  async function handleSaveNote(note) {
    setLoading(true);
    setError(null);
    try {
      if (editorMode === "create") {
        const newNote = await createNote(note);
        await loadNotes();
        setSelectedId(newNote.id);
      } else if (editorMode === "edit" && selectedNote) {
        await updateNote(selectedNote.id, note);
        await loadNotes();
        setSelectedId(selectedNote.id);
      }
      setEditorMode("view");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  function handleSelectNote(id) {
    setSelectedId(id);
  }

  // ---- RENDER ----

  return (
    <div className="app notesapp-root">
      <nav className="navbar notesapp-navbar">
        <div className="logo">
          <span className="logo-symbol" style={{ color: "#ffca28" }}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="#1976d2" />
              <rect x="11" y="12" width="26" height="24" rx="3" fill="#ffca28" />
              <rect x="15" y="16" width="18" height="2" rx="1" fill="#424242"/>
              <rect x="15" y="22" width="12" height="2" rx="1" fill="#424242" />
              <rect x="15" y="28" width="15" height="2" rx="1" fill="#424242" />
            </svg>
          </span>
          NoteEase
        </div>
        <div className="appbar-actions" style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-accent" onClick={handleNewNote}>+ New Note</button>
        </div>
      </nav>
      <main className="notesapp-main">
        {/* Sidebar: Notes List */}
        <aside className="notesapp-sidebar">
          <NotesList
            notes={notes}
            selectedId={selectedId}
            onSelect={handleSelectNote}
            onNewNote={handleNewNote}
            loading={loading}
          />
        </aside>
        {/* Main: Editor/Detail */}
        <section className="notesapp-detail">
          {loading && <div className="notesapp-loading">Loading…</div>}
          {error && <div className="notesapp-error">{error}</div>}
          {!loading && editorMode === "create" && (
            <NoteEditor
              note={{ title: "", content: "" }}
              mode="create"
              onCancel={() => {
                setEditorMode("view");
                setSelectedId(notes.length > 0 ? notes[0].id : null);
              }}
              onSave={handleSaveNote}
            />
          )}
          {!loading &&
            editorMode === "edit" &&
            selectedNote &&
            (
              <NoteEditor
                note={selectedNote}
                mode="edit"
                onCancel={() => setEditorMode("view")}
                onSave={handleSaveNote}
              />
            )}
          {!loading &&
            editorMode === "view" &&
            selectedNote && (
              <NoteDetail
                note={selectedNote}
                onEdit={handleEditNote}
                onDelete={() => handleDeleteNote(selectedNote.id)}
              />
            )}
          {!loading &&
            !selectedNote &&
            editorMode !== "create" && (
              <div className="notesapp-empty">
                <p>No note selected. Click "New Note" to get started!</p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

// ----- Notes List Sidebar -----
function NotesList({ notes, selectedId, onSelect, onNewNote, loading }) {
  return (
    <div className="noteslist-root">
      <div className="noteslist-header">
        <h2 className="noteslist-title">Your Notes</h2>
        <button className="btn btn-accent" style={{ fontSize: "1rem", padding: "6px 14px" }} onClick={onNewNote}>
          +
        </button>
      </div>
      <div className="noteslist-list">
        {loading ? (
          <div style={{ color: "#888" }}>Loading…</div>
        ) : notes.length === 0 ? (
          <div style={{ color: "#888" }}>No notes yet</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={
                "noteslist-item" + (selectedId === note.id ? " noteslist-selected" : "")
              }
              onClick={() => onSelect(note.id)}
            >
              <div className="item-title">{note.title ? note.title : <em>(Untitled)</em>}</div>
              <div className="item-snippet">{note.content?.substring(0, 32)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----- Note Editor (edit/create) -----
function NoteEditor({ note, mode, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: note.title || "",
    content: note.content || "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form className="noteeditor-root" onSubmit={handleSubmit}>
      <input
        className="noteeditor-title"
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        autoFocus
        maxLength={100}
      />
      <textarea
        className="noteeditor-textarea"
        name="content"
        placeholder="Write your note here..."
        value={form.content}
        onChange={handleChange}
        rows={12}
      />
      <div className="noteeditor-actions">
        <button type="submit" className="btn btn-primary">
          {mode === "edit" ? "Save Changes" : "Create Note"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ marginLeft: 10 }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ----- Note Detail View -----
function NoteDetail({ note, onEdit, onDelete }) {
  return (
    <div className="notedetail-root">
      <h1 className="notedetail-title">{note.title || <em>(Untitled)</em>}</h1>
      <div className="notedetail-content">{note.content}</div>
      <div className="notedetail-actions">
        <button className="btn btn-primary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-secondary" onClick={onDelete} style={{ marginLeft: 10 }}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default App;

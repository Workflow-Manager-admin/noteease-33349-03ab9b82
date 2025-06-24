from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from uuid import UUID

from .database import db
from .models import NoteCreate, NoteUpdate, NoteOut, Message

tags_metadata = [
    {
        "name": "Notes",
        "description": "CRUD operations for notes.",
    }
]

app = FastAPI(
    title="Notes Backend API",
    description="FastAPI backend for NoteEase app, with Supabase (PostgreSQL) for data storage.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)


# Ensure two blank lines here for PEP8 E302 compliance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize the connection pool at service startup."""

    await db.connect()


@app.on_event("shutdown")
async def shutdown():
    """Cleanup the connection pool when service stops."""

    await db.disconnect()


# PUBLIC_INTERFACE
@app.get("/", response_model=Message)
def health_check():
    """
    Health check endpoint.

    Returns:
        A message indicating service status.
    """
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.get(
    "/notes/",
    tags=["Notes"],
    response_model=List[NoteOut],
    summary="Get all notes",
    description="Retrieve all notes ordered by most recent update.",
)
async def list_notes():
    rows = await db.fetch(
        "SELECT id, title, content, created_at, updated_at FROM notes "
        "ORDER BY updated_at DESC;"
    )
    return [NoteOut(**dict(row)) for row in rows]


# PUBLIC_INTERFACE
@app.get(
    "/notes/{note_id}",
    tags=["Notes"],
    response_model=NoteOut,
    summary="Get a note by ID",
    description="Get the full detail of a single note by its UUID.",
)
async def get_note(note_id: UUID):
    row = await db.fetchrow(
        "SELECT id, title, content, created_at, updated_at FROM notes WHERE id=$1;",
        str(note_id),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteOut(**dict(row))


# PUBLIC_INTERFACE
@app.post(
    "/notes/",
    tags=["Notes"],
    response_model=NoteOut,
    status_code=201,
    summary="Create a new note",
    description="Create and store a new note.",
)
async def create_note(note: NoteCreate):
    row = await db.fetchrow(
        "INSERT INTO notes (title, content) "
        "VALUES ($1, $2) RETURNING id, title, content, created_at, updated_at;",
        note.title,
        note.content,
    )
    return NoteOut(**dict(row))


# PUBLIC_INTERFACE
@app.put(
    "/notes/{note_id}",
    tags=["Notes"],
    response_model=NoteOut,
    summary="Update a note (PUT)",
    description="Replace title and content of an existing note.",
)
async def update_note(note_id: UUID, note: NoteCreate):
    row = await db.fetchrow(
        "UPDATE notes SET title=$1, content=$2, updated_at=now() "
        "WHERE id=$3 RETURNING id, title, content, created_at, updated_at;",
        note.title,
        note.content,
        str(note_id),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteOut(**dict(row))


# PUBLIC_INTERFACE
@app.patch(
    "/notes/{note_id}",
    tags=["Notes"],
    response_model=NoteOut,
    summary="Partially update a note (PATCH)",
    description="Edit fields of a note (title/content).",
)
async def patch_note(note_id: UUID, note: NoteUpdate):
    fetch_row = await db.fetchrow(
        "SELECT * FROM notes WHERE id=$1;", str(note_id)
    )
    if not fetch_row:
        raise HTTPException(status_code=404, detail="Note not found")

    new_title = note.title if note.title is not None else fetch_row["title"]
    new_content = note.content if note.content is not None else fetch_row["content"]
    row = await db.fetchrow(
        "UPDATE notes SET title=$1, content=$2, updated_at=now() "
        "WHERE id=$3 RETURNING id, title, content, created_at, updated_at;",
        new_title,
        new_content,
        str(note_id),
    )
    return NoteOut(**dict(row))


# PUBLIC_INTERFACE
@app.delete(
    "/notes/{note_id}",
    tags=["Notes"],
    response_model=Message,
    summary="Delete a note",
    description="Remove a note by its UUID.",
)
async def delete_note(note_id: UUID):
    row = await db.fetchrow("SELECT id FROM notes WHERE id=$1;", str(note_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.execute("DELETE FROM notes WHERE id=$1;", str(note_id))
    return {"message": f"Deleted note {note_id}"}

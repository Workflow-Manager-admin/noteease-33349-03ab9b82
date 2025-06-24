from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# PUBLIC_INTERFACE
class NoteCreate(BaseModel):
    """Schema for creating a note."""
    title: str = Field(..., description="Title of the note")
    content: str = Field(..., description="Content of the note")


# PUBLIC_INTERFACE
class NoteUpdate(BaseModel):
    """Schema for updating a note (partial/patch or put)."""
    title: Optional[str] = Field(None, description="New title for the note")
    content: Optional[str] = Field(None, description="New content for the note")


# PUBLIC_INTERFACE
class NoteInDB(BaseModel):
    """Schema for a note stored in the database."""
    id: UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime


# PUBLIC_INTERFACE
class NoteOut(NoteInDB):
    """Public-facing note schema, same as NoteInDB."""
    pass


# PUBLIC_INTERFACE
class Message(BaseModel):
    """Schema for simple success or info response."""
    message: str

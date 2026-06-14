from pydantic import BaseModel, Field
from typing import List, Optional

class ActionItem(BaseModel):
    task: str
    owner: Optional[str] = "Unassigned"
    due: Optional[str] = "TBD"
    completed: bool = False

class MeetingResponse(BaseModel):
    id: str
    filename: str
    status: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    action_items: List[ActionItem] = []
    created_at: str

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    created_at: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# Auth models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

# Team models
class TeamMemberCreate(BaseModel):
    name: str
    email: str
    role: Optional[str] = "Member"

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_color: str
    created_at: str
    action_items_count: int = 0
    completed_count: int = 0

# Memory / AI Org Engine models
class MemoryInsight(BaseModel):
    type: str          # "conflict" | "repeated" | "unresolved"
    title: str
    description: str
    severity: str      # "high" | "medium" | "low"
    meetings: List[str]

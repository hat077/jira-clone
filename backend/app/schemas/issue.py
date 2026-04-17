from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class IssueBase(BaseModel):
    title: str
    description: str | None = None
    status: str = "todo"
    priority: str = "medium"

class IssueCreate(IssueBase):
    project_id: UUID
    assignee_id: UUID | None = None

class IssueResponse(IssueBase):
    id: UUID
    project_id: UUID
    reporter_id: UUID
    assignee_id: UUID | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    project_id: UUID | None = None
    assignee_id: UUID | None = None
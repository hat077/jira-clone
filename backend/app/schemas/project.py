from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: str | None = None

class ProjectCreate(ProjectBase):
    organization_id: UUID

class ProjectResponse(ProjectBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
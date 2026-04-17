from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ActivityLogBase(BaseModel):
    action: str
    old_value: str | None = None
    new_value: str | None = None

class ActivityLogCreate(ActivityLogBase):
    issue_id: UUID
    user_id: UUID

class ActivityLogResponse(ActivityLogBase):
    id: UUID
    issue_id: UUID
    user_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
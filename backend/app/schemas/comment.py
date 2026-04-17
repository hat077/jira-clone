from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: UUID
    issue_id: UUID
    user_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
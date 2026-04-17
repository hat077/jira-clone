from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class MembershipBase(BaseModel):
    role: str

class MembershipCreate(MembershipBase):
    user_id: UUID
    organization_id: UUID

class MembershipResponse(MembershipBase):
    id: UUID
    user_id: UUID
    organization_id: UUID
    joined_at: datetime
    model_config = ConfigDict(from_attributes=True)
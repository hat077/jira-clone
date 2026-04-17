from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, description="The name of the organizations")

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
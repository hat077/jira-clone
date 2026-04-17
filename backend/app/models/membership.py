from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.core.database import Base
import uuid

class Membership(Base):
    __tablename__ = 'memberships'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    role = Column(String, nullable=False)
    joined_at = Column(DateTime, nullable=False, default=datetime.now)
    user = relationship('User', back_populates='memberships')
    organization = relationship('Organization', back_populates='memberships')
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    memberships = relationship('Membership', back_populates='user')
    reported_issues = relationship('Issue', foreign_keys='Issue.reporter_id', back_populates='reporter')
    assigned_issues = relationship('Issue', foreign_keys='Issue.assignee_id', back_populates='assignee')
    comments = relationship('Comment', back_populates='user')
    activity_logs = relationship('ActivityLog', back_populates='user')
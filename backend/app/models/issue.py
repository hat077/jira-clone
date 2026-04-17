from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.core.database import Base

class Issue(Base):
    __tablename__ = 'issues'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default='todo')
    priority = Column(String, nullable=False, default='medium')
    reporter_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    reporter = relationship('User', foreign_keys=[reporter_id], back_populates='reported_issues')
    assignee = relationship('User', foreign_keys=[assignee_id], back_populates='assigned_issues')
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    project = relationship('Project', back_populates='issues')
    comments = relationship('Comment', back_populates='issue', cascade="all, delete-orphan")
    activity_logs = relationship('ActivityLog', back_populates='issue', cascade="all, delete-orphan")
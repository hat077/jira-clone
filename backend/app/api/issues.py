from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import get_db
from app.models.issue import Issue
from app.models.project import Project
from app.models.membership import Membership
from app.models.user import User
from app.models.comment import Comment
from app.models.activity_log import ActivityLog
from app.api.dependencies import get_current_user
from app.schemas.issue import IssueCreate, IssueResponse, IssueUpdate
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.activity_log import ActivityLogCreate, ActivityLogResponse
import uuid

router = APIRouter()

@router.post("/", response_model=IssueResponse)
def create_issue(issue_in: IssueCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == issue_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    new_issue = Issue(title=issue_in.title, project_id=issue_in.project_id, description=issue_in.description, status=issue_in.status, priority=issue_in.priority, reporter_id=current_user.id, assignee_id=issue_in.assignee_id)
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue

@router.get("/", response_model=list[IssueResponse])
def list_issues(project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    return issues

@router.get("/me", response_model=list[IssueResponse])
def list_my_issues(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issues = db.query(Issue).filter(Issue.assignee_id == current_user.id).all()
    return issues

@router.patch("/{issue_id}", response_model=IssueResponse)
def update_issue(issue_id: uuid.UUID, issue_in: IssueUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    issue_dict = issue_in.model_dump(exclude_unset=True)
    for key, value in issue_dict.items():
        if getattr(issue, key) != value:
            log_entry = ActivityLog(issue_id=issue_id, user_id=current_user.id, action=f"Updated {key}", old_value = getattr(issue, key), new_value = str(value))
            db.add(log_entry)
        setattr(issue, key, value)
    db.commit()
    db.refresh(issue)
    return issue

@router.post("/{issue_id}/comments", response_model=CommentResponse)
def add_comment(issue_id: uuid.UUID, comment_in: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    new_comment = Comment(content=comment_in.content, issue_id=issue_id, user_id=current_user.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/{issue_id}/comments", response_model=list[CommentResponse])
def list_comments(issue_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    project = db.query(Project).filter(Project.id == issue.project_id).first()
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    comments = db.query(Comment).filter(Comment.issue_id == issue_id).all()
    return comments

@router.get("/{issue_id}/activity", response_model=list[ActivityLogResponse])
def list_activity_logs(issue_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found.")
    logs = db.query(ActivityLog).filter(ActivityLog.issue_id == issue_id).order_by(ActivityLog.created_at.desc()).all()
    return logs

@router.get("/search")
def global_search(
    q: str,
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Find all projects belonging to the current Workspace (Org)
    projects = db.query(Project).filter(Project.organization_id == org_id).all()
    project_ids = [p.id for p in projects]

    if not project_ids:
        return []

    # 2. Find any issues within those projects that match the search query
    search_results = db.query(Issue).filter(
        Issue.project_id.in_(project_ids),
        Issue.title.ilike(f"%{q}%") # Matches any part of the title
    ).all()
    
    return search_results
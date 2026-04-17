from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import get_db
from app.models.project import Project
from app.models.membership import Membership
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.project import ProjectCreate, ProjectResponse
from app.schemas.user import UserResponse
import uuid

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(Membership).filter(Membership.organization_id == project_in.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this organization.")
    new_project = Project(name=project_in.name, organization_id=project_in.organization_id, description=project_in.description)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=list[ProjectResponse])
def get_projects(organization_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(Membership).filter(Membership.organization_id == organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this organization.")
    projects = db.query(Project).filter(Project.organization_id == organization_id).all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    membership = db.query(Membership).filter(Membership.organization_id == project.organization_id, Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to access this project.")
    return project

@router.get("/{project_id}/members")
def get_project_members(project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    memberships = db.query(Membership).filter(Membership.organization_id == project.organization_id).all()
    users = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            users.append({
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": m.role
            })
            
    return users

@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify the user is an Admin of the organization this project belongs to
    membership = db.query(Membership).filter(
        Membership.organization_id == project.organization_id,
        Membership.user_id == current_user.id
    ).first()

    if not membership or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can delete projects.")

    # Delete the project (If you set up cascading deletes in your database models,
    # this will also delete all issues and comments inside it!)
    db.delete(project)
    db.commit()
    
    return {"message": "Project successfully deleted"}
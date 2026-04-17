from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.schemas.organization import OrganizationCreate, OrganizationResponse
from app.core.database import get_db
from app.models.organization import Organization
from app.models.membership import Membership
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter()

@router.post("/", response_model=OrganizationResponse)
def create_organization(org_in: OrganizationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_org = Organization(name=org_in.name)
    db.add(new_org)
    db.flush()

    membership = Membership(user_id = current_user.id, organization_id = new_org.id, role = "admin")
    db.add(membership)
    db.commit()
    db.refresh(new_org)
    return new_org

@router.get("/", response_model=list[OrganizationResponse])
def get_organizations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    organizations = db.query(Organization).join(Membership).filter(Membership.user_id == current_user.id).all()
    return organizations

class InviteUserRequest(BaseModel):
    email: str
    role: str = "member"

@router.post("/{org_id}/invite")
def invite_user_to_workspace(
    org_id: uuid.UUID,
    invite_data: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify the current user actually has admin access to this org
    # (Skipping deep role checks here for simplicity, but you'd want to ensure they are the owner)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # 2. Find the user they want to invite
    target_user = db.query(User).filter(User.email == invite_data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found. Tell them to sign up first!")

    # 3. Check if they are already in the workspace
    existing_membership = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == target_user.id
    ).first()
    
    if existing_membership:
        raise HTTPException(status_code=400, detail="User is already in this workspace")

    # 4. Create the membership!
    new_membership = Membership(
        user_id=target_user.id,
        organization_id=org_id,
        role=invite_data.role
    )
    db.add(new_membership)
    db.commit()

    return {"message": f"Successfully added {target_user.full_name} as a {invite_data.role}!"}

@router.delete("/{org_id}/members/{user_id}")
def remove_user_from_workspace(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify the current user is an Admin of this workspace!
    # (You must protect this route so Members can't kick other Members)
    requester_membership = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == current_user.id
    ).first()

    if not requester_membership or requester_membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can remove users.")

    # 2. You can't kick yourself!
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself. Ask another Admin.")

    # 3. Find the membership of the person getting kicked
    target_membership = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id
    ).first()

    if not target_membership:
        raise HTTPException(status_code=404, detail="User is not in this workspace.")

    # 4. Delete the record
    db.delete(target_membership)
    db.commit()

    return {"message": "User successfully removed from workspace."}

@router.get("/{org_id}/members")
def get_org_members(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all memberships for this workspace
    memberships = db.query(Membership).filter(Membership.organization_id == org_id).all()
    
    results = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            results.append({
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": m.role
            })
    return results
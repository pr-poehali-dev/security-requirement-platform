from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Requirement, RequirementComment, RequirementLink
from ..id_gen import next_id

router = APIRouter(prefix="/requirements", tags=["requirements"])


# ── Schemas ──────────────────────────────────────────────────────────────────
class CommentOut(BaseModel):
    id: int
    requirement_id: str
    user_id: Optional[str]
    text: str
    created_at: datetime
    model_config = {"from_attributes": True}


class LinkOut(BaseModel):
    id: int
    requirement_id: str
    target_id: str
    link_type: str
    model_config = {"from_attributes": True}


class RequirementOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: str
    status: str
    source: str
    version: int
    created_at: datetime
    updated_at: datetime
    comments: List[CommentOut] = []
    links: List[LinkOut] = []
    model_config = {"from_attributes": True}


class RequirementCreate(BaseModel):
    title: str = "Новое требование"
    description: str = ""
    category: str = ""
    severity: str = "medium"
    status: str = "draft"
    source: str = ""


class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None


class CommentCreate(BaseModel):
    text: str
    user_id: Optional[str] = None


class LinkCreate(BaseModel):
    target_id: str
    link_type: str


# ── CRUD ─────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[RequirementOut])
def list_requirements(
    search: str = Query(""),
    category: str = Query(""),
    severity: str = Query(""),
    status: str = Query(""),
    db: Session = Depends(get_db),
):
    q = db.query(Requirement)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Requirement.title.ilike(like)) |
            (Requirement.id.ilike(like)) |
            (Requirement.source.ilike(like))
        )
    if category:
        q = q.filter(Requirement.category == category)
    if severity:
        q = q.filter(Requirement.severity == severity)
    if status:
        q = q.filter(Requirement.status == status)
    return q.order_by(Requirement.updated_at.desc()).all()


@router.get("/{req_id}", response_model=RequirementOut)
def get_requirement(req_id: str, db: Session = Depends(get_db)):
    obj = db.query(Requirement).filter(Requirement.id == req_id).first()
    if not obj:
        raise HTTPException(404, "Требование не найдено")
    return obj


@router.post("", response_model=RequirementOut, status_code=201)
def create_requirement(body: RequirementCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "REQ")
    obj = Requirement(id=new_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{req_id}", response_model=RequirementOut)
def update_requirement(req_id: str, body: RequirementUpdate, db: Session = Depends(get_db)):
    obj = db.query(Requirement).filter(Requirement.id == req_id).first()
    if not obj:
        raise HTTPException(404, "Требование не найдено")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    obj.version += 1
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{req_id}", status_code=204)
def delete_requirement(req_id: str, db: Session = Depends(get_db)):
    obj = db.query(Requirement).filter(Requirement.id == req_id).first()
    if not obj:
        raise HTTPException(404, "Требование не найдено")
    db.delete(obj)
    db.commit()


# ── Comments ─────────────────────────────────────────────────────────────────
@router.post("/{req_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(req_id: str, body: CommentCreate, db: Session = Depends(get_db)):
    if not db.query(Requirement).filter(Requirement.id == req_id).first():
        raise HTTPException(404, "Требование не найдено")
    obj = RequirementComment(requirement_id=req_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{req_id}/comments/{comment_id}", status_code=204)
def delete_comment(req_id: str, comment_id: int, db: Session = Depends(get_db)):
    obj = db.query(RequirementComment).filter(
        RequirementComment.id == comment_id,
        RequirementComment.requirement_id == req_id
    ).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


# ── Links ─────────────────────────────────────────────────────────────────────
@router.post("/{req_id}/links", response_model=LinkOut, status_code=201)
def add_link(req_id: str, body: LinkCreate, db: Session = Depends(get_db)):
    obj = RequirementLink(requirement_id=req_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{req_id}/links/{link_id}", status_code=204)
def delete_link(req_id: str, link_id: int, db: Session = Depends(get_db)):
    obj = db.query(RequirementLink).filter(
        RequirementLink.id == link_id,
        RequirementLink.requirement_id == req_id
    ).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats/summary")
def stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Requirement.id)).scalar()
    by_severity = dict(db.query(Requirement.severity, func.count()).group_by(Requirement.severity).all())
    by_status   = dict(db.query(Requirement.status,   func.count()).group_by(Requirement.status).all())
    by_category = dict(db.query(Requirement.category, func.count()).group_by(Requirement.category).all())
    return {"total": total, "by_severity": by_severity, "by_status": by_status, "by_category": by_category}

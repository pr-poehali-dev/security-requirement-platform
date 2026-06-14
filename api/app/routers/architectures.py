from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Architecture, ArchitectureTag, ArchitectureRequirement
from ..id_gen import next_id

router = APIRouter(prefix="/architectures", tags=["architectures"])


class TagOut(BaseModel):
    id: int
    tag: str
    model_config = {"from_attributes": True}


class ReqLinkOut(BaseModel):
    id: int
    requirement_id: str
    compliance_status: str
    model_config = {"from_attributes": True}


class ArchOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str
    author: str
    version: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    req_links: List[ReqLinkOut] = []
    model_config = {"from_attributes": True}


class ArchCreate(BaseModel):
    title: str = "Новая архитектура"
    description: str = ""
    category: str = ""
    status: str = "draft"
    author: str = ""


class ArchUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[List[str]] = None


class ReqLinkCreate(BaseModel):
    requirement_id: str
    compliance_status: str = "not_met"


@router.get("", response_model=List[ArchOut])
def list_architectures(search: str = Query(""), status: str = Query(""), db: Session = Depends(get_db)):
    q = db.query(Architecture)
    if search:
        like = f"%{search}%"
        q = q.filter((Architecture.title.ilike(like)) | (Architecture.id.ilike(like)))
    if status:
        q = q.filter(Architecture.status == status)
    return q.order_by(Architecture.updated_at.desc()).all()


@router.get("/{arch_id}", response_model=ArchOut)
def get_architecture(arch_id: str, db: Session = Depends(get_db)):
    obj = db.query(Architecture).filter(Architecture.id == arch_id).first()
    if not obj:
        raise HTTPException(404, "Архитектура не найдена")
    return obj


@router.post("", response_model=ArchOut, status_code=201)
def create_architecture(body: ArchCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "ARCH")
    obj = Architecture(id=new_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{arch_id}", response_model=ArchOut)
def update_architecture(arch_id: str, body: ArchUpdate, db: Session = Depends(get_db)):
    obj = db.query(Architecture).filter(Architecture.id == arch_id).first()
    if not obj:
        raise HTTPException(404, "Архитектура не найдена")
    data = body.model_dump(exclude_none=True)
    tags = data.pop("tags", None)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.version += 1
    if tags is not None:
        db.query(ArchitectureTag).filter(ArchitectureTag.architecture_id == arch_id).delete()
        for t in tags:
            db.add(ArchitectureTag(architecture_id=arch_id, tag=t))
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{arch_id}", status_code=204)
def delete_architecture(arch_id: str, db: Session = Depends(get_db)):
    obj = db.query(Architecture).filter(Architecture.id == arch_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


@router.post("/{arch_id}/requirements", response_model=ReqLinkOut, status_code=201)
def add_requirement(arch_id: str, body: ReqLinkCreate, db: Session = Depends(get_db)):
    obj = ArchitectureRequirement(architecture_id=arch_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{arch_id}/requirements/{link_id}", status_code=204)
def remove_requirement(arch_id: str, link_id: int, db: Session = Depends(get_db)):
    obj = db.query(ArchitectureRequirement).filter(
        ArchitectureRequirement.id == link_id,
        ArchitectureRequirement.architecture_id == arch_id
    ).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


@router.get("/stats/summary")
def stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Architecture.id)).scalar()
    by_status = dict(db.query(Architecture.status, func.count()).group_by(Architecture.status).all())
    return {"total": total, "by_status": by_status}

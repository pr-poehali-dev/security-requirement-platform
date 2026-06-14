from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import OrgDomain
from ..id_gen import next_id

router = APIRouter(prefix="/org-domains", tags=["org-domains"])


class OrgDomainOut(BaseModel):
    id: str
    name: str
    owner: str
    status: str
    description: str
    version: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class OrgDomainCreate(BaseModel):
    name: str = "Новый домен"
    owner: str = ""
    status: str = "dev"
    description: str = ""


class OrgDomainUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


@router.get("", response_model=List[OrgDomainOut])
def list_org_domains(search: str = Query(""), status: str = Query(""), db: Session = Depends(get_db)):
    q = db.query(OrgDomain)
    if search:
        like = f"%{search}%"
        q = q.filter((OrgDomain.name.ilike(like)) | (OrgDomain.id.ilike(like)) | (OrgDomain.owner.ilike(like)))
    if status:
        q = q.filter(OrgDomain.status == status)
    return q.order_by(OrgDomain.updated_at.desc()).all()


@router.get("/{domain_id}", response_model=OrgDomainOut)
def get_org_domain(domain_id: str, db: Session = Depends(get_db)):
    obj = db.query(OrgDomain).filter(OrgDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404, "Домен не найден")
    return obj


@router.post("", response_model=OrgDomainOut, status_code=201)
def create_org_domain(body: OrgDomainCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "org-dom")
    obj = OrgDomain(id=new_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{domain_id}", response_model=OrgDomainOut)
def update_org_domain(domain_id: str, body: OrgDomainUpdate, db: Session = Depends(get_db)):
    obj = db.query(OrgDomain).filter(OrgDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404, "Домен не найден")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    obj.version += 1
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{domain_id}", status_code=204)
def delete_org_domain(domain_id: str, db: Session = Depends(get_db)):
    obj = db.query(OrgDomain).filter(OrgDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


@router.get("/stats/by-status")
def stats(db: Session = Depends(get_db)):
    return dict(db.query(OrgDomain.status, func.count()).group_by(OrgDomain.status).all())

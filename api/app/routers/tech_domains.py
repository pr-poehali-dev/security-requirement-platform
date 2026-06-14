from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import TechDomain, TechDomainOrgLink, OrgDomain
from ..id_gen import next_id

router = APIRouter(prefix="/tech-domains", tags=["tech-domains"])


class OrgLinkOut(BaseModel):
    id: int
    org_domain_id: str
    model_config = {"from_attributes": True}


class TechDomainOut(BaseModel):
    id: str
    name: str
    owner: str
    status: str
    description: str
    version: int
    created_at: datetime
    updated_at: datetime
    org_links: List[OrgLinkOut] = []
    model_config = {"from_attributes": True}


class TechDomainCreate(BaseModel):
    name: str = "Новый технический домен"
    owner: str = ""
    status: str = "dev"
    description: str = ""
    org_domain_ids: List[str] = []


class TechDomainUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    org_domain_ids: Optional[List[str]] = None


@router.get("", response_model=List[TechDomainOut])
def list_tech_domains(search: str = Query(""), status: str = Query(""), db: Session = Depends(get_db)):
    q = db.query(TechDomain)
    if search:
        like = f"%{search}%"
        q = q.filter((TechDomain.name.ilike(like)) | (TechDomain.id.ilike(like)) | (TechDomain.owner.ilike(like)))
    if status:
        q = q.filter(TechDomain.status == status)
    return q.order_by(TechDomain.updated_at.desc()).all()


@router.get("/{domain_id}", response_model=TechDomainOut)
def get_tech_domain(domain_id: str, db: Session = Depends(get_db)):
    obj = db.query(TechDomain).filter(TechDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404, "Технический домен не найден")
    return obj


@router.post("", response_model=TechDomainOut, status_code=201)
def create_tech_domain(body: TechDomainCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "tech-dom")
    org_ids = body.org_domain_ids
    data = body.model_dump(exclude={"org_domain_ids"})
    obj = TechDomain(id=new_id, **data)
    db.add(obj)
    db.flush()
    for oid in org_ids:
        db.add(TechDomainOrgLink(tech_domain_id=new_id, org_domain_id=oid))
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{domain_id}", response_model=TechDomainOut)
def update_tech_domain(domain_id: str, body: TechDomainUpdate, db: Session = Depends(get_db)):
    obj = db.query(TechDomain).filter(TechDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404, "Технический домен не найден")
    data = body.model_dump(exclude_none=True)
    org_ids = data.pop("org_domain_ids", None)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.version += 1
    if org_ids is not None:
        db.query(TechDomainOrgLink).filter(TechDomainOrgLink.tech_domain_id == domain_id).delete()
        for oid in org_ids:
            db.add(TechDomainOrgLink(tech_domain_id=domain_id, org_domain_id=oid))
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{domain_id}", status_code=204)
def delete_tech_domain(domain_id: str, db: Session = Depends(get_db)):
    obj = db.query(TechDomain).filter(TechDomain.id == domain_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()

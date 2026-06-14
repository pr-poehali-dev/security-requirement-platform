from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Template, TemplateCompliance, TemplateRequirement
from ..id_gen import next_id

router = APIRouter(prefix="/templates", tags=["templates"])


class ComplianceOut(BaseModel):
    id: int
    standard_name: str
    model_config = {"from_attributes": True}


class TemplateOut(BaseModel):
    id: str
    title: str
    icon: str
    description: str
    category: str
    complexity: str
    used_count: int
    created_at: datetime
    updated_at: datetime
    compliance: List[ComplianceOut] = []
    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    title: str = "Новый шаблон"
    icon: str = "FileText"
    description: str = ""
    category: str = ""
    complexity: str = "medium"
    compliance: List[str] = []


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    complexity: Optional[str] = None
    compliance: Optional[List[str]] = None


@router.get("", response_model=List[TemplateOut])
def list_templates(search: str = Query(""), category: str = Query(""), db: Session = Depends(get_db)):
    q = db.query(Template)
    if search:
        like = f"%{search}%"
        q = q.filter((Template.title.ilike(like)) | (Template.category.ilike(like)))
    if category:
        q = q.filter(Template.category == category)
    return q.order_by(Template.title).all()


@router.get("/{tpl_id}", response_model=TemplateOut)
def get_template(tpl_id: str, db: Session = Depends(get_db)):
    obj = db.query(Template).filter(Template.id == tpl_id).first()
    if not obj:
        raise HTTPException(404, "Шаблон не найден")
    return obj


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(body: TemplateCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "TPL")
    compliance = body.compliance
    data = body.model_dump(exclude={"compliance"})
    obj = Template(id=new_id, **data)
    db.add(obj)
    db.flush()
    for s in compliance:
        db.add(TemplateCompliance(template_id=new_id, standard_name=s))
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{tpl_id}", response_model=TemplateOut)
def update_template(tpl_id: str, body: TemplateUpdate, db: Session = Depends(get_db)):
    obj = db.query(Template).filter(Template.id == tpl_id).first()
    if not obj:
        raise HTTPException(404, "Шаблон не найден")
    data = body.model_dump(exclude_none=True)
    compliance = data.pop("compliance", None)
    for k, v in data.items():
        setattr(obj, k, v)
    if compliance is not None:
        db.query(TemplateCompliance).filter(TemplateCompliance.template_id == tpl_id).delete()
        for s in compliance:
            db.add(TemplateCompliance(template_id=tpl_id, standard_name=s))
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tpl_id}", status_code=204)
def delete_template(tpl_id: str, db: Session = Depends(get_db)):
    obj = db.query(Template).filter(Template.id == tpl_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


@router.post("/{tpl_id}/apply", status_code=200)
def apply_template(tpl_id: str, db: Session = Depends(get_db)):
    obj = db.query(Template).filter(Template.id == tpl_id).first()
    if not obj:
        raise HTTPException(404)
    obj.used_count += 1
    db.commit()
    return {"id": tpl_id, "used_count": obj.used_count}

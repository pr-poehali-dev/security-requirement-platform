import base64
import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Technology, TechTag, TechFile, TechMermaid
from ..id_gen import next_id
from ..config import settings

router = APIRouter(prefix="/technologies", tags=["technologies"])


def _s3_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
    )


# ── Schemas ──────────────────────────────────────────────────────────────────
class TagOut(BaseModel):
    id: int
    tag: str
    model_config = {"from_attributes": True}


class FileOut(BaseModel):
    id: int
    filename: str
    s3_key: str
    content_type: str
    size_bytes: int
    created_at: datetime
    model_config = {"from_attributes": True}


class MermaidOut(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class TechListOut(BaseModel):
    id: str
    name: str
    owner: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    model_config = {"from_attributes": True}


class TechDetailOut(TechListOut):
    description: str
    files: List[FileOut] = []
    mermaid: List[MermaidOut] = []


class TechCreate(BaseModel):
    name: str = "Новая технология"
    owner: str = ""
    status: str = "dev"
    description: str = ""
    tags: List[str] = []


class TechUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class MermaidCreate(BaseModel):
    title: str = "Схема"
    content: str = ""


class MermaidUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class FileUploadBody(BaseModel):
    filename: str
    content_type: str = "application/octet-stream"
    file_base64: str


# ── CRUD ─────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[TechListOut])
def list_technologies(search: str = Query(""), status: str = Query(""), db: Session = Depends(get_db)):
    q = db.query(Technology)
    if search:
        like = f"%{search}%"
        q = q.filter((Technology.name.ilike(like)) | (Technology.id.ilike(like)) | (Technology.owner.ilike(like)))
    if status:
        q = q.filter(Technology.status == status)
    return q.order_by(Technology.updated_at.desc()).all()


@router.get("/tags/all", response_model=List[str])
def all_tags(db: Session = Depends(get_db)):
    rows = db.query(TechTag.tag).distinct().order_by(TechTag.tag).all()
    return [r[0] for r in rows]


@router.get("/stats/summary")
def stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Technology.id)).scalar()
    by_status = dict(db.query(Technology.status, func.count()).group_by(Technology.status).all())
    return {"total": total, "by_status": by_status}


@router.get("/{tech_id}", response_model=TechDetailOut)
def get_technology(tech_id: str, db: Session = Depends(get_db)):
    obj = db.query(Technology).filter(Technology.id == tech_id).first()
    if not obj:
        raise HTTPException(404, "Технология не найдена")
    return obj


@router.post("", response_model=TechDetailOut, status_code=201)
def create_technology(body: TechCreate, db: Session = Depends(get_db)):
    new_id = next_id(db, "tech")
    tags = body.tags
    data = body.model_dump(exclude={"tags"})
    obj = Technology(id=new_id, **data)
    db.add(obj)
    db.flush()
    for tag in tags:
        db.add(TechTag(technology_id=new_id, tag=tag.strip()))
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{tech_id}", response_model=TechDetailOut)
def update_technology(tech_id: str, body: TechUpdate, db: Session = Depends(get_db)):
    obj = db.query(Technology).filter(Technology.id == tech_id).first()
    if not obj:
        raise HTTPException(404, "Технология не найдена")
    data = body.model_dump(exclude_none=True)
    tags = data.pop("tags", None)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.version += 1
    if tags is not None:
        db.query(TechTag).filter(TechTag.technology_id == tech_id).delete()
        for tag in tags:
            db.add(TechTag(technology_id=tech_id, tag=tag.strip()))
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tech_id}", status_code=204)
def delete_technology(tech_id: str, db: Session = Depends(get_db)):
    obj = db.query(Technology).filter(Technology.id == tech_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


# ── Tags ──────────────────────────────────────────────────────────────────────
@router.post("/{tech_id}/tags", response_model=TagOut, status_code=201)
def add_tag(tech_id: str, tag: str = Query(...), db: Session = Depends(get_db)):
    if not db.query(Technology).filter(Technology.id == tech_id).first():
        raise HTTPException(404)
    obj = TechTag(technology_id=tech_id, tag=tag.strip())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tech_id}/tags/{tag_id}", status_code=204)
def remove_tag(tech_id: str, tag_id: int, db: Session = Depends(get_db)):
    obj = db.query(TechTag).filter(TechTag.id == tag_id, TechTag.technology_id == tech_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


# ── Mermaid ───────────────────────────────────────────────────────────────────
@router.post("/{tech_id}/mermaid", response_model=MermaidOut, status_code=201)
def add_mermaid(tech_id: str, body: MermaidCreate, db: Session = Depends(get_db)):
    if not db.query(Technology).filter(Technology.id == tech_id).first():
        raise HTTPException(404)
    obj = TechMermaid(technology_id=tech_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{tech_id}/mermaid/{mermaid_id}", response_model=MermaidOut)
def update_mermaid(tech_id: str, mermaid_id: int, body: MermaidUpdate, db: Session = Depends(get_db)):
    obj = db.query(TechMermaid).filter(TechMermaid.id == mermaid_id, TechMermaid.technology_id == tech_id).first()
    if not obj:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tech_id}/mermaid/{mermaid_id}", status_code=204)
def delete_mermaid(tech_id: str, mermaid_id: int, db: Session = Depends(get_db)):
    obj = db.query(TechMermaid).filter(TechMermaid.id == mermaid_id, TechMermaid.technology_id == tech_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()


# ── Files ─────────────────────────────────────────────────────────────────────
@router.post("/{tech_id}/files", response_model=FileOut, status_code=201)
def upload_file(tech_id: str, body: FileUploadBody, db: Session = Depends(get_db)):
    if not db.query(Technology).filter(Technology.id == tech_id).first():
        raise HTTPException(404)
    file_bytes = base64.b64decode(body.file_base64)
    from datetime import datetime
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    s3_key = f"technologies/{tech_id}/{ts}_{body.filename}"
    try:
        s3 = _s3_client()
        s3.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=file_bytes, ContentType=body.content_type)
        public_url = f"{settings.S3_PUBLIC_URL}/{s3_key}"
    except Exception:
        # Fallback: save key as relative path (local mode without S3)
        public_url = f"/files/{s3_key}"

    obj = TechFile(
        technology_id=tech_id,
        filename=body.filename,
        s3_key=public_url,
        content_type=body.content_type,
        size_bytes=len(file_bytes),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{tech_id}/files/{file_id}", status_code=204)
def delete_file(tech_id: str, file_id: int, db: Session = Depends(get_db)):
    obj = db.query(TechFile).filter(TechFile.id == file_id, TechFile.technology_id == tech_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()

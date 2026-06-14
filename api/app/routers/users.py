import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import User

router = APIRouter(prefix="/users", tags=["users"])


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    status: str
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "analyst"
    department: str = ""
    status: str = "active"
    password: str = "changeme"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


@router.get("", response_model=List[UserOut])
def list_users(
    search: str = Query(""),
    role: str = Query(""),
    status: str = Query(""),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter((User.name.ilike(like)) | (User.email.ilike(like)))
    if role:
        q = q.filter(User.role == role)
    if status:
        q = q.filter(User.status == status)
    return q.order_by(User.name).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    obj = db.query(User).filter(User.id == user_id).first()
    if not obj:
        raise HTTPException(404, "Пользователь не найден")
    return obj


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    from passlib.hash import bcrypt
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email уже используется")
    obj = User(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        role=body.role,
        department=body.department,
        status=body.status,
        password_hash=bcrypt.hash(body.password),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, body: UserUpdate, db: Session = Depends(get_db)):
    obj = db.query(User).filter(User.id == user_id).first()
    if not obj:
        raise HTTPException(404, "Пользователь не найден")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    obj = db.query(User).filter(User.id == user_id).first()
    if not obj:
        raise HTTPException(404)
    db.delete(obj)
    db.commit()

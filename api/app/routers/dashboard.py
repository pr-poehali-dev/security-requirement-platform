from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Requirement, Architecture, Template,
    OrgDomain, TechDomain, Technology, User
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    req_total     = db.query(func.count(Requirement.id)).scalar() or 0
    arch_total    = db.query(func.count(Architecture.id)).scalar() or 0
    tpl_total     = db.query(func.count(Template.id)).scalar() or 0
    users_active  = db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0
    tech_total    = db.query(func.count(Technology.id)).scalar() or 0
    orgdom_total  = db.query(func.count(OrgDomain.id)).scalar() or 0
    techdom_total = db.query(func.count(TechDomain.id)).scalar() or 0

    req_by_severity = dict(
        db.query(Requirement.severity, func.count()).group_by(Requirement.severity).all()
    )
    arch_by_status = dict(
        db.query(Architecture.status, func.count()).group_by(Architecture.status).all()
    )
    req_by_status = dict(
        db.query(Requirement.status, func.count()).group_by(Requirement.status).all()
    )

    return {
        "requirements":    req_total,
        "architectures":   arch_total,
        "templates":       tpl_total,
        "active_users":    users_active,
        "technologies":    tech_total,
        "org_domains":     orgdom_total,
        "tech_domains":    techdom_total,
        "req_by_severity": req_by_severity,
        "arch_by_status":  arch_by_status,
        "req_by_status":   req_by_status,
    }

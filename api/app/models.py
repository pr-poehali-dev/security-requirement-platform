"""SQLAlchemy ORM models — совместимо с PostgreSQL и SQLite."""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, BigInteger, Text, DateTime,
    Enum as SAEnum, ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base


def _now():
    return datetime.now(timezone.utc)


# ─── Вспомогательный тип: BigInt совместимый с SQLite ────────────────────────
def BigInt():
    from .config import settings
    if settings.DATABASE_URL.startswith("sqlite"):
        return Integer()
    return BigInteger()


# ═══════════════════════════════════════════════════════════════════════════════
# ПОЛЬЗОВАТЕЛИ
# ═══════════════════════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"
    id          = Column(String(36), primary_key=True)
    name        = Column(String(200), nullable=False, default="")
    email       = Column(String(200), nullable=False, unique=True)
    role        = Column(SAEnum("admin","architect","analyst","observer", name="user_role"), nullable=False, default="analyst")
    department  = Column(String(200), default="")
    status      = Column(SAEnum("active","inactive","blocked", name="user_status"), nullable=False, default="active")
    password_hash = Column(String(256), nullable=False, default="")
    last_login  = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)


# ═══════════════════════════════════════════════════════════════════════════════
# ТРЕБОВАНИЯ
# ═══════════════════════════════════════════════════════════════════════════════
class Requirement(Base):
    __tablename__ = "requirements"
    id          = Column(String(20), primary_key=True)       # REQ-001
    title       = Column(String(500), nullable=False, default="")
    description = Column(Text, default="")
    category    = Column(String(200), default="")
    severity    = Column(SAEnum("critical","high","medium","low", name="req_severity"), nullable=False, default="medium")
    status      = Column(SAEnum("active","draft","review","archived", name="req_status"), nullable=False, default="draft")
    source      = Column(String(200), default="")
    version     = Column(Integer, nullable=False, default=1)
    created_by  = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    comments    = relationship("RequirementComment", back_populates="requirement", cascade="all, delete-orphan")
    links       = relationship("RequirementLink",    back_populates="requirement", cascade="all, delete-orphan")


class RequirementComment(Base):
    __tablename__ = "requirement_comments"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    requirement_id  = Column(String(20), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    text            = Column(Text, nullable=False)
    created_at      = Column(DateTime(timezone=True), default=_now)
    requirement     = relationship("Requirement", back_populates="comments")


class RequirementLink(Base):
    __tablename__ = "requirement_links"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    requirement_id  = Column(String(20), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    target_id       = Column(String(50), nullable=False)
    link_type       = Column(String(50), nullable=False)   # architecture, technology, template
    requirement     = relationship("Requirement", back_populates="links")
    __table_args__  = (UniqueConstraint("requirement_id", "target_id", "link_type"),)


# ═══════════════════════════════════════════════════════════════════════════════
# АРХИТЕКТУРЫ
# ═══════════════════════════════════════════════════════════════════════════════
class Architecture(Base):
    __tablename__ = "architectures"
    id          = Column(String(20), primary_key=True)       # ARCH-001
    title       = Column(String(500), nullable=False, default="")
    description = Column(Text, default="")
    category    = Column(String(200), default="")
    status      = Column(SAEnum("approved","review","draft", name="arch_status"), nullable=False, default="draft")
    author      = Column(String(200), default="")
    version     = Column(Integer, nullable=False, default=1)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    tags        = relationship("ArchitectureTag",         back_populates="architecture", cascade="all, delete-orphan")
    req_links   = relationship("ArchitectureRequirement", back_populates="architecture", cascade="all, delete-orphan")


class ArchitectureTag(Base):
    __tablename__ = "architecture_tags"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    architecture_id = Column(String(20), ForeignKey("architectures.id", ondelete="CASCADE"), nullable=False)
    tag             = Column(String(100), nullable=False)
    architecture    = relationship("Architecture", back_populates="tags")
    __table_args__  = (UniqueConstraint("architecture_id", "tag"),)


class ArchitectureRequirement(Base):
    __tablename__ = "architecture_requirements"
    id                  = Column(Integer, primary_key=True, autoincrement=True)
    architecture_id     = Column(String(20), ForeignKey("architectures.id", ondelete="CASCADE"), nullable=False)
    requirement_id      = Column(String(20), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    compliance_status   = Column(SAEnum("met","partial","not_met", name="compliance_status"), default="not_met")
    architecture        = relationship("Architecture", back_populates="req_links")
    __table_args__      = (UniqueConstraint("architecture_id", "requirement_id"),)


# ═══════════════════════════════════════════════════════════════════════════════
# ШАБЛОНЫ
# ═══════════════════════════════════════════════════════════════════════════════
class Template(Base):
    __tablename__ = "templates"
    id          = Column(String(20), primary_key=True)       # TPL-001
    title       = Column(String(500), nullable=False, default="")
    icon        = Column(String(50), default="FileText")
    description = Column(Text, default="")
    category    = Column(String(200), default="")
    complexity  = Column(SAEnum("high","medium","low", name="tpl_complexity"), nullable=False, default="medium")
    used_count  = Column(Integer, nullable=False, default=0)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    compliance  = relationship("TemplateCompliance", back_populates="template", cascade="all, delete-orphan")
    req_links   = relationship("TemplateRequirement", back_populates="template", cascade="all, delete-orphan")


class TemplateCompliance(Base):
    __tablename__ = "template_compliance"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    template_id     = Column(String(20), ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    standard_name   = Column(String(200), nullable=False)
    template        = relationship("Template", back_populates="compliance")
    __table_args__  = (UniqueConstraint("template_id", "standard_name"),)


class TemplateRequirement(Base):
    __tablename__ = "template_requirements"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    template_id     = Column(String(20), ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    requirement_id  = Column(String(20), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    order           = Column(Integer, default=0)
    template        = relationship("Template", back_populates="req_links")
    __table_args__  = (UniqueConstraint("template_id", "requirement_id"),)


# ═══════════════════════════════════════════════════════════════════════════════
# ОРГАНИЗАЦИОННЫЕ ДОМЕНЫ
# ═══════════════════════════════════════════════════════════════════════════════
class OrgDomain(Base):
    __tablename__ = "org_domains"
    id          = Column(String(30), primary_key=True)       # org-dom-001
    name        = Column(String(500), nullable=False, default="")
    owner       = Column(String(200), default="")
    status      = Column(SAEnum("active","dev","inactive","archived", name="domain_status"), nullable=False, default="dev")
    description = Column(Text, default="")
    version     = Column(Integer, nullable=False, default=1)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)


# ═══════════════════════════════════════════════════════════════════════════════
# ТЕХНИЧЕСКИЕ ДОМЕНЫ
# ═══════════════════════════════════════════════════════════════════════════════
class TechDomain(Base):
    __tablename__ = "tech_domains"
    id          = Column(String(30), primary_key=True)       # tech-dom-001
    name        = Column(String(500), nullable=False, default="")
    owner       = Column(String(200), default="")
    status      = Column(SAEnum("active","dev","inactive","archived", name="tech_domain_status"), nullable=False, default="dev")
    description = Column(Text, default="")
    version     = Column(Integer, nullable=False, default=1)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    org_links   = relationship("TechDomainOrgLink", back_populates="tech_domain", cascade="all, delete-orphan")


class TechDomainOrgLink(Base):
    __tablename__ = "tech_domain_org_links"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    tech_domain_id  = Column(String(30), ForeignKey("tech_domains.id", ondelete="CASCADE"), nullable=False)
    org_domain_id   = Column(String(30), ForeignKey("org_domains.id",  ondelete="CASCADE"), nullable=False)
    tech_domain     = relationship("TechDomain", back_populates="org_links")
    __table_args__  = (UniqueConstraint("tech_domain_id", "org_domain_id"),)


# ═══════════════════════════════════════════════════════════════════════════════
# ТЕХНОЛОГИИ
# ═══════════════════════════════════════════════════════════════════════════════
class Technology(Base):
    __tablename__ = "technologies"
    id          = Column(String(20), primary_key=True)       # tech-001
    name        = Column(String(500), nullable=False, default="")
    owner       = Column(String(200), default="")
    status      = Column(SAEnum("active","dev","inactive","archived", name="tech_status"), nullable=False, default="dev")
    description = Column(Text, default="")
    version     = Column(Integer, nullable=False, default=1)
    created_at  = Column(DateTime(timezone=True), default=_now)
    updated_at  = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    tags        = relationship("TechTag",     back_populates="technology", cascade="all, delete-orphan")
    files       = relationship("TechFile",    back_populates="technology", cascade="all, delete-orphan")
    mermaid     = relationship("TechMermaid", back_populates="technology", cascade="all, delete-orphan")


class TechTag(Base):
    __tablename__ = "tech_tags"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    technology_id   = Column(String(20), ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False)
    tag             = Column(String(100), nullable=False)
    technology      = relationship("Technology", back_populates="tags")


class TechFile(Base):
    __tablename__ = "tech_files"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    technology_id   = Column(String(20), ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False)
    filename        = Column(String(500), nullable=False)
    s3_key          = Column(String(1000), nullable=False)
    content_type    = Column(String(200), default="application/octet-stream")
    size_bytes      = Column(Integer, nullable=False, default=0)
    created_at      = Column(DateTime(timezone=True), default=_now)
    technology      = relationship("Technology", back_populates="files")


class TechMermaid(Base):
    __tablename__ = "tech_mermaid"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    technology_id   = Column(String(20), ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False)
    title           = Column(String(300), nullable=False, default="Схема")
    content         = Column(Text, nullable=False, default="")
    created_at      = Column(DateTime(timezone=True), default=_now)
    updated_at      = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    technology      = relationship("Technology", back_populates="mermaid")


# ═══════════════════════════════════════════════════════════════════════════════
# СЧЁТЧИКИ ID (эмуляция sequences для SQLite)
# ═══════════════════════════════════════════════════════════════════════════════
class IdCounter(Base):
    __tablename__ = "id_counters"
    name    = Column(String(50), primary_key=True)
    value   = Column(Integer, nullable=False, default=0)

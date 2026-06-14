"""Начальные данные для БД (мок-данные из фронтенда)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .models import (
    User, Requirement, Architecture, ArchitectureTag,
    Template, TemplateCompliance,
    OrgDomain, TechDomain, TechDomainOrgLink,
    IdCounter,
)


def _now():
    return datetime.now(timezone.utc)


def seed(db: Session):
    if db.query(User).count() > 0:
        return  # уже засеяно

    # ── Счётчики ID ──────────────────────────────────────────────────────────
    for name, value in [
        ("REQ", 10), ("ARCH", 5), ("TPL", 6),
        ("org-dom", 5), ("tech-dom", 4), ("tech", 0),
    ]:
        if not db.query(IdCounter).filter(IdCounter.name == name).first():
            db.add(IdCounter(name=name, value=value))

    # ── Пользователи ─────────────────────────────────────────────────────────
    from passlib.hash import bcrypt
    users = [
        User(id=str(uuid.uuid4()), name="А. Петров",  email="petrov@secarch.ru",   role="admin",    department="ИБ", status="active",   password_hash=bcrypt.hash("admin")),
        User(id=str(uuid.uuid4()), name="И. Смирнова",email="smirnova@secarch.ru", role="architect",department="Архитектура", status="active", password_hash=bcrypt.hash("pass")),
        User(id=str(uuid.uuid4()), name="М. Козлов",  email="kozlov@secarch.ru",   role="analyst",  department="ИБ", status="active",   password_hash=bcrypt.hash("pass")),
        User(id=str(uuid.uuid4()), name="В. Новиков", email="novikov@secarch.ru",  role="analyst",  department="ИТ", status="active",   password_hash=bcrypt.hash("pass")),
        User(id=str(uuid.uuid4()), name="Е. Соколова",email="sokolova@secarch.ru", role="observer", department="Аудит", status="active", password_hash=bcrypt.hash("pass")),
        User(id=str(uuid.uuid4()), name="Д. Федоров", email="fedorov@secarch.ru",  role="analyst",  department="ИТ", status="inactive", password_hash=bcrypt.hash("pass")),
    ]
    db.add_all(users)

    # ── Требования ────────────────────────────────────────────────────────────
    reqs = [
        Requirement(id="REQ-001", title="Многофакторная аутентификация",      category="Идентификация и аутентификация", severity="critical", status="active",   source="ГОСТ Р 57580", version=3),
        Requirement(id="REQ-002", title="Шифрование данных в покое",          category="Защита данных",                   severity="critical", status="active",   source="187-ФЗ",       version=2),
        Requirement(id="REQ-003", title="Разграничение прав доступа",         category="Управление доступом",             severity="high",     status="active",   source="ГОСТ Р 57580", version=4),
        Requirement(id="REQ-004", title="Ведение журнала аудита",             category="Мониторинг и аудит",              severity="high",     status="active",   source="PCI DSS",      version=2),
        Requirement(id="REQ-005", title="Сегментация сети",                   category="Сетевая безопасность",            severity="high",     status="draft",    source="CIS Controls", version=1),
        Requirement(id="REQ-006", title="Управление уязвимостями",            category="Безопасность ПО",                 severity="medium",   status="active",   source="ISO 27001",    version=2),
        Requirement(id="REQ-007", title="Резервное копирование данных",       category="Непрерывность бизнеса",           severity="medium",   status="active",   source="187-ФЗ",       version=1),
        Requirement(id="REQ-008", title="Защита от DDoS-атак",               category="Сетевая безопасность",            severity="medium",   status="review",   source="CIS Controls", version=1),
        Requirement(id="REQ-009", title="Антивирусная защита рабочих станций",category="Защита конечных точек",           severity="medium",   status="active",   source="ГОСТ Р 57580", version=2),
        Requirement(id="REQ-010", title="Политика надёжных паролей",          category="Идентификация и аутентификация",  severity="low",      status="active",   source="ISO 27001",    version=1),
    ]
    db.add_all(reqs)

    # ── Архитектуры ───────────────────────────────────────────────────────────
    archs = [
        Architecture(id="ARCH-001", title="Корпоративная сеть банка",    description="Типовая архитектура сети для финансовых организаций с DMZ, сегментацией и WAF", category="Финансовый сектор", status="approved", author="А. Петров",  version=3),
        Architecture(id="ARCH-002", title="Защита АСУ ТП",               description="Архитектура защиты автоматизированных систем управления технологическими процессами", category="КИИ",           status="approved", author="И. Смирнов", version=2),
        Architecture(id="ARCH-003", title="Облачная инфраструктура",     description="Гибридная облачная среда с контролем доступа, шифрованием и мониторингом",          category="Облачные сервисы",status="review",   author="М. Козлова", version=1),
        Architecture(id="ARCH-004", title="Удалённый доступ сотрудников",description="Безопасный удалённый доступ с MFA, VPN и контролем устройств",                       category="Корпоративный доступ", status="approved", author="А. Петров", version=2),
        Architecture(id="ARCH-005", title="Центр обработки данных (ЦОД)",description="Физическая и логическая защита дата-центра с мониторингом и резервированием",      category="ЦОД",            status="draft",    author="В. Новиков", version=1),
    ]
    db.add_all(archs)
    arch_tags = [
        ("ARCH-001", ["DMZ", "WAF", "Firewall", "SIEM"]),
        ("ARCH-002", ["ICS", "SCADA", "Air Gap", "КИИ"]),
        ("ARCH-003", ["Zero Trust", "IAM", "CASB"]),
        ("ARCH-004", ["VPN", "MFA", "EDR", "MDM"]),
        ("ARCH-005", ["Physical Security", "HA", "DR"]),
    ]
    for arch_id, tags in arch_tags:
        for tag in tags:
            db.add(ArchitectureTag(architecture_id=arch_id, tag=tag))

    # ── Шаблоны ───────────────────────────────────────────────────────────────
    tpls = [
        Template(id="TPL-001", title="Банк (Tier 1)",             icon="Building2",  description="Полный набор требований для банков первого уровня по ГОСТ Р 57580 и 382-П",                             category="Финансы",               complexity="high",   used_count=14),
        Template(id="TPL-002", title="КИИ (Категория 1)",         icon="Zap",        description="Требования для объектов критической информационной инфраструктуры первой категории",                    category="КИИ",                   complexity="high",   used_count=8),
        Template(id="TPL-003", title="Медицинская организация",   icon="HeartPulse", description="Защита персональных данных пациентов и медицинских информационных систем",                              category="Здравоохранение",       complexity="medium", used_count=22),
        Template(id="TPL-004", title="Государственные ИС (ГИС)", icon="Landmark",   description="Требования для государственных информационных систем по 149-ФЗ и требованиям ФСТЭК",                  category="Государственный сектор",complexity="high",   used_count=6),
        Template(id="TPL-005", title="Облачный провайдер",        icon="Cloud",      description="Минимальный набор требований для облачных платформ и SaaS-сервисов",                                    category="Облачные сервисы",      complexity="medium", used_count=31),
        Template(id="TPL-006", title="Малый и средний бизнес",    icon="Store",      description="Базовый набор мер ИБ для компаний без регуляторных требований",                                         category="МСБ",                   complexity="low",    used_count=87),
    ]
    db.add_all(tpls)
    tpl_compliance = [
        ("TPL-001", ["ГОСТ Р 57580", "382-П", "PCI DSS"]),
        ("TPL-002", ["187-ФЗ", "ФСТЭК", "ГосСОПКА"]),
        ("TPL-003", ["152-ФЗ", "ГОСТ Р 57580"]),
        ("TPL-004", ["149-ФЗ", "ФСТЭК", "ФСБ"]),
        ("TPL-005", ["ISO 27001", "SOC 2", "CSA STAR"]),
        ("TPL-006", ["CIS Controls", "ISO 27001"]),
    ]
    for tpl_id, standards in tpl_compliance:
        for s in standards:
            db.add(TemplateCompliance(template_id=tpl_id, standard_name=s))

    # ── Организационные домены ────────────────────────────────────────────────
    org_doms = [
        OrgDomain(id="org-dom-001", name="Корпоративный сегмент",     owner="А. Петров",  status="active",   description="Основной корпоративный домен организации", version=3),
        OrgDomain(id="org-dom-002", name="DMZ",                        owner="И. Смирнова",status="active",   description="Демилитаризованная зона",                  version=2),
        OrgDomain(id="org-dom-003", name="Технологический сегмент",   owner="М. Козлов",  status="dev",      description="АСУ ТП и технологические сети",             version=1),
        OrgDomain(id="org-dom-004", name="Партнёрский доступ",        owner="В. Новиков", status="inactive", description="Домен для внешних подключений",             version=1),
        OrgDomain(id="org-dom-005", name="Резервный сегмент",         owner="А. Петров",  status="archived", description="DR-сегмент (резервная площадка)",           version=2),
    ]
    db.add_all(org_doms)

    # ── Технические домены ────────────────────────────────────────────────────
    tech_doms = [
        TechDomain(id="tech-dom-001", name="Сеть периметра",        owner="А. Петров",  status="active",   description="Межсетевые экраны, WAF, IPS на периметре", version=2),
        TechDomain(id="tech-dom-002", name="Серверная инфраструктура",owner="И. Смирнова",status="active",  description="Виртуализация, серверы, СХД",              version=3),
        TechDomain(id="tech-dom-003", name="АСУ ТП",                owner="М. Козлов",  status="dev",      description="Промышленные контроллеры и SCADA-системы",  version=1),
        TechDomain(id="tech-dom-004", name="Резервная площадка",    owner="В. Новиков", status="inactive", description="DR-инфраструктура резервного ЦОД",          version=1),
    ]
    db.add_all(tech_doms)
    tech_dom_links = [
        ("tech-dom-001", ["org-dom-001", "org-dom-002"]),
        ("tech-dom-002", ["org-dom-001"]),
        ("tech-dom-003", ["org-dom-003"]),
        ("tech-dom-004", ["org-dom-004"]),
    ]
    for td_id, od_ids in tech_dom_links:
        for od_id in od_ids:
            db.add(TechDomainOrgLink(tech_domain_id=td_id, org_domain_id=od_id))

    db.commit()

"""Генератор ID совместимый с PostgreSQL и SQLite."""
from sqlalchemy.orm import Session
from .models import IdCounter


def next_id(db: Session, prefix: str, pad: int = 3) -> str:
    """Атомарно увеличивает счётчик и возвращает форматированный ID."""
    counter = db.query(IdCounter).filter(IdCounter.name == prefix).with_for_update().first()
    if counter is None:
        counter = IdCounter(name=prefix, value=1)
        db.add(counter)
    else:
        counter.value += 1
    db.flush()
    return f"{prefix}-{str(counter.value).zfill(pad)}"

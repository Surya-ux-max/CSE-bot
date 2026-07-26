import os
from datetime import datetime
from typing import Dict, Any, Type
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, DateTime, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

# SQLAlchemy Base
Base = declarative_base()

# Central Knowledge Registry Model
class KnowledgeRegistry(Base):
    __tablename__ = "knowledge_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    total_records = Column(Integer, default=0)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "table_name": self.table_name,
            "description": self.description,
            "total_records": self.total_records,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# Dynamic Sector Table Model Generator
_SECTOR_MODEL_CACHE: Dict[str, Type] = {}

def get_sector_model(table_name: str) -> Type:
    """
    Returns an ORM Model class specifically bound to the given table_name.
    Creates standard columns: id, section_title, content, metadata_json, version, is_active, effective_date, created_at, updated_at.
    """
    clean_name = table_name.lower().strip().replace("-", "_").replace(" ", "_")
    if clean_name in _SECTOR_MODEL_CACHE:
        return _SECTOR_MODEL_CACHE[clean_name]

    class_name = "".join(part.capitalize() for part in clean_name.split("_")) + "Model"

    def to_dict(self):
        return {
            "id": self.id,
            "section_title": self.section_title,
            "content": self.content,
            "metadata_json": self.metadata_json or {},
            "version": self.version,
            "is_active": self.is_active,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    attributes = {
        "__tablename__": clean_name,
        "__table_args__": {'extend_existing': True},
        "id": Column(Integer, primary_key=True, autoincrement=True),
        "section_title": Column(String(255), nullable=False),
        "content": Column(Text, nullable=False),
        "metadata_json": Column(JSON, nullable=True),
        "version": Column(Integer, default=1),
        "is_active": Column(Boolean, default=True),
        "effective_date": Column(DateTime, default=datetime.utcnow),
        "created_at": Column(DateTime, default=datetime.utcnow),
        "updated_at": Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow),
        "to_dict": to_dict
    }

    model_cls = type(class_name, (Base,), attributes)
    _SECTOR_MODEL_CACHE[clean_name] = model_cls
    return model_cls



# Database Engine & Session Initialization
db_url = DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Add SSL connect_args if connecting to remote PostgreSQL (e.g. Render, Supabase, Neon)
engine_kwargs = {"pool_pre_ping": True}
if "localhost" not in db_url and "127.0.0.1" not in db_url:
    engine_kwargs["connect_args"] = {"sslmode": "require"}

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



def init_db():
    """Creates all tables defined in Base."""
    Base.metadata.create_all(bind=engine)


def get_db_session():
    """Dependency helper to yield DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

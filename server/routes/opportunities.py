"""
routes/opportunities.py
Placement & Hackathon Hub endpoints: CRUD management for hackathons and placement opportunities.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Opportunities"])


# ==========================================================
# Pydantic Request Models
# ==========================================================

class HackathonCreateRequest(BaseModel):
    title: str
    description: str
    deadline: str
    apply_link: Optional[str] = None
    external_link: Optional[str] = None
    poster_url: Optional[str] = None
    status: Optional[str] = "Active"
    user_email: str
    user_role: str


class PlacementCreateRequest(BaseModel):
    title: str
    company: str
    description: str
    deadline: str
    apply_link: Optional[str] = None
    external_link: Optional[str] = None
    poster_url: Optional[str] = None
    status: Optional[str] = "Active"
    user_email: str
    user_role: str


# ==========================================================
# Hackathons Endpoints
# ==========================================================

@router.get("/hackathons")
def get_hackathons(status_filter: Optional[str] = "Active"):
    from db import get_db_session, Hackathon
    with get_db_session() as db:
        query = db.query(Hackathon)
        if status_filter and status_filter.lower() != "all":
            query = query.filter(Hackathon.status.ilike(status_filter))
        hackathons = query.order_by(Hackathon.created_at.desc()).all()
        return [h.to_dict() for h in hackathons]


@router.post("/hackathons")
def create_hackathon(payload: HackathonCreateRequest):
    from db import get_db_session, Hackathon
    from services.time_utils import get_ist_now, get_ist_str

    role = payload.user_role.strip().lower()
    if role not in ("faculty", "placement_cell"):
        raise HTTPException(status_code=403, detail="Only Faculty and Placement Cell are authorized to post hackathons.")

    ist_now = get_ist_now()
    with get_db_session() as db:
        new_h = Hackathon(
            title=payload.title.strip(),
            description=payload.description.strip(),
            deadline=payload.deadline.strip(),
            apply_link=payload.apply_link.strip() if payload.apply_link else None,
            external_link=payload.external_link.strip() if payload.external_link else None,
            poster_url=payload.poster_url.strip() if payload.poster_url else None,
            status=payload.status.strip() if payload.status else "Active",
            created_at=ist_now,
            ist_date_time=get_ist_str(ist_now)
        )
        db.add(new_h)
        db.commit()
        db.refresh(new_h)
        return new_h.to_dict()


@router.delete("/hackathons/{hackathon_id}")
def delete_hackathon(hackathon_id: int, role: str):
    from db import get_db_session, Hackathon
    if role.strip().lower() not in ("faculty", "placement_cell"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    with get_db_session() as db:
        h = db.query(Hackathon).filter(Hackathon.id == hackathon_id).first()
        if not h:
            raise HTTPException(status_code=404, detail="Hackathon not found")
        db.delete(h)
        db.commit()
        return {"status": "success", "message": f"Hackathon {hackathon_id} deleted"}


# ==========================================================
# Placements Endpoints
# ==========================================================

@router.get("/placements")
def get_placements(status_filter: Optional[str] = "Active"):
    from db import get_db_session, Placement
    with get_db_session() as db:
        query = db.query(Placement)
        if status_filter and status_filter.lower() != "all":
            query = query.filter(Placement.status.ilike(status_filter))
        placements = query.order_by(Placement.created_at.desc()).all()
        return [p.to_dict() for p in placements]


@router.post("/placements")
def create_placement(payload: PlacementCreateRequest):
    from db import get_db_session, Placement
    from services.time_utils import get_ist_now, get_ist_str

    role = payload.user_role.strip().lower()
    if role not in ("faculty", "placement_cell"):
        raise HTTPException(status_code=403, detail="Only Faculty and Placement Cell are authorized to post placement drives.")

    ist_now = get_ist_now()
    with get_db_session() as db:
        new_p = Placement(
            title=payload.title.strip(),
            company=payload.company.strip(),
            description=payload.description.strip(),
            deadline=payload.deadline.strip(),
            apply_link=payload.apply_link.strip() if payload.apply_link else None,
            external_link=payload.external_link.strip() if payload.external_link else None,
            poster_url=payload.poster_url.strip() if payload.poster_url else None,
            status=payload.status.strip() if payload.status else "Active",
            created_at=ist_now,
            ist_date_time=get_ist_str(ist_now)
        )
        db.add(new_p)
        db.commit()
        db.refresh(new_p)
        return new_p.to_dict()


@router.delete("/placements/{placement_id}")
def delete_placement(placement_id: int, role: str):
    from db import get_db_session, Placement
    if role.strip().lower() not in ("faculty", "placement_cell"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    with get_db_session() as db:
        p = db.query(Placement).filter(Placement.id == placement_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Placement drive not found")
        db.delete(p)
        db.commit()
        return {"status": "success", "message": f"Placement {placement_id} deleted"}

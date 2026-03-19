"""Users/Entities routes"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional

from schemas.users import UserEntity, UserEntityUpdate
from models.data_store import users_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserEntity])
async def get_users(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None
):
    """Get users/entities with optional filtering"""
    users = users_db.copy()
    
    if search:
        search_lower = search.lower()
        users = [
            u for u in users
            if search_lower in u.name.lower() or
            search_lower in u.email.lower()
        ]
    if department:
        users = [u for u in users if u.department == department]
    if status:
        users = [u for u in users if u.status == status]
    
    return users


@router.get("/{user_id}", response_model=UserEntity)
async def get_user(user_id: str):
    """Get a specific user/entity"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserEntity)
async def update_user(user_id: str, updates: UserEntityUpdate):
    """Update a user/entity"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = updates.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    return user


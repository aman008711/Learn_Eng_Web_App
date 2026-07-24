from typing import Optional, Any, Dict, Union
import uuid
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.core.security import get_password_hash

class UserRepository:
    def get_by_id(self, db: Session, user_id: Union[uuid.UUID, str]) -> Optional[User]:
        return db.query(User).filter(User.id == str(user_id)).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, email: str, password: str) -> User:
        db_obj = User(
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: User, update_data: Union[Dict[str, Any], Any]) -> User:
        if isinstance(update_data, dict):
            update_dict = update_data
        else:
            update_dict = update_data.model_dump(exclude_unset=True)
        
        if "password" in update_dict:
            update_dict["hashed_password"] = get_password_hash(update_dict.pop("password"))
            
        for field in update_dict:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_dict[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

user_repo = UserRepository()

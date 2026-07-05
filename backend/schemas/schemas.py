from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "citizen" # citizen | officer

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    title: str
    description: str
    location_name: str
    latitude: float
    longitude: float
    waste_type: str = "mixed" # plastic, organic, etc.
    image_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdateStatus(BaseModel):
    status: str # submitted | under_review | truck_assigned | in_progress | completed
    assigned_truck_id: Optional[int] = None
    priority: Optional[str] = None # low | medium | high

class ComplaintResponse(ComplaintBase):
    id: int
    citizen_id: int
    status: str
    priority: str
    priority_score: float
    assigned_truck_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Truck Schemas ---
class TruckBase(BaseModel):
    vehicle_number: str
    driver_name: str
    status: str = "idle" # idle | active | maintenance
    current_latitude: float
    current_longitude: float

class TruckCreate(TruckBase):
    pass

class TruckResponse(TruckBase):
    id: int
    route_data: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Bin Schemas ---
class BinBase(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    bin_type: str = "general" # general | recycling | e-waste
    capacity_liters: float = 100.0
    current_fill_level: float = 0.0

class BinCreate(BinBase):
    pass

class BinResponse(BinBase):
    id: int
    last_emptied_at: datetime

    class Config:
        from_attributes = True


# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Chat/Recycling Query ---
class ChatMessage(BaseModel):
    sender: str # user | assistant
    message: str

class ChatQuery(BaseModel):
    message: str
    history: List[ChatMessage] = []

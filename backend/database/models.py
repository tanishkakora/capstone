import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="citizen") # citizen, officer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="[Complaint.citizen_id]")
    notifications = relationship("Notification", back_populates="user")


class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bin_type = Column(String, default="general") # general, recycling, e-waste
    capacity_liters = Column(Float, default=100.0)
    current_fill_level = Column(Float, default=0.0) # 0 to 100 percentage
    last_emptied_at = Column(DateTime, default=datetime.datetime.utcnow)


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True, nullable=False)
    driver_name = Column(String, nullable=False)
    status = Column(String, default="idle") # idle, active, maintenance
    current_latitude = Column(Float, nullable=False)
    current_longitude = Column(Float, nullable=False)
    route_data = Column(Text, nullable=True) # JSON coordinates array
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="assigned_truck")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    waste_type = Column(String, default="mixed") # plastic, paper, organic, glass, metal, e-waste, mixed
    image_url = Column(String, nullable=True)
    status = Column(String, default="submitted") # submitted, under_review, truck_assigned, in_progress, completed
    priority = Column(String, default="low") # low, medium, high
    priority_score = Column(Float, default=0.0)
    assigned_truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    assigned_truck = relationship("Truck", back_populates="complaints")


class AgentMemory(Base):
    __tablename__ = "agent_memory"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, nullable=False)
    context_key = Column(String, nullable=False)
    context_value = Column(Text, nullable=False) # JSON-serialized string
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")

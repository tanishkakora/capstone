import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import User, Complaint, Bin, Truck, Notification
from backend.schemas.schemas import (
    UserCreate, UserResponse, Token, ComplaintCreate, ComplaintResponse, 
    ComplaintUpdateStatus, BinCreate, BinResponse, TruckCreate, TruckResponse,
    NotificationResponse, ChatQuery, ChatMessage
)
from backend.auth.auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_officer
)
from backend.agents.agent_orchestrator import run_agent_pipeline

router = APIRouter()
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- AUTHENTICATION ---

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to SmartWaste AI!",
        message=f"Hi {new_user.full_name}, thank you for joining our smart waste initiative! You can now report waste issues in your area."
    )
    db.add(welcome_notif)
    db.commit()
    
    return new_user


@router.post("/auth/login", response_model=Token)
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # OAuth2PasswordBearer sends username, but we map it to email
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email
    }


# --- COMPLAINTS ---

@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_complaint = Complaint(
        citizen_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        location_name=complaint_in.location_name,
        latitude=complaint_in.latitude,
        longitude=complaint_in.longitude,
        waste_type=complaint_in.waste_type,
        image_url=complaint_in.image_url,
        status="submitted",
        priority="low"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Create notification for submission
    sub_notif = Notification(
        user_id=current_user.id,
        title="Complaint Submitted Successfully",
        message=f"Your complaint '{new_complaint.title}' has been submitted and is queued for AI evaluation."
    )
    db.add(sub_notif)
    db.commit()
    
    # Trigger multi-agent pipeline immediately in the background / synchronously for this phase
    updated_complaint = run_agent_pipeline(new_complaint.id, db)
    return updated_complaint if updated_complaint else new_complaint


@router.get("/complaints/my", response_model=List[ComplaintResponse])
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Complaint).filter(Complaint.citizen_id == current_user.id).order_by(Complaint.created_at.desc()).all()


@router.get("/complaints/all", response_model=List[ComplaintResponse])
def get_all_complaints(
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    return db.query(Complaint).order_by(Complaint.priority_score.desc(), Complaint.created_at.desc()).all()


@router.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_details(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Citizens can only view their own complaints, officers can view all
    if current_user.role != "officer" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
        
    return complaint


@router.put("/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    updates: ComplaintUpdateStatus,
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.status = updates.status
    if updates.assigned_truck_id is not None:
        complaint.assigned_truck_id = updates.assigned_truck_id
        
        # Create notification for citizen
        truck = db.query(Truck).filter(Truck.id == updates.assigned_truck_id).first()
        truck_info = f"Truck {truck.vehicle_number}" if truck else "a collection truck"
        notif = Notification(
            user_id=complaint.citizen_id,
            title="Truck Assigned to Complaint",
            message=f"Good news! {truck_info} has been assigned to address your complaint: '{complaint.title}'."
        )
        db.add(notif)
        
    if updates.priority is not None:
        complaint.priority = updates.priority
        
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    
    # Notify when completed
    if updates.status == "completed":
        comp_notif = Notification(
            user_id=complaint.citizen_id,
            title="Complaint Resolved!",
            message=f"Your reported issue '{complaint.title}' has been successfully collected and resolved."
        )
        db.add(comp_notif)
        db.commit()
        
    return complaint


@router.post("/complaints/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Standard security check for images
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only image files are allowed (.jpg, .jpeg, .png, .webp)")
        
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    # Return path accessible statically
    return {"url": f"/uploads/{unique_filename}"}


# --- BINS ---

@router.get("/bins", response_model=List[BinResponse])
def get_bins(db: Session = Depends(get_db)):
    return db.query(Bin).all()


@router.post("/bins", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(
    bin_in: BinCreate,
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    new_bin = Bin(
        location_name=bin_in.location_name,
        latitude=bin_in.latitude,
        longitude=bin_in.longitude,
        bin_type=bin_in.bin_type,
        capacity_liters=bin_in.capacity_liters,
        current_fill_level=bin_in.current_fill_level
    )
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin


# --- TRUCKS ---

@router.get("/trucks", response_model=List[TruckResponse])
def get_trucks(db: Session = Depends(get_db)):
    return db.query(Truck).all()


@router.post("/trucks", response_model=TruckResponse, status_code=status.HTTP_201_CREATED)
def create_truck(
    truck_in: TruckCreate,
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    new_truck = Truck(
        vehicle_number=truck_in.vehicle_number,
        driver_name=truck_in.driver_name,
        status=truck_in.status,
        current_latitude=truck_in.current_latitude,
        current_longitude=truck_in.current_longitude
    )
    db.add(new_truck)
    db.commit()
    db.refresh(new_truck)
    return new_truck


# --- NOTIFICATIONS ---

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()


@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"status": "success"}


# --- CHAT ASSISTANT ---

@router.post("/assistant/chat")
def chat_assistant(
    query: ChatQuery,
    current_user: User = Depends(get_current_user)
):
    # Default fallback recycling advice if Gemini API fails or is not connected
    user_msg = query.message.lower()
    
    reply = "I'm SmartWaste AI recycling assistant! You can ask me how to dispose of plastic, cardboard, electronics, metals, and biological items."
    
    if "plastic" in user_msg:
        reply = "Plastic bottles (PET 1) and containers (HDPE 2) can be recycled in the green recycling bin. Please rinse them first and remove caps."
    elif "paper" in user_msg or "box" in user_msg or "cardboard" in user_msg:
        reply = "Clean cardboard, newspapers, and printing paper are highly recyclable! Flatten cardboard boxes and place them in the recycling bin. Avoid wet or greasy boxes (like pizza boxes) as they contaminate paper batches."
    elif "metal" in user_msg or "can" in user_msg or "aluminum" in user_msg:
        reply = "Aluminum and steel cans are infinitely recyclable! Rinse them out and put them in the recycling bin. Foil can be recycled if clean and rolled into a ball."
    elif "glass" in user_msg or "bottle" in user_msg:
        reply = "Glass bottles and jars are recyclable. Separate them by color if possible. Do NOT mix drinking glasses, window glass, or mirrors in the recycle bin as they melt at different temperatures."
    elif "e-waste" in user_msg or "battery" in user_msg or "phone" in user_msg or "electronic" in user_msg:
        reply = "Electronics and batteries contain heavy metals and toxic chemicals. Never throw them in general waste. Please place them in dedicated E-Waste Bins or take them to a certified municipal drop-off center."
    elif "organic" in user_msg or "food" in user_msg or "vegetable" in user_msg or "waste" in user_msg:
        reply = "Organic food scraps and yard trimmings can be composted to create nutrient-rich soil. Avoid putting meat, dairy, or oils in normal compost bins to prevent pests. Place them in organic collections."

    # Return a structured response
    return {"reply": reply}

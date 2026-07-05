import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database.db import engine, Base, SessionLocal
from backend.database.models import User, Bin, Truck
from backend.auth.auth import get_password_hash
from backend.api.routes import router as api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smartwaste")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartWaste AI API",
    description="Multi-Agent Intelligent Waste Collection & Route Optimization System Backend",
    version="1.0.0"
)

# Enable CORS for frontend application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose local file uploads statically
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routes
app.include_router(api_router, prefix="/api")


# --- DATA SEEDING ---

@app.on_event("startup")
def seed_database():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(User).count() > 0:
            logger.info("Database already initialized, skipping seeding.")
            return

        logger.info("Seeding database with initial SmartWaste AI data...")

        # 1. Seed Users
        citizen_pwd = get_password_hash("password123")
        officer_pwd = get_password_hash("password123")

        citizen = User(
            email="citizen@smartwaste.ai",
            hashed_password=citizen_pwd,
            full_name="John Citizen",
            role="citizen"
        )
        officer = User(
            email="officer@smartwaste.ai",
            hashed_password=officer_pwd,
            full_name="Officer Jane",
            role="officer"
        )
        db.add_all([citizen, officer])
        db.commit()

        # 2. Seed Bins (Centered around Bangalore coordinates)
        bins = [
            Bin(
                location_name="MG Road Metro Station",
                latitude=12.9756,
                longitude=77.6068,
                bin_type="general",
                capacity_liters=120.0,
                current_fill_level=75.0
            ),
            Bin(
                location_name="Koramangala 3rd Block Park",
                latitude=12.9343,
                longitude=77.6210,
                bin_type="recycling",
                capacity_liters=150.0,
                current_fill_level=40.0
            ),
            Bin(
                location_name="Indiranagar 100 Feet Rd Shopping District",
                latitude=12.9620,
                longitude=77.6380,
                bin_type="e-waste",
                capacity_liters=80.0,
                current_fill_level=15.0
            ),
            Bin(
                location_name="Brigade Road Crossing",
                latitude=12.9730,
                longitude=77.6080,
                bin_type="general",
                capacity_liters=120.0,
                current_fill_level=92.0 # Close to overflow
            )
        ]
        db.add_all(bins)
        db.commit()

        # 3. Seed Trucks
        trucks = [
            Truck(
                vehicle_number="KA-01-EA-1234",
                driver_name="Ramesh Kumar",
                status="idle",
                current_latitude=12.9700,
                current_longitude=77.6000
            ),
            Truck(
                vehicle_number="KA-03-MB-5678",
                driver_name="Suresh Patel",
                status="active",
                current_latitude=12.9500,
                current_longitude=77.6200
            )
        ]
        db.add_all(trucks)
        db.commit()

        logger.info("Database seeding completed successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
def read_root():
    return {
        "name": "SmartWaste AI API",
        "description": "Multi-Agent waste tracking and routing platform.",
        "status": "online"
    }

import math
import logging
from sqlalchemy.orm import Session
from backend.database.models import Complaint, AgentMemory

logger = logging.getLogger(__name__)

# List of coordinates representing public institutions in the Bangalore simulation zone
PUBLIC_LANDMARKS = [
    {"name": "City General Hospital", "latitude": 12.9600, "longitude": 77.6100, "weight": 2.5},
    {"name": "Greenwood High School", "latitude": 12.9800, "longitude": 77.6200, "weight": 2.0},
    {"name": "Central Metro Station", "latitude": 12.9750, "longitude": 77.6050, "weight": 1.5}
]

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points in meters.
    """
    R = 6371000  # radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi_1) * math.cos(phi_2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class PriorityAgent:
    """
    Priority Agent: Calculates complaint priority based on:
    - Urgency indicators (overflow, leak, smell)
    - Proximity to schools, hospitals, metro stations
    - Density of active complaints in the same location
    - History of complaints at the same location (Memory)
    """
    def __init__(self):
        pass

    def process(self, complaint_id: int, is_urgent: bool, db: Session) -> dict:
        logger.info(f"PriorityAgent calculating priority score for complaint {complaint_id}...")
        
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"priority": "low", "priority_score": 1.0}

        score = 1.0

        # 1. Base urgency from Intake analysis
        if is_urgent:
            score += 3.0
            logger.info("Priority +3.0: Urgent keywords flagged by Intake.")

        # 2. Check proximity to public institutions (hospitals/schools)
        for landmark in PUBLIC_LANDMARKS:
            distance = calculate_haversine_distance(
                complaint.latitude, complaint.longitude,
                landmark["latitude"], landmark["longitude"]
            )
            # If within 500 meters, apply additional weight
            if distance < 500:
                score += landmark["weight"]
                logger.info(f"Priority +{landmark['weight']}: Proximity to {landmark['name']} ({distance:.1f}m).")

        # 3. Check complaint density in SQLite
        same_loc_count = db.query(Complaint).filter(
            Complaint.location_name == complaint.location_name,
            Complaint.id != complaint_id,
            Complaint.status != "completed"
        ).count()
        if same_loc_count > 0:
            density_bonus = min(same_loc_count * 0.75, 3.0)
            score += density_bonus
            logger.info(f"Priority +{density_bonus}: regional density found ({same_loc_count} active complaints nearby).")

        # 4. Check shared Agent Memory for repeat complaints (past history)
        memory_key = f"location_history_{complaint.location_name.replace(' ', '_')}"
        past_record = db.query(AgentMemory).filter(AgentMemory.context_key == memory_key).first()
        if past_record:
            score += 1.5
            logger.info("Priority +1.5: Repeat overflow hotspot flagged by Agent Memory.")

        # Cap priority score at 10.0
        final_score = min(score, 10.0)

        # Categorize
        if final_score >= 6.5:
            priority_label = "high"
        elif final_score >= 3.5:
            priority_label = "medium"
        else:
            priority_label = "low"

        logger.info(f"Calculated final priority score: {final_score:.1f} (Category: {priority_label})")

        return {
            "priority": priority_label,
            "priority_score": final_score
        }

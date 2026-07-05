import os
import logging
from sqlalchemy.orm import Session
from backend.database.models import Complaint
from backend.agents.complaint_agent import ComplaintIntakeAgent
from backend.agents.classification_agent import WasteClassificationAgent
from backend.agents.priority_agent import PriorityAgent
from backend.agents.route_agent import RouteOptimizationAgent
from backend.agents.analytics_agent import AnalyticsAgent

logger = logging.getLogger(__name__)

# Initialize agent instances
intake_agent = ComplaintIntakeAgent()
classification_agent = WasteClassificationAgent()
priority_agent = PriorityAgent()
route_agent = RouteOptimizationAgent()
analytics_agent = AnalyticsAgent()

def run_agent_pipeline(complaint_id: int, db: Session):
    """
    Orchestrated multi-agent workflow:
    Citizen Complaint -> Intake Agent -> Waste Classification Agent -> Priority Agent -> Route Agent -> Analytics Agent
    """
    logger.info(f"Triggering Orchestrated multi-agent pipeline for complaint ID {complaint_id}...")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        logger.error(f"Complaint {complaint_id} not found in database.")
        return None

    try:
        # Step 1: Intake Agent - clean text and parse landmarks/urgency
        intake_res = intake_agent.process(complaint.description)
        is_urgent = intake_res.get("is_urgent", False)
        complaint.description = intake_res.get("cleaned_description", complaint.description)
        logger.info(f"Step 1 (Intake) complete. Cleaned description length: {len(complaint.description)}")

        # Step 2: Classification Agent - classify waste type (multimodal if image available)
        image_local_path = None
        if complaint.image_url:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # d:\capstone\backend
            clean_url = complaint.image_url.lstrip('/')
            image_local_path = os.path.join(base_dir, clean_url)
            logger.info(f"Locating local image file: {image_local_path}")

        class_res = classification_agent.process(complaint.description, image_local_path)
        complaint.waste_type = class_res.get("waste_type", "mixed")
        # Log recycling recommendations (could be saved in database, or printed in logs)
        logger.info(f"Step 2 (Classification) complete. Type: {complaint.waste_type}")

        # Step 3: Priority Agent - dynamic prioritization scoring
        priority_res = priority_agent.process(complaint.id, is_urgent, db)
        complaint.priority = priority_res.get("priority", "low")
        complaint.priority_score = float(priority_res.get("priority_score", 1.0))
        complaint.status = "under_review" # Ready for municipal review / auto assignment
        db.commit()
        db.refresh(complaint)
        logger.info(f"Step 3 (Priority) complete. Score: {complaint.priority_score:.1f} ({complaint.priority})")

        # Step 4: Route Optimization Agent - dispatch assignment & TSP route updates
        route_res = route_agent.optimize_routes(db)
        logger.info(f"Step 4 (Route Planner) complete: {route_res}")

        # Step 5: Analytics Agent - aggregate and update shared memory
        analytics_res = analytics_agent.run_aggregations(db)
        logger.info("Step 5 (Analytics) complete. Shared memory updated.")

        # Re-fetch final complaint state
        db.refresh(complaint)
        logger.info(f"Multi-agent orchestration successfully completed for complaint ID {complaint_id}.")
        return complaint

    except Exception as e:
        logger.error(f"Error executing multi-agent pipeline for complaint {complaint_id}: {e}", exc_info=True)
        # Safe fallback status to ensure the API never hangs/crashes
        complaint.status = "submitted"
        db.commit()
        return complaint

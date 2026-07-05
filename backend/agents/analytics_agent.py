import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from backend.database.models import Complaint, Bin, AgentMemory

logger = logging.getLogger(__name__)

class AnalyticsAgent:
    """
    Analytics Agent: Aggregates collection efficiency metrics and stores 
    historic waste patterns and regional hotspot statistics inside the 
    persistent database shared memory.
    """
    def __init__(self):
        pass

    def run_aggregations(self, db: Session) -> dict:
        logger.info("AnalyticsAgent aggregating city metrics and updating agent memory...")

        # 1. Fetch complaints and bins
        all_complaints = db.query(Complaint).all()
        all_bins = db.query(Bin).all()

        total = len(all_complaints)
        resolved = len([c for c in all_complaints if c.status == "completed"])
        pending = total - resolved

        # Distribution count
        distribution = {}
        for c in all_complaints:
            t = c.waste_type or "mixed"
            distribution[t] = distribution.get(t, 0) + 1

        # Hotspots: count by location
        hotspots = {}
        for c in all_complaints:
            loc = c.location_name
            hotspots[loc] = hotspots.get(loc, 0) + 1

        # Store hotspots in memory so PriorityAgent can query it
        for loc, count in hotspots.items():
            if count >= 2: # Significant hotspot
                memory_key = f"location_history_{loc.replace(' ', '_')}"
                
                # Check if memory already exists
                memory_record = db.query(AgentMemory).filter(AgentMemory.context_key == memory_key).first()
                
                memory_data = {
                    "location_name": loc,
                    "incident_count": count,
                    "last_recorded_alert": datetime.utcnow().isoformat(),
                    "overflow_frequency_class": "high" if count >= 4 else "medium"
                }

                if memory_record:
                    memory_record.context_value = json.dumps(memory_data)
                else:
                    new_memory = AgentMemory(
                        agent_name="analytics_agent",
                        context_key=memory_key,
                        context_value=json.dumps(memory_data)
                    )
                    db.add(new_memory)
                logger.info(f"Updated shared memory for hotspot location: {loc} ({count} reports)")

        # 2. General KPI stats summary saving
        kpi_summary = {
            "total_incidents": total,
            "resolved_incidents": resolved,
            "pending_incidents": pending,
            "efficiency_rate": (resolved / total * 100) if total > 0 else 100.0,
            "waste_distribution": distribution,
            "hotspots_ranking": hotspots,
            "last_updated": datetime.utcnow().isoformat()
        }

        kpi_memory_record = db.query(AgentMemory).filter(AgentMemory.context_key == "global_kpi_stats").first()
        if kpi_memory_record:
            kpi_memory_record.context_value = json.dumps(kpi_summary)
        else:
            new_kpi_memory = AgentMemory(
                agent_name="analytics_agent",
                context_key="global_kpi_stats",
                context_value=json.dumps(kpi_summary)
            )
            db.add(new_kpi_memory)

        db.commit()
        logger.info("Global KPI analytics stored successfully in Agent Memory.")
        return kpi_summary

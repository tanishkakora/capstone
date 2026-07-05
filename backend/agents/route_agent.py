import json
import logging
from sqlalchemy.orm import Session
from backend.database.models import Truck, Complaint
from backend.agents.priority_agent import calculate_haversine_distance

logger = logging.getLogger(__name__)

class RouteOptimizationAgent:
    """
    Route Optimization Agent: Assigns unassigned waste complaints to the nearest 
    active truck, and resolves the Traveling Salesperson Problem (TSP) using a 
    Nearest-Neighbor tour starting from the truck's coordinates.
    """
    def __init__(self):
        pass

    def optimize_routes(self, db: Session) -> dict:
        logger.info("RouteOptimizationAgent recalculating truck paths...")

        # 1. Fetch active trucks and pending complaints
        trucks = db.query(Truck).filter(Truck.status != "maintenance").all()
        active_complaints = db.query(Complaint).filter(Complaint.status != "completed").all()

        if not trucks:
            logger.warning("No active trucks available for route optimization.")
            return {"status": "skipped", "message": "No active trucks"}

        # 2. Assign unassigned complaints to the nearest truck
        for comp in active_complaints:
            if comp.assigned_truck_id is None:
                # Find closest truck
                closest_truck = None
                min_distance = float('inf')
                
                for truck in trucks:
                    distance = calculate_haversine_distance(
                        comp.latitude, comp.longitude,
                        truck.current_latitude, truck.current_longitude
                    )
                    if distance < min_distance:
                        min_distance = distance
                        closest_truck = truck
                
                if closest_truck:
                    comp.assigned_truck_id = closest_truck.id
                    if comp.status in ["submitted", "under_review"]:
                        comp.status = "truck_assigned"
                    logger.info(f"Assigned complaint {comp.id} to nearest Truck {closest_truck.vehicle_number} (distance: {min_distance:.1f}m)")

        # 3. For each truck, compute the Nearest-Neighbor TSP path
        updates_count = 0
        for truck in trucks:
            # Find all active complaints assigned to this truck
            truck_comps = [c for c in active_complaints if c.assigned_truck_id == truck.id]
            
            if not truck_comps:
                truck.route_data = None
                continue

            # TSP Nearest-Neighbor solver
            current_lat = truck.current_latitude
            current_lng = truck.current_longitude
            unvisited = list(truck_comps)
            ordered_path = []

            while unvisited:
                closest_comp = None
                min_dist = float('inf')
                
                for comp in unvisited:
                    dist = calculate_haversine_distance(
                        current_lat, current_lng,
                        comp.latitude, comp.longitude
                    )
                    if dist < min_dist:
                        min_dist = dist
                        closest_comp = comp
                
                if closest_comp:
                    ordered_path.append([closest_comp.latitude, closest_comp.longitude])
                    current_lat = closest_comp.latitude
                    current_lng = closest_comp.longitude
                    unvisited.remove(closest_comp)

            # Store the computed route coordinate array as a JSON string
            truck.route_data = json.dumps(ordered_path)
            updates_count += 1
            logger.info(f"Optimized route for Truck {truck.vehicle_number} with {len(ordered_path)} stops.")

        db.commit()
        return {"status": "success", "trucks_optimized": updates_count}

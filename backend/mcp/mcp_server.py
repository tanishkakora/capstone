import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Sequence
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.server.models import InitializationOptions
import mcp.types as types
from backend.database.db import SessionLocal
from backend.database.models import Bin, Complaint, Truck
from backend.agents.priority_agent import calculate_haversine_distance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_server")

# Define MCP Server instance
server = Server("SmartWaste_MCP_Server")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


@server.list_tools()
async def list_tools() -> List[types.Tool]:
    """
    List available MCP tools for the agent cluster.
    """
    return [
        types.Tool(
            name="query_database_bins",
            description="Queries all municipal bins from the SQLite database and returns location type and fill levels.",
            inputSchema={
                "type": "object",
                "properties": {},
            }
        ),
        types.Tool(
            name="query_database_complaints",
            description="Queries active citizen waste reports from the SQLite database. Can optionally filter by status (e.g. submitted, under_review, truck_assigned, completed).",
            inputSchema={
                "type": "object",
                "properties": {
                    "status_filter": {
                        "type": "string",
                        "description": "Status to filter reports by"
                    }
                }
            }
        ),
        types.Tool(
            name="file_system_write_report",
            description="Writes generated analytics files, log logs, or municipal reports to the local file system.",
            inputSchema={
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Output filename (e.g., report_daily.txt)"
                    },
                    "report_content": {
                        "type": "string",
                        "description": "Contents of the report file"
                    }
                },
                "required": ["filename", "report_content"]
            }
        ),
        types.Tool(
            name="mapping_calculate_route_matrix",
            description="Calculates the distance matrix and stops visitation order coordinates for a specific collection truck.",
            inputSchema={
                "type": "object",
                "properties": {
                    "truck_id": {
                        "type": "integer",
                        "description": "ID of the truck to calculate coordinates routing for"
                    }
                },
                "required": ["truck_id"]
            }
        ),
        types.Tool(
            name="analytics_detect_hotspots",
            description="Aggregates and counts spatial waste occurrences to determine high risk overflow regions.",
            inputSchema={
                "type": "object",
                "properties": {},
            }
        )
    ]


@server.call_tool()
async def call_tool(
    name: str, arguments: Dict[str, Any]
) -> Sequence[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Execute tool handler logic based on name and input arguments.
    """
    logger.info(f"Executing MCP Tool: {name} with arguments: {arguments}")

    if name == "query_database_bins":
        db = SessionLocal()
        try:
            bins = db.query(Bin).all()
            bins_data = [
                {
                    "id": b.id,
                    "location": b.location_name,
                    "type": b.bin_type,
                    "fill_level": f"{b.current_fill_level}%",
                    "capacity": f"{b.capacity_liters}L"
                }
                for b in bins
            ]
            return [types.TextContent(type="text", text=json.dumps(bins_data, indent=2))]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error: {str(e)}")]
        finally:
            db.close()

    elif name == "query_database_complaints":
        status_filter = arguments.get("status_filter")
        db = SessionLocal()
        try:
            query = db.query(Complaint)
            if status_filter:
                query = query.filter(Complaint.status == status_filter)
            complaints = query.all()
            complaints_data = [
                {
                    "id": c.id,
                    "title": c.title,
                    "location": c.location_name,
                    "waste_type": c.waste_type,
                    "priority": c.priority,
                    "priority_score": c.priority_score,
                    "status": c.status
                }
                for c in complaints
            ]
            return [types.TextContent(type="text", text=json.dumps(complaints_data, indent=2))]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error: {str(e)}")]
        finally:
            db.close()

    elif name == "file_system_write_report":
        filename = arguments.get("filename", "report.txt")
        report_content = arguments.get("report_content", "")
        
        safe_filename = os.path.basename(filename)
        if not safe_filename.endswith(".txt") and not safe_filename.endswith(".json"):
            safe_filename += ".txt"
            
        file_path = os.path.join(REPORTS_DIR, safe_filename)
        
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(report_content)
            return [types.TextContent(type="text", text=f"Success: Report written to file system at '{file_path}'")]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error writing to file: {str(e)}")]

    elif name == "mapping_calculate_route_matrix":
        truck_id = arguments.get("truck_id")
        if truck_id is None:
            return [types.TextContent(type="text", text="Error: Missing truck_id argument.")]
            
        db = SessionLocal()
        try:
            truck = db.query(Truck).filter(Truck.id == int(truck_id)).first()
            if not truck:
                return [types.TextContent(type="text", text=f"Error: Truck {truck_id} not found.")]
                
            assigned_stops = db.query(Complaint).filter(
                Complaint.assigned_truck_id == truck.id,
                Complaint.status != "completed"
            ).all()
            
            if not assigned_stops:
                return [types.TextContent(type="text", text=f"Truck {truck.vehicle_number} has no active collection stops scheduled.")]
                
            path_report = []
            curr_lat = truck.current_latitude
            curr_lng = truck.current_longitude
            
            for idx, stop in enumerate(assigned_stops):
                dist = calculate_haversine_distance(curr_lat, curr_lng, stop.latitude, stop.longitude)
                path_report.append({
                    "sequence": idx + 1,
                    "stop_id": stop.id,
                    "location": stop.location_name,
                    "priority": stop.priority,
                    "distance_to_travel_meters": round(dist, 1)
                })
                curr_lat = stop.latitude
                curr_lng = stop.longitude
                
            res = {
                "truck": truck.vehicle_number,
                "driver": truck.driver_name,
                "total_stops": len(assigned_stops),
                "stops_sequence": path_report
            }
            return [types.TextContent(type="text", text=json.dumps(res, indent=2))]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error: {str(e)}")]
        finally:
            db.close()

    elif name == "analytics_detect_hotspots":
        db = SessionLocal()
        try:
            complaints = db.query(Complaint).all()
            hotspots = {}
            for c in complaints:
                hotspots[c.location_name] = hotspots.get(c.location_name, 0) + 1
                
            critical_hotspots = [
                {"location": loc, "total_reports": count, "risk_level": "critical" if count >= 4 else "elevated"}
                for loc, count in hotspots.items()
                if count >= 2
            ]
            critical_hotspots.sort(key=lambda x: x["total_reports"], reverse=True)
            res = {
                "active_hotspots": critical_hotspots,
                "total_monitored_locations": len(hotspots)
            }
            return [types.TextContent(type="text", text=json.dumps(res, indent=2))]
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error: {str(e)}")]
        finally:
            db.close()

    else:
        raise ValueError(f"Unknown MCP tool: {name}")


async def main():
    """
    Main entry point for starting the standard stdio transport MCP server.
    """
    logger.info("Initializing MCP Stdio Server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="SmartWaste_MCP_Server",
                server_version="1.0.0",
                capabilities=types.ServerCapabilities(
                    tools=types.ToolsCapability(listChanged=True)
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())

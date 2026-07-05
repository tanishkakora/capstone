import logging
from google import genai
from backend.database.db import settings

logger = logging.getLogger(__name__)

class ComplaintIntakeAgent:
    """
    Intake Agent: Responsible for understanding the complaint text,
    cleaning the text, extracting entities (like landmarks, urgency indicators),
    and structuring metadata.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def process(self, description: str) -> dict:
        logger.info("ComplaintIntakeAgent processing description...")
        
        # Default structured info
        extracted_data = {
            "is_urgent": False,
            "cleaned_description": description.strip(),
            "landmark_mentions": []
        }

        # Rule-based backup parsing
        desc_lower = description.lower()
        urgency_words = ["urgent", "overflow", "smell", "stink", "hazard", "toxic", "leak", "danger", "overflowing", "immediately"]
        for word in urgency_words:
            if word in desc_lower:
                extracted_data["is_urgent"] = True
                break

        landmarks = ["school", "hospital", "clinic", "metro", "park", "mall", "market", "station", "stop", "road", "block", "street"]
        for landmark in landmarks:
            if landmark in desc_lower:
                extracted_data["landmark_mentions"].append(landmark)

        # Gemini API Extraction
        if self.client:
            try:
                prompt = (
                    "You are a municipal intake agent. Extract structured entities from the following citizen complaint.\n"
                    "Provide a JSON response with keys:\n"
                    "- 'is_urgent': boolean (true if the situation represents a hygiene hazard or immediate overflow)\n"
                    "- 'cleaned_description': a concise, professionally edited summary of the waste report\n"
                    "- 'landmarks': list of strings identifying mentioned landmarks (e.g. school, hospital, metro station)\n\n"
                    f"Complaint: \"{description}\"\n\n"
                    "Output ONLY valid JSON."
                )
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                
                # Simple JSON extractor
                text = response.text.strip()
                # Clean markdown backticks if returned
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                import json
                data = json.loads(text)
                extracted_data["is_urgent"] = data.get("is_urgent", extracted_data["is_urgent"])
                extracted_data["cleaned_description"] = data.get("cleaned_description", extracted_data["cleaned_description"])
                extracted_data["landmark_mentions"] = data.get("landmarks", extracted_data["landmark_mentions"])
                logger.info("Successfully extracted data using Gemini.")
            except Exception as e:
                logger.warning(f"Failed to extract structured data with Gemini: {e}. Falling back to rule-based parser.")
        
        return extracted_data

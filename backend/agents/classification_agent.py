import os
import logging
from google import genai
from backend.database.db import settings

logger = logging.getLogger(__name__)

# Try importing PIL for image processing. Fallback if not installed.
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

class WasteClassificationAgent:
    """
    Waste Classification Agent: Analyzes the uploaded waste image (multimodal)
    or text description to categorize the waste type and provide recycling suggestions.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def process(self, description: str, image_path: str = None) -> dict:
        logger.info("WasteClassificationAgent classifying waste...")
        
        # Default fallback categorization
        result = {
            "waste_type": "mixed",
            "recycling_advice": "Please dispose of general waste in designated city bins. Sort recyclable paper and clean plastics separately."
        }

        # Rule-based text categorization
        desc_lower = description.lower()
        if "plastic" in desc_lower or "bottle" in desc_lower:
            result["waste_type"] = "plastic"
            result["recycling_advice"] = "Plastic bottles (PET 1) and containers (HDPE 2) can be recycled. Please rinse and throw in the blue recycling bin."
        elif "paper" in desc_lower or "cardboard" in desc_lower or "box" in desc_lower:
            result["waste_type"] = "paper"
            result["recycling_advice"] = "Clean cardboard, envelopes, and printing papers belong in recycling. Flatten boxes first."
        elif "food" in desc_lower or "organic" in desc_lower or "fruit" in desc_lower or "vegetable" in desc_lower:
            result["waste_type"] = "organic"
            result["recycling_advice"] = "Organic kitchen scraps can be composted. Avoid placing meat, oils, or plastic wraps in compost bins."
        elif "glass" in desc_lower:
            result["waste_type"] = "glass"
            result["recycling_advice"] = "Glass bottles and jars are 100% recyclable. Throw them in glass collections. Avoid mixing light bulbs."
        elif "metal" in desc_lower or "can" in desc_lower or "tin" in desc_lower:
            result["waste_type"] = "metal"
            result["recycling_advice"] = "Aluminum and steel cans are recyclable. Rinse them first. Roll aluminum foil into balls."
        elif "battery" in desc_lower or "phone" in desc_lower or "electronics" in desc_lower or "wire" in desc_lower:
            result["waste_type"] = "e-waste"
            result["recycling_advice"] = "Electronic scrap contains hazardous materials. Never put them in normal trash. Dispose at E-Waste bins."

        # Gemini API Multimodal and Text classification
        if self.client:
            try:
                contents = []
                
                # Check if we have a valid local image file
                if image_path and os.path.exists(image_path) and HAS_PIL:
                    try:
                        img = Image.open(image_path)
                        contents.append(img)
                        logger.info(f"Loaded PIL image from: {image_path}")
                    except Exception as img_err:
                        logger.warning(f"Failed to open image file {image_path} with PIL: {img_err}")

                prompt = (
                    "You are a waste classification expert. Analyze the provided text report and any uploaded image.\n"
                    "Identify the category of waste from this list: plastic, paper, organic, glass, metal, e-waste, mixed.\n"
                    "Provide a short, friendly disposal instruction (recycling advice).\n\n"
                    f"Report details: \"{description}\"\n\n"
                    "Format your response as a strict JSON with keys:\n"
                    "- 'waste_type': one of the categories listed above (lowercase)\n"
                    "- 'recycling_advice': a sentence of specific sorting recommendations\n\n"
                    "Output ONLY valid JSON."
                )
                contents.append(prompt)

                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=contents
                )

                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                import json
                data = json.loads(text)
                
                category = data.get("waste_type", "").lower()
                valid_categories = ["plastic", "paper", "organic", "glass", "metal", "e-waste", "mixed"]
                if category in valid_categories:
                    result["waste_type"] = category
                result["recycling_advice"] = data.get("recycling_advice", result["recycling_advice"])
                logger.info(f"Gemini classified waste as: {result['waste_type']}")
            except Exception as e:
                logger.warning(f"Failed to classify using Gemini API: {e}. Defaulting to rule-based fallback.")

        return result

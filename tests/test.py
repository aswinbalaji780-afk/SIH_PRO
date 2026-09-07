import os
import sys
from dotenv import load_dotenv
from unittest.mock import MagicMock
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded GEMINI_API_KEY: {'[Configured - ' + api_key[:6] + '...]' if api_key else '[Missing]'}")

from backend.services.ai_assistant import AIAssistantService 

print("Setting up Fake Database for testing...\n")

# 3. Create a Fake Database Session using MagicMock
mock_db = MagicMock()

# --- Fake Employee Data ---
mock_employee = MagicMock()
mock_employee.user.full_name = "Ramesh Kumar"
mock_employee.job_role.title = "Senior Statistical Officer"
mock_employee.department.name = "Data Division"

# --- Fake Skill Gap Data ---
mock_gap = MagicMock()
mock_gap.competency.name = "Advanced Data Analytics"
mock_gap.current_score = 40
mock_gap.required_score = 90
mock_gap.gap_score = 50
mock_gap.priority = "HIGH"
mock_gap.updated_at.strftime.return_value = "08 Sep 2026"

# Connect the Fake DB so it returns our fake data instead of looking for a real database
mock_db.query.return_value.filter.return_value.first.return_value = mock_employee
mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_gap]

# 4. Trigger the AI Chatbot!
print("User Message: 'What is my skill gap?'\n")
print("Waiting for Gemini API response...\n")
print("-" * 50)

# We send a test message containing the keyword "gap"
result = AIAssistantService.process_query(
    db=mock_db, 
    employee_id=1, 
    user_message="what is my skill gap?"
)

# 5. Print the Final Output
print(result["reply"])
print("\nSources:", result["sources"])
print("-" * 50)
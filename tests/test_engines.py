import unittest
from backend.services.competency_engine import CompetencyEngine
from backend.services.skill_gap_engine import SkillGapEngine
from backend.services.igot_service import igot_service
from backend.services.nssta_service import nssta_service

class TestIntelligenceEngines(unittest.TestCase):

    def test_competency_level_calculation(self):
        self.assertEqual(CompetencyEngine.calculate_level(15.0), 1)
        self.assertEqual(CompetencyEngine.calculate_level(35.0), 2)
        self.assertEqual(CompetencyEngine.calculate_level(55.0), 3)
        self.assertEqual(CompetencyEngine.calculate_level(75.0), 4)
        self.assertEqual(CompetencyEngine.calculate_level(95.0), 5)

    def test_skill_gap_priority_classification(self):
        self.assertEqual(SkillGapEngine.classify_priority(3.0), "NO_GAP")
        self.assertEqual(SkillGapEngine.classify_priority(10.0), "LOW")
        self.assertEqual(SkillGapEngine.classify_priority(20.0), "MEDIUM")
        self.assertEqual(SkillGapEngine.classify_priority(35.0), "HIGH")
        self.assertEqual(SkillGapEngine.classify_priority(55.0), "CRITICAL")

    def test_igot_service_catalog(self):
        catalog = igot_service.get_catalog()
        self.assertGreater(len(catalog), 3)
        python_courses = igot_service.search_courses(competency="PYTHON")
        self.assertGreaterEqual(len(python_courses), 1)
        self.assertEqual(python_courses[0]["competency_code"], "PYTHON")

    def test_nssta_service_programmes(self):
        programmes = nssta_service.get_programmes()
        self.assertGreaterEqual(len(programmes), 2)
        self.assertIn("NSSTA", programmes[0]["source"])

if __name__ == "__main__":
    unittest.main()

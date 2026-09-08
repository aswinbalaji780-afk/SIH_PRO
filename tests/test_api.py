import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.database import SessionLocal
from backend.models.entities import EmployeeCompetency, SkillGap

class TestAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        db = SessionLocal()
        try:
            ec = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == 1).first()
            if ec and ec.current_score >= 95.0:
                ec.current_score = 75.0
                db.commit()
        finally:
            db.close()

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_demo_personas(self):
        response = self.client.get("/api/v1/auth/personas")
        self.assertEqual(response.status_code, 200)
        personas = response.json()
        self.assertGreaterEqual(len(personas), 4)
        usernames = [p["username"] for p in personas]
        self.assertIn("arun.kumar", usernames)
        self.assertIn("priya.sharma", usernames)

    def test_login_success(self):
        response = self.client.post("/api/v1/auth/login", json={
            "username": "arun.kumar",
            "password": "password123"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "EMPLOYEE")

    def test_register_and_login_learner(self):
        import uuid
        unique_suffix = f"test_user_{uuid.uuid4().hex[:8]}"
        reg_res = self.client.post("/api/v1/auth/register", json={
            "username": unique_suffix,
            "email": f"{unique_suffix}@mospi.gov.in",
            "password": "password123",
            "full_name": "Test Officer Cadre",
            "role": "EMPLOYEE",
            "designation": "Statistical Investigator",
            "department_id": 1,
            "job_role_id": 1,
            "years_of_experience": 3.0
        })
        self.assertEqual(reg_res.status_code, 200)
        reg_data = reg_res.json()
        self.assertIn("access_token", reg_data)
        self.assertEqual(reg_data["username"], unique_suffix)
        self.assertEqual(reg_data["role"], "EMPLOYEE")

        # Verify can login with registered credentials
        login_res = self.client.post("/api/v1/auth/login", json={
            "username": unique_suffix,
            "password": "password123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

    def test_employee_profile(self):
        response = self.client.get("/api/v1/employees/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["full_name"], "Arun Kumar")
        self.assertIn("Statistical", data["designation"])

    def test_skill_gaps_identified(self):
        response = self.client.get("/api/v1/skill-gaps/my-gaps")
        self.assertEqual(response.status_code, 200)
        gaps = response.json()
        self.assertGreater(len(gaps), 0)
        comp_names = [g["name"] for g in gaps]
        self.assertTrue(any("AI" in name or "Python" in name for name in comp_names))

    def test_recommendations_with_explainability(self):
        response = self.client.get("/api/v1/recommendations/my-recommendations")
        self.assertEqual(response.status_code, 200)
        recs = response.json()
        self.assertGreater(len(recs), 0)
        top_rec = recs[0]
        self.assertIn("why_recommended", top_rec)
        self.assertIn("recommendation_score", top_rec)
        self.assertGreater(top_rec["recommendation_score"], 60.0)

    def test_complete_learning_loop_quiz_submission(self):
        # 1. Fetch assessments
        assessments_res = self.client.get("/api/v1/assessments")
        self.assertEqual(assessments_res.status_code, 200)
        assessments = assessments_res.json()
        self.assertGreater(len(assessments), 0)
        assessment_id = assessments[0]["id"]

        # 2. Fetch assessment details & questions
        detail_res = self.client.get(f"/api/v1/assessments/{assessment_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        questions = detail["questions"]
        self.assertGreater(len(questions), 0)

        # 3. Submit correct answers to achieve high score
        from backend.models.entities import Question
        db = SessionLocal()
        try:
            q_objs = {q.id: q.correct_answer for q in db.query(Question).filter(Question.assessment_id == assessment_id).all()}
        finally:
            db.close()
        answers = [{"question_id": q["id"], "selected_answer": q_objs.get(q["id"], "A")} for q in questions]
        submit_res = self.client.post(f"/api/v1/assessments/{assessment_id}/submit", json={
            "assessment_id": assessment_id,
            "answers": answers
        })
        self.assertEqual(submit_res.status_code, 200)
        result = submit_res.json()
        self.assertTrue(result["passed"])
        self.assertGreaterEqual(result["score_percentage"], 75.0)
        self.assertIn("strengths", result)
        self.assertIn("action_plan", result)

        # 4. Verify that competency score increased
        self.assertGreaterEqual(result["updated_score"], result["previous_score"])

    def test_sso_switch(self):
        # 1. Attempting to switch without valid password must be REJECTED (401 Unauthorized)
        res_fail = self.client.post("/api/v1/auth/sso-switch", json={
            "target_username": "priya.sharma",
            "target_password": "wrong_password"
        })
        self.assertEqual(res_fail.status_code, 401)

        # 2. Switching with valid credentials succeeds
        res_ok = self.client.post("/api/v1/auth/sso-switch", json={
            "target_username": "priya.sharma",
            "target_password": "password123"
        })
        self.assertEqual(res_ok.status_code, 200)
        data = res_ok.json()
        self.assertEqual(data["username"], "priya.sharma")
        self.assertEqual(data["role"], "TRAINER")
        self.assertIn("access_token", data)

    def test_target_position_readiness(self):
        # 1. Fetch current target position readiness for Arun Kumar
        res = self.client.get("/api/v1/profile/1/target-position")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("promotion_readiness_pct", data)
        self.assertIn("target_role", data)
        self.assertIn("available_roles", data)
        self.assertIn("target_gaps", data)
        self.assertGreater(len(data["target_gaps"]), 0)

        # 2. Update expected position to a higher promotional role (e.g. SSO or Assistant Director)
        higher_roles = [r for r in data["available_roles"] if r["hierarchy_level"] > data["current_role"]["hierarchy_level"]]
        self.assertGreater(len(higher_roles), 0)
        target_role_id = higher_roles[0]["id"]
        update_res = self.client.post("/api/v1/profile/1/target-position", json={"target_job_role_id": target_role_id})
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()
        self.assertEqual(updated_data["target_role"]["id"], target_role_id)
        self.assertIn("promotion_readiness_pct", updated_data)

    def test_ai_recommend_igot_courses(self):
        # Recommend iGOT courses from JSO (id=1) to SSO (id=3)
        res = self.client.post("/api/v1/ai/recommend-igot-courses", json={
            "employee_id": 1,
            "current_job_role_id": 1,
            "target_job_role_id": 3
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("promotion_readiness_pct", data)
        self.assertIn("ai_roadmap_summary", data)
        self.assertIn("recommended_courses", data)
        self.assertGreater(len(data["recommended_courses"]), 0)
        
        # Verify first course has title, match_score, provider, and ai_rationale
        first_course = data["recommended_courses"][0]
        self.assertIn("title", first_course)
        self.assertIn("match_score_pct", first_course)
        self.assertIn("ai_rationale", first_course)

    def test_course_enrollment(self):
        res = self.client.post("/api/v1/courses/enroll", json={
            "employee_id": 1,
            "course_id": 1
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("external_url", data)

    def test_ai_recommend_igot_courses_rejects_lower_or_equal_target_role(self):
        # Current SSO (Level 3), Target JSO (Level 1) -> must be rejected
        res = self.client.post("/api/v1/ai/recommend-igot-courses", json={
            "employee_id": 1,
            "current_job_role_id": 3,
            "target_job_role_id": 1
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("must be higher in seniority", res.json()["detail"])

        # Current SSO (Level 3), Target SSO (Level 3) -> must be rejected
        res_equal = self.client.post("/api/v1/ai/recommend-igot-courses", json={
            "employee_id": 1,
            "current_job_role_id": 3,
            "target_job_role_id": 3
        })
        self.assertEqual(res_equal.status_code, 400)
        self.assertIn("must be higher in seniority", res_equal.json()["detail"])

    def test_ai_integration_info(self):
        res = self.client.get("/api/v1/ai/integration-info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("active_provider", data)
        self.assertIn("supported_providers", data)
        self.assertGreaterEqual(len(data["supported_providers"]), 3)

    def test_multilevel_mcq_workflow(self):
        db = SessionLocal()
        try:
            from backend.models.entities import Assessment
            old_as = db.query(Assessment).filter(Assessment.title == "Unit Test Multi-Level Evaluation Quiz").all()
            for oa in old_as:
                db.delete(oa)
            db.commit()
        finally:
            db.close()

        # 1. Upload NSSTA Trainer Guide
        guide_res = self.client.post("/api/v1/mcq/upload-trainer-guide", json={
            "title": "NSSTA Sample Survey & Complex Stratification Guide 2026",
            "content": "Module 1: Probability Proportional to Size (PPS) and intra-cluster correlation. Module 2: Calibrated weighting and Hedonic imputation in CPI. Module 3: Small Area Estimation (SAE) with Fay-Herriot EBLUP models.",
            "file_type": "txt",
            "course_id": 1,
            "uploaded_by_user_id": 2
        })
        self.assertEqual(guide_res.status_code, 200)
        guide_data = guide_res.json()
        self.assertIn("material_id", guide_data)
        self.assertEqual(guide_data["status"], "READY")
        material_id = guide_data["material_id"]

        # 2. Generate Multi-Level Quiz (Levels 1, 2, 3)
        gen_res = self.client.post("/api/v1/mcq/generate-multilevel-quiz", json={
            "material_id": material_id,
            "course_id": 1,
            "levels": [1, 2, 3],
            "count_per_level": 2,
            "assessment_title": "Unit Test Multi-Level Evaluation Quiz"
        })
        self.assertEqual(gen_res.status_code, 200)
        gen_data = gen_res.json()
        self.assertIn("assessment_id", gen_data)
        assessment_id = gen_data["assessment_id"]
        questions = gen_data["questions"]
        self.assertEqual(len(questions), 6)

        # Verify level distribution and grounding
        levels_seen = {q["level"] for q in questions}
        self.assertEqual(levels_seen, {1, 2, 3})
        for q in questions:
            self.assertIn("source_reference", q)
            self.assertIn("source_note_citation", q)
            self.assertTrue(len(q["source_reference"]) > 0)
            self.assertTrue(len(q["source_note_citation"]) > 0)

        # 3. Retrieve Multi-Level Quizzes
        list_res = self.client.get("/api/v1/mcq/multilevel-quizzes")
        self.assertEqual(list_res.status_code, 200)
        quizzes = list_res.json()
        self.assertGreater(len(quizzes), 0)
        matched = [qz for qz in quizzes if qz["id"] == assessment_id]
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0]["level_counts"]["1"], 2)
        self.assertEqual(matched[0]["level_counts"]["2"], 2)
        self.assertEqual(matched[0]["level_counts"]["3"], 2)

        # 4. Submit Multi-Level Test with Level-Wise Evaluation
        sub_answers = []
        for q in questions:
            # Pick 'A' for all
            sub_answers.append({
                "question_id": q["id"],
                "selected_answer": "A"
            })

        sub_res = self.client.post("/api/v1/mcq/submit-multilevel-test", json={
            "assessment_id": assessment_id,
            "employee_id": 1,
            "answers": sub_answers
        })
        self.assertEqual(sub_res.status_code, 200)
        sub_data = sub_res.json()
        self.assertIn("score_percentage", sub_data)
        self.assertIn("level_breakdown", sub_data)
        self.assertIn("level_1", sub_data["level_breakdown"])
        self.assertIn("level_2", sub_data["level_breakdown"])
        self.assertIn("level_3", sub_data["level_breakdown"])
        self.assertEqual(sub_data["level_breakdown"]["1"]["total"], 2)
        self.assertEqual(sub_data["level_breakdown"]["2"], sub_data["level_breakdown"].get("level_2", sub_data["level_breakdown"]["2"]))

if __name__ == "__main__":
    unittest.main()


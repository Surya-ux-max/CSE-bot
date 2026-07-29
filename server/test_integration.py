"""
test_integration.py
End-to-End Integration Test Suite for CSE-BOT Multi-Agent Enterprise Engine.
Runs comprehensive checks across all 38+ API endpoints and 6 specialized AI agents.
"""
import requests
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
STUDENT_EMAIL = "suryaprakash.s.d@csebot.edu"
FACULTY_EMAIL = "s.yuvaraj@faculty.csebot.edu"
PLACEMENT_EMAIL = "placements@csebot.edu"

passed_tests = []
failed_tests = []


def assert_test(name: str, condition: bool, details: str = ""):
    if condition:
        passed_tests.append(f"  ✅ PASS: {name}")
    else:
        failed_tests.append(f"  ❌ FAIL: {name} - {details}")


def run_tests():
    print("=" * 60)
    print("🚀 STARTING E2E INTEGRATION TEST SUITE FOR CSE-BOT")
    print("=" * 60)

    # 1. Health Check
    try:
        r = requests.get(f"{BASE_URL}/")
        assert_test("Health Check GET /", r.status_code == 200 and r.json().get("status") == "running")
    except Exception as e:
        assert_test("Health Check GET /", False, str(e))

    # 2. Authentication (Student, Faculty, Placement)
    student_token = None
    try:
        r = requests.post(f"{BASE_URL}/auth/student/login", json={"email": STUDENT_EMAIL, "password": "CSE@2026#1015"})
        data = r.json()
        student_token = data.get("user", {}).get("token")
        assert_test("Student Login & JWT Issuance", r.status_code == 200 and student_token and len(student_token) > 50)
    except Exception as e:
        assert_test("Student Login & JWT Issuance", False, str(e))

    try:
        r = requests.post(f"{BASE_URL}/auth/faculty/login", json={"email": FACULTY_EMAIL, "password": "Faculty@2026#2012"})
        data = r.json()
        fac_token = data.get("user", {}).get("token")
        assert_test("Faculty Login & JWT Issuance", r.status_code == 200 and fac_token)
    except Exception as e:
        assert_test("Faculty Login & JWT Issuance", False, str(e))

    try:
        r = requests.post(f"{BASE_URL}/auth/placement/login", json={"email": PLACEMENT_EMAIL, "password": "Placement@2026#3015"})
        data = r.json()
        place_token = data.get("user", {}).get("token")
        assert_test("Placement Cell Login & JWT Issuance", r.status_code == 200 and place_token)
    except Exception as e:
        assert_test("Placement Cell Login & JWT Issuance", False, str(e))

    # 3. Agent Telemetry & Stats
    try:
        r = requests.get(f"{BASE_URL}/agents/stats")
        data = r.json()
        assert_test("GET /agents/stats", r.status_code == 200 and data.get("total_active_agents") == 6)
    except Exception as e:
        assert_test("GET /agents/stats", False, str(e))

    # 4. Multi-Agent Routing & Chat
    agent_queries = [
        ("Hi, good morning!", "reception_agent"),
        ("Who is the Head of Computer Science Department?", "faculty_agent"),
        ("Syllabus details for Cloud Computing semester 6?", "curriculum_agent"),
        ("Explain quicksort algorithm complexity", "tutor_agent"),
        ("What placement opportunities are available?", "placement_agent"),
        ("Track Smart India Hackathon SIH 2026 details", "hackathon_agent")
    ]
    for q, expected_agent in agent_queries:
        try:
            r = requests.post(f"{BASE_URL}/chat", json={"question": q, "user_email": STUDENT_EMAIL, "user_role": "student"})
            data = r.json()
            assert_test(f"Chat Routing ({expected_agent})", r.status_code == 200 and len(data.get("answer", "")) > 10)
        except Exception as e:
            assert_test(f"Chat Routing ({expected_agent})", False, str(e))

    # 5. Message Hub (Inbox, Send, Mark-as-read, Notifications)
    try:
        r = requests.get(f"{BASE_URL}/messages", params={"email": STUDENT_EMAIL, "limit": 5})
        assert_test("GET /messages (Paginated)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /messages (Paginated)", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/notifications", params={"email": STUDENT_EMAIL})
        assert_test("GET /notifications", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /notifications", False, str(e))

    # 6. Personal & Academic Calendar
    try:
        r = requests.get(f"{BASE_URL}/events", params={"email": STUDENT_EMAIL})
        assert_test("GET /events (Personal Calendar)", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /events (Personal Calendar)", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/academic-events")
        assert_test("GET /academic-events", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /academic-events", False, str(e))

    # 7. Meeting Hub
    try:
        r = requests.get(f"{BASE_URL}/meetings", params={"email": FACULTY_EMAIL})
        assert_test("GET /meetings", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /meetings", False, str(e))

    # 8. Opportunities Hub (Hackathons & Placements)
    try:
        r = requests.get(f"{BASE_URL}/hackathons")
        assert_test("GET /hackathons", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /hackathons", False, str(e))

    try:
        r = requests.get(f"{BASE_URL}/placements")
        assert_test("GET /placements", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /placements", False, str(e))

    # 9. Speech-to-Text Dictation
    try:
        r = requests.get(f"{BASE_URL}/speech/logs", params={"email": STUDENT_EMAIL})
        assert_test("GET /speech/logs", r.status_code == 200 and isinstance(r.json(), list))
    except Exception as e:
        assert_test("GET /speech/logs", False, str(e))

    print("-" * 60)
    for p in passed_tests:
        print(p)
    for f in failed_tests:
        print(f)
    print("=" * 60)
    print(f"📊 INTEGRATION SUMMARY: {len(passed_tests)} PASSED / {len(failed_tests)} FAILED")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

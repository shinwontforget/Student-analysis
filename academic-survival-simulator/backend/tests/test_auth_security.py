import os
import pytest
from fastapi.testclient import TestClient

# Set up test environment secret before importing main app
os.environ["INTERNAL_API_SECRET"] = "test_super_secret_key_123"

from main import app

client = TestClient(app)

def test_health_check_public():
    """Verify public health check endpoint responds without secret."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analytics_gpa_endpoint_missing_secret():
    """Verify /api/v1/analytics/calculate-gpa returns 401/403 when X-Internal-Secret is missing."""
    response = client.post(
        "/api/v1/analytics/calculate-gpa",
        json={"cgpa": 7.0, "is_premium": False, "quiz_score": 85.0},
    )
    assert response.status_code in [401, 403]
    assert "Invalid or missing internal secret" in response.json().get("detail", "")

def test_analytics_gpa_endpoint_wrong_secret():
    """Verify /api/v1/analytics/calculate-gpa returns 401/403 when X-Internal-Secret is incorrect."""
    response = client.post(
        "/api/v1/analytics/calculate-gpa",
        headers={"X-Internal-Secret": "invalid_wrong_secret"},
        json={"cgpa": 7.0, "is_premium": False, "quiz_score": 85.0},
    )
    assert response.status_code in [401, 403]

def test_analytics_gpa_endpoint_valid_secret():
    """Verify /api/v1/analytics/calculate-gpa succeeds (200) with valid X-Internal-Secret."""
    response = client.post(
        "/api/v1/analytics/calculate-gpa",
        headers={"X-Internal-Secret": "test_super_secret_key_123"},
        json={"cgpa": 7.0, "is_premium": False, "quiz_score": 85.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert "delta" in data
    assert "new_cgpa" in data
    assert "unlocked_essay_mode" in data

def test_analytics_predict_endpoint_missing_secret():
    """Verify /api/v1/analytics/predict-trajectory returns 401/403 when X-Internal-Secret is missing."""
    response = client.post(
        "/api/v1/analytics/predict-trajectory",
        json={"assessments": [{"score": 80, "total": 100}]},
    )
    assert response.status_code in [401, 403]

def test_analytics_predict_endpoint_valid_secret():
    """Verify /api/v1/analytics/predict-trajectory succeeds (200) with valid X-Internal-Secret."""
    response = client.post(
        "/api/v1/analytics/predict-trajectory",
        headers={"X-Internal-Secret": "test_super_secret_key_123"},
        json={"assessments": [{"score": 80, "total": 100}], "future_days": 7},
    )
    assert response.status_code == 200
    data = response.json()
    assert "trend_slope" in data
    assert "risk_level" in data

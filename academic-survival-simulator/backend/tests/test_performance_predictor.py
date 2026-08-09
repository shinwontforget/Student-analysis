import pytest
from services.performance_predictor import PerformancePredictor

def test_performance_predictor_synthetic_history():
    """Verify performance predictor with synthetic improving assessment history."""
    predictor = PerformancePredictor()

    synthetic_assessments = [
        {"score": 50.0, "total": 100.0, "date": "2026-08-01"},
        {"score": 60.0, "total": 100.0, "date": "2026-08-02"},
        {"score": 70.0, "total": 100.0, "date": "2026-08-03"},
        {"score": 80.0, "total": 100.0, "date": "2026-08-04"},
        {"score": 90.0, "total": 100.0, "date": "2026-08-05"},
    ]

    res = predictor.predict_trajectory(synthetic_assessments, future_days=7)

    assert res["historical_count"] == 5
    assert res["trend_slope"] > 0  # Upward trend slope
    assert len(res["projected_scores"]) == 7
    assert res["final_projected_percentage"] >= 80.0
    assert res["risk_level"] == "LOW"

def test_performance_predictor_declining_history():
    """Verify performance predictor with declining assessment history yields risk warning."""
    predictor = PerformancePredictor()

    synthetic_assessments = [
        {"score": 80.0, "total": 100.0},
        {"score": 60.0, "total": 100.0},
        {"score": 40.0, "total": 100.0},
        {"score": 30.0, "total": 100.0},
    ]

    res = predictor.predict_trajectory(synthetic_assessments, future_days=5)

    assert res["trend_slope"] < 0  # Negative trend
    assert res["risk_level"] in ["MEDIUM", "HIGH"]

def test_performance_predictor_empty():
    """Verify predictor handles empty history gracefully."""
    predictor = PerformancePredictor()
    res = predictor.predict_trajectory([])
    assert res["historical_count"] == 0
    assert res["risk_level"] == "UNKNOWN"

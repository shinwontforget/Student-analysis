import pytest
from services.gpa_engine import GPAEngine

def test_gpa_0_maximum_gain():
    """Verify CGPA = 0 yields maximum ΔCGPA on a 100% quiz score."""
    engine = GPAEngine()
    res = engine.compute_delta(cgpa=0.0, quiz_score=100.0)
    assert res["delta"] == 0.5
    assert res["new_cgpa"] == 0.5

def test_gpa_10_zero_gain():
    """Verify CGPA = 10 yields 0 gain regardless of quiz score."""
    engine = GPAEngine()
    res = engine.compute_delta(cgpa=10.0, quiz_score=100.0)
    assert res["delta"] == 0.0
    assert res["new_cgpa"] == 10.0

def test_negative_or_invalid_inputs():
    """Verify invalid CGPA or quiz score raises ValueError."""
    engine = GPAEngine()
    
    with pytest.raises(ValueError):
        engine.compute_delta(cgpa=-1.0, quiz_score=80.0)
        
    with pytest.raises(ValueError):
        engine.compute_delta(cgpa=11.0, quiz_score=80.0)

    with pytest.raises(ValueError):
        engine.compute_delta(cgpa=5.0, quiz_score=-10.0)

    with pytest.raises(ValueError):
        engine.compute_delta(cgpa=5.0, quiz_score=105.0)

def test_delta_is_never_negative():
    """Verify quiz scores do not result in negative deltas."""
    engine = GPAEngine()
    res = engine.compute_delta(cgpa=5.0, quiz_score=0.0)
    assert res["delta"] == 0.0
    assert res["new_cgpa"] == 5.0

def test_unlocked_essay_mode():
    """Test both unlock paths: CGPA threshold (>=7.5) and premium status."""
    engine = GPAEngine()

    # Path 1: Threshold unlock (cgpa >= 7.5)
    assert engine.unlocked_essay_mode(cgpa=7.4, is_premium=False) is False
    assert engine.unlocked_essay_mode(cgpa=7.5, is_premium=False) is True
    assert engine.unlocked_essay_mode(cgpa=8.5, is_premium=False) is True

    # Path 2: Premium bypass (is_premium = True)
    assert engine.unlocked_essay_mode(cgpa=0.0, is_premium=True) is True
    assert engine.unlocked_essay_mode(cgpa=5.0, is_premium=True) is True

    # Path 3: Neither met
    assert engine.unlocked_essay_mode(cgpa=3.0, is_premium=False) is False

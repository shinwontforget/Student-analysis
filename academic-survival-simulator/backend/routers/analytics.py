from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from middleware.internal_auth import verify_internal_secret
from services.gpa_engine import GPAEngine
from services.performance_predictor import PerformancePredictor

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["analytics"],
    dependencies=[Depends(verify_internal_secret)],  # Enforce internal X-Internal-Secret on all analytics routes
)

# ---------------------------------------------------------------------------
# Request & Response Models (Pydantic)
# ---------------------------------------------------------------------------

class GPARequest(BaseModel):
    cgpa: float = Field(..., ge=0.0, le=10.0, description="Current CGPA in [0, 10]")
    is_premium: bool = Field(False, description="Whether user holds active premium status")
    quiz_score: float = Field(..., ge=0.0, le=100.0, description="Quiz score achieved in [0, 100]")

class GPAResponse(BaseModel):
    delta: float
    new_cgpa: float
    unlocked_essay_mode: bool
    debug: dict

class AssessmentItem(BaseModel):
    score: float = Field(..., ge=0.0)
    total: float = Field(..., gt=0.0)
    date: Optional[str] = None

class TrajectoryRequest(BaseModel):
    assessments: List[AssessmentItem]
    future_days: int = Field(14, ge=1, le=90)

class TrajectoryResponse(BaseModel):
    historical_count: int
    trend_slope: float
    projected_scores: List[dict]
    final_projected_percentage: float
    risk_level: str

# ---------------------------------------------------------------------------
# Router Endpoints
# ---------------------------------------------------------------------------

@router.post("/calculate-gpa", response_model=GPAResponse)
async def calculate_gpa_endpoint(request: GPARequest):
    """
    Internal POST endpoint calculating S-curve ΔCGPA and checking Essay Mode unlock status.
    """
    try:
        engine = GPAEngine()
        result = engine.compute_delta(request.cgpa, request.quiz_score)
        essay_unlocked = engine.unlocked_essay_mode(result["new_cgpa"], request.is_premium)
        
        return GPAResponse(
            delta=result["delta"],
            new_cgpa=result["new_cgpa"],
            unlocked_essay_mode=essay_unlocked,
            debug=result["debug"]
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

@router.post("/predict-trajectory", response_model=TrajectoryResponse)
async def predict_trajectory_endpoint(request: TrajectoryRequest):
    """
    Internal POST endpoint training a scikit-learn trend model on daily assessments to forecast trajectory.
    """
    try:
        predictor = PerformancePredictor()
        assessment_dicts = [item.model_dump() for item in request.assessments]
        res = predictor.predict_trajectory(assessment_dicts, future_days=request.future_days)
        return TrajectoryResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

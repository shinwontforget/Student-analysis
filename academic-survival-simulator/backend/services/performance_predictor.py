import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.linear_model import LinearRegression

class PerformancePredictor:
    """
    PerformancePredictor service using Scikit-Learn (Linear Regression)
    to model student learning trends over daily assessment history and project future CGPA trajectory.
    """

    def __init__(self):
        self.model = LinearRegression()

    def predict_trajectory(
        self,
        assessments: List[Dict[str, Any]],
        future_days: int = 14,
        max_cgpa: float = 10.0
    ) -> Dict[str, Any]:
        """
        Projects likely score percentage and CGPA trajectory over remaining days.

        :param assessments: List of dicts containing 'score', 'total' (or 'percentage'), optional 'date'
        :param future_days: Number of future days to project
        :param max_cgpa: Ceiling for CGPA calculation
        :return: Dict containing trend slope, projected scores, and overall risk assessment
        """
        if not assessments:
            return {
                "historical_count": 0,
                "trend_slope": 0.0,
                "projected_scores": [],
                "final_projected_percentage": 0.0,
                "risk_level": "UNKNOWN",
                "message": "No assessment data available to train model.",
            }

        # Convert to Pandas DataFrame
        df = pd.DataFrame(assessments)

        # Calculate percentage score per assessment
        if "score" in df.columns and "total" in df.columns:
            df["percentage"] = (df["score"] / df["total"]) * 100.0
        elif "percentage" not in df.columns:
            raise ValueError("Assessments must contain either 'score'/'total' or 'percentage'")

        df["percentage"] = np.clip(df["percentage"], 0.0, 100.0)

        n_samples = len(df)
        X = np.arange(n_samples).reshape(-1, 1)  # Day indices 0, 1, 2...
        y = df["percentage"].values

        if n_samples < 2:
            # Not enough points for linear trend, assume constant trend
            slope = 0.0
            last_percentage = float(y[0])
            future_indices = np.arange(n_samples, n_samples + future_days).reshape(-1, 1)
            projected_y = np.full(future_days, last_percentage)
        else:
            # Fit scikit-learn Linear Regression model
            self.model.fit(X, y)
            slope = float(self.model.coef_[0])
            
            future_indices = np.arange(n_samples, n_samples + future_days).reshape(-1, 1)
            projected_y = self.model.predict(future_indices)
            projected_y = np.clip(projected_y, 0.0, 100.0)

        final_projected = float(projected_y[-1]) if len(projected_y) > 0 else 0.0

        # Assess risk based on projected performance
        if final_projected >= 75.0:
            risk_level = "LOW"
        elif final_projected >= 50.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        projected_scores_list = [
            {"day_offset": int(i + 1), "projected_score_pct": round(float(val), 2)}
            for i, val in enumerate(projected_y)
        ]

        return {
            "historical_count": n_samples,
            "trend_slope": round(slope, 4),
            "projected_scores": projected_scores_list,
            "final_projected_percentage": round(final_projected, 2),
            "risk_level": risk_level,
        }

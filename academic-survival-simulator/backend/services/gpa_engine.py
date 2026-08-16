import numpy as np
import pandas as pd
from typing import Dict, Any

class GPAEngine:
    """
    Python GPAEngine service using NumPy and Pandas.
    Calculates CGPA gains based on the S-curve formula:
      ΔCGPA = BaseGain × (1 − CurrentCGPA / 10)² × (QuizScore / 100)
    
    Ensures gains decelerate near top CGPA (10) and handles unlocked essay mode logic.
    """

    MAX_CGPA: float = 10.0
    ESSAY_UNLOCK_THRESHOLD: float = 7.5
    DEFAULT_BASE_GAIN: float = 0.5

    def __init__(self, base_gain: float = DEFAULT_BASE_GAIN):
        if base_gain <= 0:
            raise ValueError(f"base_gain must be positive, got {base_gain}")
        self.base_gain = float(base_gain)

    def compute_delta(self, cgpa: float, quiz_score: float) -> Dict[str, Any]:
        """
        Computes ΔCGPA and new CGPA for a given quiz score.
        
        :param cgpa: Current CGPA in range [0, 10]
        :param quiz_score: Score achieved in range [0, 100]
        :return: Dict containing delta, new_cgpa, and debug information
        """
        # Validate input bounds
        if cgpa < 0 or cgpa > self.MAX_CGPA:
            raise ValueError(f"cgpa must be between 0 and 10, got {cgpa}")
        if quiz_score < 0 or quiz_score > 100:
            raise ValueError(f"quiz_score must be between 0 and 100, got {quiz_score}")

        # Compute scaling factor using numpy for vector capability/precision
        cgpa_array = np.array([cgpa], dtype=np.float64)
        quiz_score_array = np.array([quiz_score], dtype=np.float64)

        scaling_factor = np.square(1.0 - (cgpa_array / self.MAX_CGPA))
        delta = self.base_gain * scaling_factor * (quiz_score_array / 100.0)

        raw_delta = float(delta[0])
        # Clamp new CGPA to max 10.0 and min 0.0
        new_cgpa = float(np.clip(cgpa_array + delta, 0.0, self.MAX_CGPA)[0])

        return {
            "delta": round(raw_delta, 6),
            "new_cgpa": round(new_cgpa, 4),
            "debug": {
                "base_gain": self.base_gain,
                "current_cgpa": cgpa,
                "quiz_score": quiz_score,
                "scaling_factor": round(float(scaling_factor[0]), 6),
            },
        }

    def unlocked_essay_mode(self, cgpa: float = 0.0, is_premium: bool = False) -> bool:
        """
        Merit Lock: Essay Mode is unlocked strictly when CGPA >= 7.50.
        """
        return bool(cgpa >= self.ESSAY_UNLOCK_THRESHOLD)

    def process_assessment_dataframe(self, df: pd.DataFrame, initial_cgpa: float = 0.0) -> pd.DataFrame:
        """
        Batch processes a Pandas DataFrame of quiz results to track CGPA trajectory.
        Expects columns: ['quiz_score'].
        """
        if 'quiz_score' not in df.columns:
            raise ValueError("DataFrame must contain 'quiz_score' column")

        cgpa_history = []
        delta_history = []
        current_cgpa = initial_cgpa

        for score in df['quiz_score']:
            res = self.compute_delta(current_cgpa, score)
            delta_history.append(res['delta'])
            current_cgpa = res['new_cgpa']
            cgpa_history.append(current_cgpa)

        result_df = df.copy()
        result_df['delta'] = delta_history
        result_df['resulting_cgpa'] = cgpa_history
        return result_df

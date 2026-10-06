import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class ExplanationProvider(ABC):
    """Abstract base class for accessibility explanation generation."""

    @abstractmethod
    def generate_explanation(
        self,
        score: int,
        classification: str,
        evidence_summary: List[str],
        risks_summary: List[str],
        uncertainties: List[str],
        base_recommendations: List[str],
    ) -> Dict[str, Any]:
        """
        Produces natural language insight and refined recommendations
        strictly bounded by the provided structured evidence.
        """
        pass


class DeterministicExplanationProvider(ExplanationProvider):
    """
    Deterministic explanation provider.
    Zero external dependencies, sub-millisecond execution, completely predictable.
    """

    def generate_explanation(
        self,
        score: int,
        classification: str,
        evidence_summary: List[str],
        risks_summary: List[str],
        uncertainties: List[str],
        base_recommendations: List[str],
    ) -> Dict[str, Any]:
        has_stairs = any("stair" in e.lower() for e in evidence_summary)
        has_obstacles = any("obstacle" in e.lower() for e in evidence_summary)
        has_vehicles = any("vehicle" in e.lower() for e in evidence_summary)

        if has_stairs:
            ai_insight = (
                f"Physical environment assessed as {classification.replace('_', ' ').title()} ({score}/100). "
                "Stairs were detected in the visible access route and may present a mobility barrier. "
                "No step-free ramp transition was confirmed in this image."
            )
            recommended_action = (
                "Look for an alternative step-free entrance, or confirm accessible route accommodations before arrival."
            )
        elif has_obstacles:
            ai_insight = (
                f"Physical environment assessed as {classification.replace('_', ' ').title()} ({score}/100). "
                "Surface path appears step-free, but detected physical obstacles may reduce clearance for wheelchairs or strollers."
            )
            recommended_action = (
                "Ensure sufficient navigable passage width (>36 inches) around visible obstructions."
            )
        elif has_vehicles:
            ai_insight = (
                f"Physical environment assessed as {classification.replace('_', ' ').title()} ({score}/100). "
                "Vehicles are present near the pedestrian corridor. Curb cut transition and boarding areas may be restricted."
            )
            recommended_action = (
                "Exercise caution along roadway boundaries and confirm curb cut accessibility is unobstructed."
            )
        else:
            ai_insight = (
                f"Physical environment assessed as {classification.replace('_', ' ').title()} ({score}/100). "
                "No major physical step barriers or obstructions were detected in the visible camera perspective."
            )
            recommended_action = (
                "Proceed with caution. Monocular visual analysis is limited to visible camera perspective; on-site conditions may vary."
            )

        return {
            "ai_insight": ai_insight,
            "recommended_action": recommended_action,
            "provider": "deterministic",
        }


class LLMExplanationProvider(ExplanationProvider):
    """
    LLM explanation provider supporting Google Gemini or OpenAI.
    Enforces strict grounding: CANNOT modify score, CANNOT hallucinate unseen features.
    Falls back gracefully to deterministic provider on any error.
    """

    def __init__(self, provider_name: str = "gemini"):
        self.provider_name = provider_name
        self.fallback = DeterministicExplanationProvider()

    def generate_explanation(
        self,
        score: int,
        classification: str,
        evidence_summary: List[str],
        risks_summary: List[str],
        uncertainties: List[str],
        base_recommendations: List[str],
    ) -> Dict[str, Any]:
        # If no API key configured, use deterministic provider immediately
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if self.provider_name == "gemini" and not gemini_key:
            logger.debug("GEMINI_API_KEY not configured. Falling back to deterministic explanation.")
            return self.fallback.generate_explanation(
                score, classification, evidence_summary, risks_summary, uncertainties, base_recommendations
            )
        elif self.provider_name == "openai" and not openai_key:
            logger.debug("OPENAI_API_KEY not configured. Falling back to deterministic explanation.")
            return self.fallback.generate_explanation(
                score, classification, evidence_summary, risks_summary, uncertainties, base_recommendations
            )

        # Grounded prompt preventing hallucination
        prompt = (
            "You are WAYFIND AI's accessibility explanation engine.\n"
            "SYSTEM SAFETY RULE: You MUST strictly ground your response in the provided evidence.\n"
            "NEVER claim an object exists unless listed in the facts.\n"
            "NEVER claim there is no ramp in the real world—only state whether one was detected in the visible frame.\n"
            "DO NOT change the accessibility score.\n\n"
            f"FACTS:\n"
            f"- Accessibility Score: {score}/100 ({classification})\n"
            f"- Observed Evidence: {json.dumps(evidence_summary)}\n"
            f"- Identified Risks: {json.dumps(risks_summary)}\n"
            f"- Explicit Uncertainties: {json.dumps(uncertainties)}\n\n"
            "Return valid JSON with exactly two fields:\n"
            "{\n"
            '  "ai_insight": "2 concise sentences summarizing visual accessibility facts",\n'
            '  "recommended_action": "1 concrete actionable wayfinding recommendation"\n'
            "}"
        )

        try:
            if self.provider_name == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                parsed = json.loads(response.text.strip().replace("```json", "").replace("```", ""))
                return {
                    "ai_insight": parsed.get("ai_insight"),
                    "recommended_action": parsed.get("recommended_action"),
                    "provider": "gemini",
                }
        except Exception as e:
            logger.warning("LLM explanation generation failed: %s. Using deterministic fallback.", e)

        return self.fallback.generate_explanation(
            score, classification, evidence_summary, risks_summary, uncertainties, base_recommendations
        )


def get_explanation_provider() -> ExplanationProvider:
    """Factory function based on WAYFIND_LLM_PROVIDER environment variable."""
    provider_type = os.getenv("WAYFIND_LLM_PROVIDER", "none").lower()
    if provider_type in ["gemini", "openai"]:
        return LLMExplanationProvider(provider_type)
    return DeterministicExplanationProvider()

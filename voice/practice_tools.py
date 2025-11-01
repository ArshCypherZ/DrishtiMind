"""
Practice Conversation Tools

Tools for tracking, analyzing, and providing feedback on practice conversations.
These functions are called by the AI during conversations to assess user performance.
"""

import json
from datetime import datetime
from typing import Dict, Any

# In-memory storage for conversation analytics
conversation_data = {}


def track_communication_quality(
    tone: str,
    clarity: int,
    empathy_shown: bool,
    listening_quality: int
) -> Dict[str, Any]:
    """Track the quality of user's communication approach during practice."""
    
    timestamp = datetime.now().isoformat()
    
    quality_data = {
        "timestamp": timestamp,
        "tone": tone,
        "clarity": clarity,
        "empathy_shown": empathy_shown,
        "listening_quality": listening_quality,
        "overall_score": (clarity + listening_quality) / 2
    }
    
    # Store for later analysis
    if "quality_tracking" not in conversation_data:
        conversation_data["quality_tracking"] = []
    conversation_data["quality_tracking"].append(quality_data)
    
    print(f"[QUALITY TRACKED] Tone: {tone}, Clarity: {clarity}/10, Empathy: {empathy_shown}, Listening: {listening_quality}/10")
    
    return {
        "status": "tracked",
        "data": quality_data,
        "message": f"Communication quality logged: {tone} tone with {clarity}/10 clarity"
    }


def log_conversation_milestone(
    milestone_type: str,
    description: str = "",
    user_response_quality: str = "good"
) -> Dict[str, Any]:
    """Log important moments in the practice conversation."""
    
    timestamp = datetime.now().isoformat()
    
    milestone = {
        "timestamp": timestamp,
        "type": milestone_type,
        "description": description,
        "user_response_quality": user_response_quality
    }
    
    if "milestones" not in conversation_data:
        conversation_data["milestones"] = []
    conversation_data["milestones"].append(milestone)
    
    print(f"[MILESTONE] {milestone_type}: {description} (Quality: {user_response_quality})")
    
    return {
        "status": "logged",
        "milestone": milestone,
        "message": f"Milestone logged: {milestone_type}"
    }


def assess_goal_progress(
    goal_alignment: int,
    progress_notes: str = "",
    obstacles_encountered: str = ""
) -> Dict[str, Any]:
    """Assess progress toward user's stated conversation goal."""
    
    timestamp = datetime.now().isoformat()
    
    assessment = {
        "timestamp": timestamp,
        "goal_alignment": goal_alignment,
        "progress_notes": progress_notes,
        "obstacles_encountered": obstacles_encountered,
        "on_track": goal_alignment >= 6
    }
    
    if "goal_progress" not in conversation_data:
        conversation_data["goal_progress"] = []
    conversation_data["goal_progress"].append(assessment)
    
    print(f"[GOAL PROGRESS] Alignment: {goal_alignment}/10 - {progress_notes}")
    
    return {
        "status": "assessed",
        "assessment": assessment,
        "message": f"Goal progress: {goal_alignment}/10 alignment"
    }


def detect_emotional_state(
    user_emotion: str,
    persona_emotion: str,
    emotional_shift: bool
) -> Dict[str, Any]:
    """Detect and log emotional states during conversation."""
    
    timestamp = datetime.now().isoformat()
    
    emotional_data = {
        "timestamp": timestamp,
        "user_emotion": user_emotion,
        "persona_emotion": persona_emotion,
        "emotional_shift": emotional_shift,
        "emotional_alignment": user_emotion in ["calm", "confident", "empathetic"]
    }
    
    if "emotional_tracking" not in conversation_data:
        conversation_data["emotional_tracking"] = []
    conversation_data["emotional_tracking"].append(emotional_data)
    
    print(f"[EMOTIONS] User: {user_emotion}, Persona: {persona_emotion}, Shift: {emotional_shift}")
    
    return {
        "status": "detected",
        "emotions": emotional_data,
        "message": f"Emotional states logged"
    }


def suggest_conversation_technique(
    technique: str,
    situation: str,
    priority: str = "medium"
) -> Dict[str, Any]:
    """Internally note when user could benefit from specific technique."""
    
    timestamp = datetime.now().isoformat()
    
    suggestion = {
        "timestamp": timestamp,
        "technique": technique,
        "situation": situation,
        "priority": priority
    }
    
    if "technique_suggestions" not in conversation_data:
        conversation_data["technique_suggestions"] = []
    conversation_data["technique_suggestions"].append(suggestion)
    
    print(f"[TECHNIQUE SUGGESTION] {technique} ({priority} priority) - {situation}")
    
    return {
        "status": "noted",
        "suggestion": suggestion,
        "message": f"Technique suggestion noted: {technique}"
    }


def evaluate_conversation_ending(
    ending_quality: str,
    goal_achieved: bool,
    relationship_impact: str,
    key_takeaways: str
) -> Dict[str, Any]:
    """Evaluate if conversation reached natural conclusion."""
    
    timestamp = datetime.now().isoformat()
    
    evaluation = {
        "timestamp": timestamp,
        "ending_quality": ending_quality,
        "goal_achieved": goal_achieved,
        "relationship_impact": relationship_impact,
        "key_takeaways": key_takeaways,
        "success_score": calculate_success_score(ending_quality, goal_achieved, relationship_impact)
    }
    
    conversation_data["ending_evaluation"] = evaluation
    
    print(f"[CONVERSATION END] Quality: {ending_quality}, Goal Achieved: {goal_achieved}, Impact: {relationship_impact}")
    
    return {
        "status": "evaluated",
        "evaluation": evaluation,
        "message": f"Conversation ending evaluated: {ending_quality}"
    }


def generate_feedback_summary(
    strengths: str,
    areas_for_improvement: str,
    specific_examples: str,
    recommended_practice: str,
    overall_score: int
) -> Dict[str, Any]:
    """Generate comprehensive feedback at conversation end."""
    
    timestamp = datetime.now().isoformat()
    
    # Compile all tracked data
    feedback = {
        "timestamp": timestamp,
        "overall_score": overall_score,
        "strengths": strengths,
        "areas_for_improvement": areas_for_improvement,
        "specific_examples": specific_examples,
        "recommended_practice": recommended_practice,
        "conversation_analytics": {
            "total_milestones": len(conversation_data.get("milestones", [])),
            "quality_checks": len(conversation_data.get("quality_tracking", [])),
            "emotional_shifts": len(conversation_data.get("emotional_tracking", [])),
            "technique_suggestions": len(conversation_data.get("technique_suggestions", []))
        },
        "detailed_tracking": conversation_data
    }
    
    conversation_data["final_feedback"] = feedback
    
    print(f"[FEEDBACK GENERATED] Overall Score: {overall_score}/10")
    print(f"Strengths: {strengths}")
    print(f"Areas for Improvement: {areas_for_improvement}")
    
    return {
        "status": "generated",
        "feedback": feedback,
        "message": "Comprehensive feedback generated",
        "save_to_database": True  # Signal to save this to DrishtiMind database
    }


def calculate_success_score(ending_quality: str, goal_achieved: bool, relationship_impact: str) -> int:
    """Calculate overall success score based on conversation outcome."""
    
    score = 5  # Base score
    
    # Ending quality impact
    if ending_quality == "positive":
        score += 3
    elif ending_quality == "neutral":
        score += 1
    elif ending_quality == "negative":
        score -= 2
    
    # Goal achievement impact
    if goal_achieved:
        score += 3
    
    # Relationship impact
    if relationship_impact == "strengthened":
        score += 2
    elif relationship_impact == "weakened":
        score -= 2
    
    return max(1, min(10, score))  # Clamp between 1-10


def get_conversation_data() -> Dict[str, Any]:
    """Get all tracked conversation data."""
    return conversation_data


def reset_conversation_data():
    """Reset conversation data for new session."""
    global conversation_data
    conversation_data = {}
    print("[RESET] Conversation data cleared for new session")

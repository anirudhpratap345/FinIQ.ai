"""
Data Validation Utilities
Validates startup input data before processing.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, validator
import logging

logger = logging.getLogger(__name__)


class StartupInput(BaseModel):
    """
    Validated startup input schema.
    Matches the frontend form structure.
    """
    startupName: str = Field(..., min_length=1, max_length=500)
    # Optional one-line description / tagline for the startup
    oneLineDescription: Optional[str] = ""
    industry: str = Field(..., min_length=1, max_length=200)
    targetMarket: str = Field(..., pattern="^(B2B|B2C|B2B2C)$")
    geography: str = Field(..., min_length=1, max_length=200)
    teamSize: int = Field(..., ge=0, le=10000)
    productStage: str = Field(..., pattern="^(Idea|MVP|Beta|Early Revenue|Growth)$")
    monthlyRevenue: Optional[float] = Field(0, ge=0)
    growthRate: Optional[str] = ""
    tractionSummary: Optional[str] = ""
    businessModel: str = Field(..., min_length=1, max_length=500)
    fundingGoal: Optional[float] = Field(None, ge=0)
    mainFinancialConcern: str = Field(..., min_length=1, max_length=1000)
    ideaDescription: Optional[str] = Field("", min_length=0, max_length=3000)
    
    @validator('monthlyRevenue', 'fundingGoal', pre=True)
    def convert_to_float(cls, v):
        """Convert string numbers to float."""
        if v is None or v == "":
            return None if cls.__fields__['fundingGoal'] else 0
        try:
            return float(v)
        except (ValueError, TypeError):
            return None if cls.__fields__['fundingGoal'] else 0
    
    @validator('teamSize', pre=True)
    def convert_to_int(cls, v):
        """Convert string numbers to int."""
        if v is None or v == "":
            return 0
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0


def validate_startup_input(data: Dict[str, Any]) -> StartupInput:
    """
    Validate and clean startup input data.
    
    Args:
        data: Raw input dictionary from frontend
        
    Returns:
        Validated StartupInput object
        
    Raises:
        ValueError: If validation fails
    """
    try:
        validated = StartupInput(**data)
        logger.info(f"[OK] Input validation passed for: {validated.startupName}")
        return validated
    except Exception as e:
        logger.error(f"[FAIL] Input validation failed: {str(e)}")
        raise ValueError(f"Invalid startup input: {str(e)}")


def input_to_dict(validated_input: StartupInput) -> Dict[str, Any]:
    """Convert validated input back to dictionary."""
    return validated_input.dict()


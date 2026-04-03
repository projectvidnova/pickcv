"""Job parser registry."""
from app.services.job_parsers.base_parser import BaseJobParser, ParsedJob
from app.services.job_parsers.greenhouse_parser import GreenhouseParser
from app.services.job_parsers.lever_parser import LeverParser

__all__ = [
    "BaseJobParser",
    "ParsedJob",
    "GreenhouseParser",
    "LeverParser",
]

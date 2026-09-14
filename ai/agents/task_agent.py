"""
TwinHands-AI: Task Understanding & Intent Agent
Extracts dining group size and normalizes high-level commands.
Enforces strict validation ($1 <= N <= 10$).
"""

import re
from typing import Dict, Any, Optional

NUMBER_WORDS = {
    "one": 1, "a": 1, "solo": 1, "single": 1,
    "two": 2, "pair": 2, "couple": 2, "both": 2,
    "three": 3, "trio": 3,
    "four": 4, "quad": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "twenty": 20
}

class TaskAgent:
    def __init__(self, min_people: int = 1, max_people: int = 10):
        self.min_people = min_people
        self.max_people = max_people

    def parse_instruction(self, text: str) -> Dict[str, Any]:
        """Parse natural language command into structured task and group size."""
        clean_text = text.strip().lower()
        extracted_num: Optional[int] = None

        # Check for explicit digit (e.g. "4", "10")
        digit_match = re.search(r'\b(\d+)\b', clean_text)
        if digit_match:
            extracted_num = int(digit_match.group(1))
        else:
            # Word lookup
            tokens = re.split(r'\s+', clean_text)
            for token in tokens:
                if token in NUMBER_WORDS:
                    extracted_num = NUMBER_WORDS[token]
                    break

        if extracted_num is None:
            extracted_num = 4  # standard default

        is_valid = (self.min_people <= extracted_num <= self.max_people)
        rejection_notice = None

        if not is_valid:
            rejection_notice = (
                f"GROUP SIZE NOT SUPPORTED\n\n"
                f"TwinHands-AI currently supports {self.min_people}–{self.max_people} people.\n"
                f"Please specify a group size between {self.min_people} and {self.max_people}."
            )

        return {
            "raw_instruction": text,
            "task": "prepare_dinner_table",
            "extracted_people": extracted_num,
            "is_valid": is_valid,
            "rejection_notice": rejection_notice,
            "required_place_settings": extracted_num if is_valid else 0,
            "confidence": 0.98 if digit_match else 0.94,
        }

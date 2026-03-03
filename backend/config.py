"""Configuration for the Council of AGI backend."""

import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

MODEL = "claude-sonnet-4-20250514"

MAX_SESSION_MESSAGES = 8

DATA_DIR = "data/sessions"

RANDOM_TOPICS = [
    "Should AI systems be granted legal personhood?",
    "How should humanity allocate resources during a global water crisis?",
    "Is it ethical to upload human consciousness to digital substrates?",
    "Should genetic enhancement of human embryos be permitted?",
    "How do we balance privacy rights with collective security?",
    "What obligations do current generations have to future ones?",
    "Should autonomous weapons systems be banned internationally?",
    "How should humanity respond to first contact with alien intelligence?",
    "Is economic growth compatible with environmental sustainability?",
    "Should there be limits on human lifespan extension technologies?",
    "How do we govern a post-scarcity economy?",
    "What rights should artificial superintelligence have?",
    "Should voting be mandatory in democracies?",
    "How do we address algorithmic bias in criminal justice?",
    "Is universal basic income the answer to technological unemployment?",
]

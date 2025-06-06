from pathlib import Path
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get the base directory of our backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Database URL - SQLite database will be created in the data directory
DATABASE_URL = f"sqlite:///{BASE_DIR}/data/journal.db"

# Make sure the data directory exists
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Chroma DB settings
CHROMA_DATA_DIR = BASE_DIR / "data" / "chroma"
CHROMA_DATA_DIR.mkdir(exist_ok=True) 
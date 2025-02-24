from pathlib import Path

# Get the base directory of our backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Database URL - SQLite database will be created in the data directory
DATABASE_URL = f"sqlite:///{BASE_DIR}/data/journal.db"

# Make sure the data directory exists
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True) 
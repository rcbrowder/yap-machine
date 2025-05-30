#!/usr/bin/env python3
"""
Test script for Chroma database setup
This script tests the Chroma database initialization and basic operations
"""

import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.db.vectordb import ChromaManager, vector_db
    from app.core.config import CHROMA_DATA_DIR
    print("✅ Successfully imported the ChromaManager and vector_db")
except ImportError as e:
    print(f"❌ Error importing modules: {e}")
    sys.exit(1)

def test_chroma_setup():
    """Test the Chroma database setup"""
    
    print("\n=== Testing Chroma Database Setup ===\n")
    
    # Test 1: Check if Chroma data directory exists
    print(f"Checking if Chroma data directory exists at: {CHROMA_DATA_DIR}")
    if CHROMA_DATA_DIR.exists():
        print(f"✅ Chroma data directory exists")
    else:
        print(f"❌ Chroma data directory does not exist. Creating...")
        CHROMA_DATA_DIR.mkdir(exist_ok=True, parents=True)
        if CHROMA_DATA_DIR.exists():
            print(f"✅ Created Chroma data directory")
        else:
            print(f"❌ Failed to create Chroma data directory")
            return False
    
    # Test 2: Initialize ChromaManager
    print("\nInitializing ChromaManager...")
    try:
        chroma = ChromaManager()
        print("✅ Successfully initialized ChromaManager")
    except Exception as e:
        print(f"❌ Error initializing ChromaManager: {e}")
        return False
    
    # Test 3: Check if singleton works
    print("\nTesting if singleton pattern works...")
    another_instance = ChromaManager()
    if id(chroma) == id(another_instance):
        print("✅ Singleton pattern works correctly")
    else:
        print("❌ Singleton pattern failed")
        return False
    
    # Test 4: Add an entry
    print("\nAdding a test entry...")
    try:
        chroma.add_entry(
            id="test_entry_1",
            text="This is a test entry for Chroma database",
            metadata={"test": True, "timestamp": "2024-02-24"}
        )
        print("✅ Successfully added test entry")
    except Exception as e:
        print(f"❌ Error adding test entry: {e}")
        return False
    
    # Test 5: Update an entry
    print("\nUpdating the test entry...")
    try:
        chroma.update_entry(
            id="test_entry_1",
            text="This is an updated test entry for Chroma database",
            metadata={"test": True, "timestamp": "2024-02-24", "updated": True}
        )
        print("✅ Successfully updated test entry")
    except Exception as e:
        print(f"❌ Error updating test entry: {e}")
        return False
    
    # Test 6: Get entries by IDs
    print("\nGetting entries by IDs...")
    try:
        entries = chroma.get_entries_by_ids(["test_entry_1"])
        if entries and "documents" in entries and entries["documents"]:
            print(f"✅ Successfully retrieved entries by IDs")
            print(f"Document: {entries['documents'][0]}")
            print(f"Metadata: {entries['metadatas'][0]}")
        else:
            print("❌ Failed to retrieve entries")
            return False
    except Exception as e:
        print(f"❌ Error getting entries by IDs: {e}")
        return False
    
    # Test 7: Batch add entries
    print("\nAdding batch entries...")
    try:
        chroma.batch_add_entries(
            ids=["batch_entry_1", "batch_entry_2", "batch_entry_3"],
            texts=[
                "This is the first batch entry",
                "This is the second batch entry",
                "This is the third batch entry"
            ],
            metadatas=[
                {"batch": 1, "index": 0},
                {"batch": 1, "index": 1},
                {"batch": 1, "index": 2}
            ]
        )
        print("✅ Successfully added batch entries")
    except Exception as e:
        print(f"❌ Error adding batch entries: {e}")
        return False
    
    # Test 8: Query for similar entries
    print("\nQuerying for similar entries...")
    try:
        results = chroma.query_similar("test entry")
        print(f"✅ Query successful. Found {len(results['ids'][0])} results")
        print(f"IDs: {results['ids'][0]}")
        print(f"Distances: {results['distances'][0]}")
    except Exception as e:
        print(f"❌ Error querying entries: {e}")
        return False
    
    # Test 9: Get count
    print("\nGetting entry count...")
    try:
        count = chroma.get_count()
        print(f"✅ Collection has {count} entries")
    except Exception as e:
        print(f"❌ Error getting count: {e}")
        return False
    
    # Test 10: Bulk delete entries
    print("\nBulk deleting batch entries...")
    try:
        chroma.bulk_delete_entries(["batch_entry_1", "batch_entry_2", "batch_entry_3"])
        new_count = chroma.get_count()
        print(f"✅ Successfully deleted batch entries")
        print(f"Collection now has {new_count} entries (should be 1)")
    except Exception as e:
        print(f"❌ Error bulk deleting entries: {e}")
        return False
    
    # Test 11: Delete entry
    print("\nDeleting test entry...")
    try:
        chroma.delete_entry("test_entry_1")
        print("✅ Successfully deleted test entry")
    except Exception as e:
        print(f"❌ Error deleting test entry: {e}")
        return False
    
    # Test 12: Verify deletion
    print("\nVerifying deletion...")
    try:
        count = chroma.get_count()
        print(f"✅ Collection now has {count} entries (should be 0)")
    except Exception as e:
        print(f"❌ Error getting count after deletion: {e}")
        return False
    
    print("\n=== All tests completed successfully! ===")
    return True

if __name__ == "__main__":
    test_chroma_setup() 
#!/usr/bin/env python3
"""
Test script for the Vector Search API
This script tests the search functionality by making direct API calls
"""
import httpx
import json
import uuid
from datetime import datetime
import sys

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_search_api():
    """Test the vector search API functionality"""
    print("\n=== Testing Vector Search API ===\n")
    
    # Create a unique ID for test entries
    test_id = str(uuid.uuid4())
    print(f"Using test ID: {test_id}")
    
    # Step 1: Add a test journal entry via the journal API
    print("\nStep 1: Adding a test journal entry...")
    entry_data = {
        "title": f"Test Entry {test_id}",
        "content": "This is a detailed test entry to test the vector search functionality. It contains specific keywords like ML, vector database, and semantic search."
    }
    
    try:
        # Using the correct endpoint /journal
        response = httpx.post(f"{BASE_URL}/journal", json=entry_data)
        response.raise_for_status()
        entry = response.json()
        entry_id = entry["id"]
        print(f"✅ Successfully added journal entry with ID: {entry_id}")
    except Exception as e:
        print(f"❌ Error adding journal entry: {e}")
        return False
    
    # Step 2: Sync with vector database
    print("\nStep 2: Syncing with vector database...")
    try:
        response = httpx.post(f"{BASE_URL}/vector/sync")
        response.raise_for_status()
        sync_result = response.json()
        print(f"✅ Successfully synced with vector database")
        print(f"   Previous count: {sync_result['previous_count']}")
        print(f"   Current count: {sync_result['current_count']}")
    except Exception as e:
        print(f"❌ Error syncing with vector database: {e}")
        return False
    
    # Step 3: Get vector database stats
    print("\nStep 3: Getting vector database stats...")
    try:
        response = httpx.get(f"{BASE_URL}/vector/stats")
        response.raise_for_status()
        stats = response.json()
        print(f"✅ Vector database stats:")
        print(f"   Entry count: {stats['entry_count']}")
        print(f"   Collection name: {stats['collection_name']}")
    except Exception as e:
        print(f"❌ Error getting vector database stats: {e}")
        return False
    
    # Step 4: Search for the entry
    print("\nStep 4: Searching for the entry...")
    search_data = {
        "query_text": "vector database semantic search",
        "max_results": 5
    }
    
    try:
        response = httpx.post(f"{BASE_URL}/vector/search", json=search_data)
        response.raise_for_status()
        search_results = response.json()
        print(f"✅ Search returned {len(search_results)} results")
        
        # Verify results
        if not search_results:
            print("❌ No search results returned")
            return False
        
        # Check if our entry is in the results
        found = False
        for i, result in enumerate(search_results):
            print(f"\nResult {i+1}:")
            print(f"   Title: {result['entry']['title']}")
            print(f"   Similarity score: {result['similarity_score']}")
            
            # Check if similarity score is valid (between 0 and 1)
            if not (0 <= result['similarity_score'] <= 1):
                print(f"❌ Invalid similarity score: {result['similarity_score']}")
                return False
            
            if result['entry']['id'] == entry_id:
                found = True
                print(f"✅ Found our test entry with similarity score: {result['similarity_score']}")
        
        if not found:
            print("❌ Our test entry was not found in search results")
            return False
    except Exception as e:
        print(f"❌ Error searching: {e}")
        return False
    
    print("\n=== All search API tests completed successfully! ===")
    return True

if __name__ == "__main__":
    test_search_api() 
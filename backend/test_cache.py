"""
Test script to verify caching functionality.
Tests both file-based cache and cache hit/miss behavior.
"""

import sys
import os
import time
import json

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.cache import compute_hash, cache_get, cache_set, cache_clear, get_cache_stats

def test_cache_hash():
    """Test that hash generation is stable and deterministic"""
    print("\n" + "="*70)
    print("TEST 1: Hash Generation")
    print("="*70)
    
    input1 = {
        "startupName": "Test Startup",
        "industry": "AI/ML",
        "ideaDescription": "Building AI agents",
        "teamSize": 5
    }
    
    input2 = {
        "startupName": "Test Startup",
        "industry": "AI/ML",
        "ideaDescription": "Building AI agents",
        "teamSize": 5
    }
    
    # Same input should produce same hash
    hash1 = compute_hash(input1)
    hash2 = compute_hash(input2)
    
    print(f"Hash 1: {hash1}")
    print(f"Hash 2: {hash2}")
    print(f"✓ Hashes match: {hash1 == hash2}")
    
    # Different input should produce different hash
    input3 = {**input1, "teamSize": 10}
    hash3 = compute_hash(input3)
    print(f"Hash 3 (different input): {hash3}")
    print(f"✓ Hashes differ: {hash1 != hash3}")
    
    return hash1 == hash2 and hash1 != hash3


def test_cache_set_get():
    """Test cache storage and retrieval"""
    print("\n" + "="*70)
    print("TEST 2: Cache Set/Get")
    print("="*70)
    
    # Clear cache first
    cache_clear()
    print("✓ Cache cleared")
    
    # Create test data
    test_input = {
        "startupName": "Cache Test Co",
        "industry": "SaaS",
        "ideaDescription": "Testing cache functionality",
        "teamSize": 3
    }
    
    test_output = {
        "startup_name": "Cache Test Co",
        "funding_stage": {"funding_stage": "Seed", "confidence": "high"},
        "raise_amount": {"recommended_amount": "$1M-$3M"},
        "summary": "Test strategy output"
    }
    
    # Compute hash and store
    cache_key = compute_hash(test_input)
    print(f"Cache key: {cache_key[:30]}...")
    
    success = cache_set(cache_key, test_output, ttl=60)
    print(f"✓ Cache set successful: {success}")
    
    # Retrieve from cache
    cached_result = cache_get(cache_key)
    print(f"✓ Cache get successful: {cached_result is not None}")
    
    if cached_result:
        print(f"✓ Data integrity: {cached_result['startup_name'] == test_output['startup_name']}")
        return True
    
    return False


def test_cache_miss():
    """Test cache miss for non-existent key"""
    print("\n" + "="*70)
    print("TEST 3: Cache Miss")
    print("="*70)
    
    fake_key = "v1:nonexistentkey123456789"
    result = cache_get(fake_key)
    
    print(f"✓ Cache miss correctly returns None: {result is None}")
    return result is None


def test_cache_stats():
    """Test cache statistics"""
    print("\n" + "="*70)
    print("TEST 4: Cache Statistics")
    print("="*70)
    
    stats = get_cache_stats()
    
    print(f"Cache version: {stats['cache_version']}")
    print(f"Redis available: {stats['redis_available']}")
    print(f"Redis connected: {stats['redis_connected']}")
    print(f"File cache entries: {stats['file_cache_entries']}")
    print(f"File cache size: {stats['file_cache_size_mb']} MB")
    
    print(f"✓ Stats retrieved successfully")
    return True


def test_end_to_end_timing():
    """Test cache performance improvement"""
    print("\n" + "="*70)
    print("TEST 5: End-to-End Performance")
    print("="*70)
    
    # Clear cache
    cache_clear()
    
    test_input = {
        "startupName": "Speed Test Startup",
        "industry": "Fintech",
        "ideaDescription": "Fast payment processing",
        "teamSize": 8
    }
    
    # Simulate expensive operation (agent chain execution)
    expensive_output = {
        "startup_name": "Speed Test Startup",
        "funding_stage": {"funding_stage": "Series A"},
        "summary": "Generated strategy"
    }
    
    cache_key = compute_hash(test_input)
    
    # First call - cache miss (simulate slow execution)
    start = time.time()
    result1 = cache_get(cache_key)
    if result1 is None:
        time.sleep(0.1)  # Simulate 100ms of work
        cache_set(cache_key, expensive_output, ttl=60)
        result1 = expensive_output
    time1 = time.time() - start
    
    print(f"First call (cache miss): {time1*1000:.2f}ms")
    
    # Second call - cache hit (should be instant)
    start = time.time()
    result2 = cache_get(cache_key)
    time2 = time.time() - start
    
    print(f"Second call (cache hit): {time2*1000:.2f}ms")
    print(f"✓ Speedup: {time1/time2:.1f}x faster")
    print(f"✓ Cache hit verified: {result2 is not None}")
    
    return result2 is not None and time2 < time1


def main():
    """Run all cache tests"""
    print("\n" + "="*70)
    print("FinIQ.ai Cache System Test Suite")
    print("="*70)
    
    tests = [
        ("Hash Generation", test_cache_hash),
        ("Cache Set/Get", test_cache_set_get),
        ("Cache Miss", test_cache_miss),
        ("Cache Statistics", test_cache_stats),
        ("End-to-End Performance", test_end_to_end_timing)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"✗ Test failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Cache system is working correctly.")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())


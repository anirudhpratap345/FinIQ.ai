"""
Cache Utility for FinIQ.ai
Provides production-ready caching with Redis + file-based fallback.

Features:
- Stable hash generation from input data
- Redis caching (primary)
- File-based caching (fallback)
- Graceful error handling
- Cache versioning
- TTL support
"""

import json
import hashlib
import os
import logging
from typing import Any, Dict, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# Cache version - increment when prompt templates or agent logic changes
CACHE_VERSION = "v1"

# Try to import Redis
try:
    import redis
    REDIS_AVAILABLE = True
    logger.info("[CACHE] Redis library available")
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("[CACHE] Redis not installed, using file-based cache only")

# Initialize Redis client (lazy)
_redis_client = None
_redis_initialized = False


def _get_redis_client():
    """
    Get or initialize Redis client.
    Lazy initialization to avoid connection errors on startup.
    
    Returns:
        Redis client or None if unavailable/failed
    """
    global _redis_client, _redis_initialized
    
    if _redis_initialized:
        return _redis_client
    
    _redis_initialized = True
    
    if not REDIS_AVAILABLE:
        logger.info("[CACHE] Redis library not available, skipping Redis initialization")
        return None
    
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,  # Auto-decode bytes to strings
            socket_connect_timeout=2,  # 2 second timeout
            socket_timeout=2,
            retry_on_timeout=False
        )
        
        # Test connection
        _redis_client.ping()
        logger.info(f"[CACHE] ✓ Redis connected successfully: {redis_url}")
        return _redis_client
        
    except Exception as e:
        logger.warning(f"[CACHE] Redis connection failed: {e}. Falling back to file cache.")
        _redis_client = None
        return None


def compute_hash(input_data: Dict[str, Any]) -> str:
    """
    Generate a stable, deterministic hash from input data.
    
    The hash is used as the cache key. It must be:
    - Deterministic (same input → same hash)
    - Stable (order-independent)
    - Version-aware (invalidates on prompt changes)
    
    Args:
        input_data: Startup input dictionary (must be JSON-serializable)
        
    Returns:
        Cache key in format: "{version}:{sha256_hash}"
    """
    try:
        # Create a copy to avoid mutating original
        cache_input = dict(input_data)
        
        # Remove fields that should NOT affect cache
        # (These are metadata that don't impact the strategy)
        exclude_keys = {
            'user_id', 'timestamp', 'execution_time_seconds',
            'tokens_used', 'remaining_trials', 'metadata',
            'generatedAt', 'processingTime'
        }
        for key in exclude_keys:
            cache_input.pop(key, None)
        
        # Sort keys for deterministic serialization
        stringified = json.dumps(cache_input, sort_keys=True, ensure_ascii=False)
        
        # Generate SHA-256 hash
        hash_digest = hashlib.sha256(stringified.encode('utf-8')).hexdigest()
        
        # Return versioned key
        cache_key = f"{CACHE_VERSION}:{hash_digest}"
        
        logger.debug(f"[CACHE] Computed hash: {cache_key[:20]}... for input: {cache_input.get('startupName', 'unknown')}")
        return cache_key
        
    except Exception as e:
        logger.error(f"[CACHE] Failed to compute hash: {e}", exc_info=True)
        # Fallback: use timestamp-based key (won't cache effectively, but won't break)
        fallback_key = f"{CACHE_VERSION}:fallback_{int(datetime.now().timestamp())}"
        return fallback_key


def cache_set(key: str, value: Dict[str, Any], ttl: int = 3600) -> bool:
    """
    Store a value in the cache with TTL.
    
    Tries Redis first, falls back to file cache if Redis unavailable.
    
    Args:
        key: Cache key (from compute_hash)
        value: Dictionary to cache (must be JSON-serializable)
        ttl: Time-to-live in seconds (default: 1 hour)
        
    Returns:
        True if successfully cached, False otherwise
    """
    if not key or not value:
        logger.warning("[CACHE] Cannot cache empty key or value")
        return False
    
    try:
        # Add cache metadata
        cached_value = {
            "data": value,
            "cached_at": datetime.now().isoformat(),
            "ttl": ttl,
            "version": CACHE_VERSION
        }
        
        serialized = json.dumps(cached_value, ensure_ascii=False)
        
        # Try Redis first
        redis_client = _get_redis_client()
        if redis_client:
            try:
                redis_client.setex(
                    name=f"finiq:strategy:{key}",
                    time=ttl,
                    value=serialized
                )
                logger.info(f"[CACHE] ✓ Stored in Redis: {key[:20]}... (TTL: {ttl}s)")
                return True
            except Exception as e:
                logger.warning(f"[CACHE] Redis set failed: {e}, falling back to file cache")
        
        # Fallback to file cache
        cache_dir = Path("cache")
        cache_dir.mkdir(exist_ok=True)
        
        cache_file = cache_dir / f"{key}.json"
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cached_value, f, ensure_ascii=False, indent=2)
        
        logger.info(f"[CACHE] ✓ Stored in file: {cache_file.name}")
        return True
        
    except Exception as e:
        logger.error(f"[CACHE] Failed to cache value: {e}", exc_info=True)
        return False


def cache_get(key: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a value from the cache.
    
    Tries Redis first, falls back to file cache if Redis unavailable.
    
    Args:
        key: Cache key (from compute_hash)
        
    Returns:
        Cached dictionary or None if not found/expired/invalid
    """
    if not key:
        logger.warning("[CACHE] Cannot retrieve with empty key")
        return None
    
    try:
        # Try Redis first
        redis_client = _get_redis_client()
        if redis_client:
            try:
                cached_data = redis_client.get(f"finiq:strategy:{key}")
                if cached_data:
                    parsed = json.loads(cached_data)
                    
                    # Validate version
                    if parsed.get("version") != CACHE_VERSION:
                        logger.info(f"[CACHE] ✗ Version mismatch in Redis, skipping cache")
                        return None
                    
                    logger.info(f"[CACHE] ✓ Hit (Redis): {key[:20]}...")
                    return parsed.get("data")
                    
            except json.JSONDecodeError as e:
                logger.error(f"[CACHE] Invalid JSON in Redis cache: {e}")
                return None
            except Exception as e:
                logger.warning(f"[CACHE] Redis get failed: {e}, trying file cache")
        
        # Fallback to file cache
        cache_file = Path("cache") / f"{key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    parsed = json.load(f)
                
                # Validate version
                if parsed.get("version") != CACHE_VERSION:
                    logger.info(f"[CACHE] ✗ Version mismatch in file, deleting stale cache")
                    cache_file.unlink(missing_ok=True)
                    return None
                
                # Check TTL (file cache doesn't auto-expire)
                cached_at = datetime.fromisoformat(parsed.get("cached_at", "2000-01-01"))
                ttl = parsed.get("ttl", 3600)
                age_seconds = (datetime.now() - cached_at).total_seconds()
                
                if age_seconds > ttl:
                    logger.info(f"[CACHE] ✗ Expired file cache (age: {age_seconds:.0f}s > TTL: {ttl}s)")
                    cache_file.unlink(missing_ok=True)
                    return None
                
                logger.info(f"[CACHE] ✓ Hit (File): {cache_file.name}")
                return parsed.get("data")
                
            except json.JSONDecodeError as e:
                logger.error(f"[CACHE] Invalid JSON in file cache: {e}")
                cache_file.unlink(missing_ok=True)
                return None
            except Exception as e:
                logger.error(f"[CACHE] Failed to read file cache: {e}")
                return None
        
        # Cache miss
        logger.info(f"[CACHE] ✗ Miss: {key[:20]}...")
        return None
        
    except Exception as e:
        logger.error(f"[CACHE] Unexpected error in cache_get: {e}", exc_info=True)
        return None


def cache_clear(pattern: Optional[str] = None) -> int:
    """
    Clear cache entries.
    
    Args:
        pattern: Optional pattern to match keys (e.g., "v1:*")
                If None, clears all FinIQ cache entries
    
    Returns:
        Number of entries cleared
    """
    cleared = 0
    
    try:
        # Clear Redis
        redis_client = _get_redis_client()
        if redis_client:
            try:
                if pattern:
                    keys = redis_client.keys(f"finiq:strategy:{pattern}")
                else:
                    keys = redis_client.keys("finiq:strategy:*")
                
                if keys:
                    cleared += redis_client.delete(*keys)
                    logger.info(f"[CACHE] Cleared {cleared} Redis entries")
            except Exception as e:
                logger.error(f"[CACHE] Failed to clear Redis: {e}")
        
        # Clear file cache
        cache_dir = Path("cache")
        if cache_dir.exists():
            for cache_file in cache_dir.glob("*.json"):
                try:
                    cache_file.unlink()
                    cleared += 1
                except Exception as e:
                    logger.error(f"[CACHE] Failed to delete {cache_file}: {e}")
        
        logger.info(f"[CACHE] Total cleared: {cleared} entries")
        return cleared
        
    except Exception as e:
        logger.error(f"[CACHE] Failed to clear cache: {e}", exc_info=True)
        return cleared


def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics for monitoring.
    
    Returns:
        Dictionary with cache stats (size, hits, misses, etc.)
    """
    stats = {
        "redis_available": False,
        "redis_connected": False,
        "file_cache_entries": 0,
        "file_cache_size_mb": 0.0,
        "cache_version": CACHE_VERSION
    }
    
    try:
        # Redis stats
        redis_client = _get_redis_client()
        if redis_client:
            stats["redis_available"] = True
            try:
                redis_client.ping()
                stats["redis_connected"] = True
                
                # Count keys
                keys = redis_client.keys("finiq:strategy:*")
                stats["redis_entries"] = len(keys)
                
            except Exception as e:
                logger.error(f"[CACHE] Failed to get Redis stats: {e}")
        
        # File cache stats
        cache_dir = Path("cache")
        if cache_dir.exists():
            files = list(cache_dir.glob("*.json"))
            stats["file_cache_entries"] = len(files)
            
            total_size = sum(f.stat().st_size for f in files)
            stats["file_cache_size_mb"] = round(total_size / (1024 * 1024), 2)
        
        return stats
        
    except Exception as e:
        logger.error(f"[CACHE] Failed to get cache stats: {e}", exc_info=True)
        return stats


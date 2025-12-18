"""
Redis manager for user metrics tracking.
Handles user generation counts, feedback ratings, and activity timestamps.
"""

import redis
import json
from datetime import datetime
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class RedisMetricsManager:
    """Manages user metrics in Redis with minimal API."""

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize Redis connection for metrics.
        
        Args:
            redis_url: Redis connection URL (defaults to REDIS_URL env var)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            # Test connection
            self.client.ping()
            logger.info(f"[OK] Redis metrics manager connected: {self.redis_url}")
        except Exception as e:
            logger.error(f"[ERROR] Failed to connect to Redis: {e}")
            self.client = None

    def increment_generation_count(self, user_id: str) -> int:
        """
        Increment the generation counter for a user.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            New counter value
        """
        if not self.client:
            return 0
        
        try:
            key = f"user:{user_id}:generations"
            count = self.client.incr(key)
            # Set expiration to 1 year for user metrics
            self.client.expire(key, 365 * 24 * 60 * 60)
            logger.info(f"[OK] User {user_id} generation count: {count}")
            return count
        except Exception as e:
            logger.error(f"[ERROR] Failed to increment generation count: {e}")
            return 0

    def get_generation_count(self, user_id: str) -> int:
        """
        Get the total generation count for a user.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Generation count (0 if not found)
        """
        if not self.client:
            return 0
        
        try:
            key = f"user:{user_id}:generations"
            count = self.client.get(key)
            return int(count) if count else 0
        except Exception as e:
            logger.error(f"[ERROR] Failed to get generation count: {e}")
            return 0

    def add_feedback(self, user_id: str, strategy_id: str, rating: int) -> bool:
        """
        Store feedback rating for a strategy.
        
        Args:
            user_id: Unique user identifier
            strategy_id: Strategy ID to rate
            rating: Rating value (1-5)
            
        Returns:
            Success status
        """
        if not self.client or not (1 <= rating <= 5):
            return False
        
        try:
            key = f"user:{user_id}:feedback"
            # Store as hash: strategy_id -> rating
            self.client.hset(key, strategy_id, rating)
            self.client.expire(key, 365 * 24 * 60 * 60)
            logger.info(f"[OK] User {user_id} rated strategy {strategy_id}: {rating}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to add feedback: {e}")
            return False

    def get_average_rating(self, user_id: str) -> float:
        """
        Calculate average rating across all user strategies.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Average rating (0 if no ratings)
        """
        if not self.client:
            return 0.0
        
        try:
            key = f"user:{user_id}:feedback"
            ratings = self.client.hgetall(key)
            if not ratings:
                return 0.0
            
            ratings_list = [int(r) for r in ratings.values()]
            avg = sum(ratings_list) / len(ratings_list) if ratings_list else 0.0
            return round(avg, 2)
        except Exception as e:
            logger.error(f"[ERROR] Failed to calculate average rating: {e}")
            return 0.0

    def update_last_active(self, user_id: str) -> bool:
        """
        Update the last active timestamp for a user.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Success status
        """
        if not self.client:
            return False
        
        try:
            key = f"user:{user_id}:last_active"
            timestamp = datetime.utcnow().isoformat()
            self.client.set(key, timestamp)
            self.client.expire(key, 365 * 24 * 60 * 60)
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to update last active: {e}")
            return False

    def get_user_metrics(self, user_id: str) -> Dict[str, Any]:
        """
        Get all metrics for a user in one call.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Dictionary with generation_count, average_rating, last_active
        """
        if not self.client:
            return {
                "generation_count": 0,
                "average_rating": 0.0,
                "last_active": None,
            }
        
        try:
            generation_count = self.get_generation_count(user_id)
            average_rating = self.get_average_rating(user_id)
            
            last_active_key = f"user:{user_id}:last_active"
            last_active = self.client.get(last_active_key)
            
            return {
                "generation_count": generation_count,
                "average_rating": average_rating,
                "last_active": last_active,
            }
        except Exception as e:
            logger.error(f"[ERROR] Failed to get user metrics: {e}")
            return {
                "generation_count": 0,
                "average_rating": 0.0,
                "last_active": None,
            }

    def create_session(self, user_id: str, session_data: Dict[str, Any]) -> bool:
        """
        Create a user session in Redis.
        
        Args:
            user_id: Unique user identifier
            session_data: Session data to store
            
        Returns:
            Success status
        """
        if not self.client:
            return False
        
        try:
            key = f"session:{user_id}"
            # Store session data as JSON
            session_json = json.dumps(session_data)
            self.client.set(key, session_json)
            # 30 day TTL for sessions
            self.client.expire(key, 30 * 24 * 60 * 60)
            logger.info(f"[OK] Session created for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to create session: {e}")
            return False

    def get_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data for a user.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Session data dict or None if not found
        """
        if not self.client:
            return None
        
        try:
            key = f"session:{user_id}"
            session_data = self.client.get(key)
            if session_data:
                return json.loads(session_data)
            return None
        except Exception as e:
            logger.error(f"[ERROR] Failed to get session: {e}")
            return None

    def delete_session(self, user_id: str) -> bool:
        """
        Delete a user session.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Success status
        """
        if not self.client:
            return False
        
        try:
            key = f"session:{user_id}"
            self.client.delete(key)
            logger.info(f"[OK] Session deleted for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Failed to delete session: {e}")
            return False


# Global instance
_metrics_manager: Optional[RedisMetricsManager] = None


def get_metrics_manager() -> RedisMetricsManager:
    """Get or create the global metrics manager instance."""
    global _metrics_manager
    if _metrics_manager is None:
        _metrics_manager = RedisMetricsManager()
    return _metrics_manager

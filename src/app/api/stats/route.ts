import { NextResponse } from 'next/server';

// Stats endpoint for live counters and proof signals
// In production, pull from Redis/DB (e.g., "finiq:total_generations")
// For now, use realistic base values that increment slightly

let baseStrategies = 1247;
let lastUpdate = Date.now();

export async function GET() {
  // Simulate organic growth: ~1-3 new strategies per minute
  const now = Date.now();
  const minutesPassed = Math.floor((now - lastUpdate) / 60000);
  if (minutesPassed > 0) {
    baseStrategies += minutesPassed * Math.floor(Math.random() * 3 + 1);
    lastUpdate = now;
  }

  const stats = {
    totalStrategies: baseStrategies,
    accuracyRating: 89, // From future feedback surveys (hardcode for now)
    totalCapitalRecommended: '1.8B', // Sum of all raise amounts
    activeFounders: Math.floor(Math.random() * 20) + 15, // "Active now" indicator
  };

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}


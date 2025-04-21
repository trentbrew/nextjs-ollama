export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { fetchWeather } from '@/utils/weather';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const unitParam = searchParams.get('unit');
    const unit = unitParam === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    if (!location) {
      return new Response(
        JSON.stringify({ error: 'Missing location parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    const data = await fetchWeather(location, unit);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API /weather error:', error);
    const status = /not found/i.test(error.message) ? 404 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

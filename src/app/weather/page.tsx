'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { clearWeatherCache } from '@/utils/weather';

export default function WeatherPage() {
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    clearWeatherCache();
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `/api/weather?location=${encodeURIComponent(location)}&unit=${unit}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error fetching weather');
      setData(json);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Weather Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div className="space-y-2">
            <RadioGroup
              value={unit}
              onValueChange={(val: 'celsius' | 'fahrenheit') => setUnit(val)}
            >
              <label className="inline-flex items-center mr-4">
                <RadioGroupItem value="celsius" />
                <span className="ml-2">Celsius</span>
              </label>
              <label className="inline-flex items-center">
                <RadioGroupItem value="fahrenheit" />
                <span className="ml-2">Fahrenheit</span>
              </label>
            </RadioGroup>
          </div>
          <Button onClick={handleFetch} disabled={!location}>
            Fetch Weather
          </Button>
          {error && <p className="text-red-500">{error}</p>}
          {data && (
            <div className="space-y-1">
              <p>
                <strong>Location:</strong> {data.location}
              </p>
              <p>
                <strong>Temperature:</strong> {data.temperature}°
                {unit === 'celsius' ? 'C' : 'F'}
              </p>
              <p>
                <strong>Conditions:</strong> {data.conditions}
              </p>
              <p>
                <strong>Time:</strong> {data.time}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

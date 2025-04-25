import React from 'react';

// Define the expected props based on the getWeather tool's result
export interface WeatherWidgetProps {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  conditions: string;
  time: string; // ISO 8601 format string
  unit: 'celsius' | 'fahrenheit';
}

// Basic weather widget component
export default function WeatherWidget({
  props,
}: {
  props: WeatherWidgetProps;
}) {
  const { location, temperature, conditions, windspeed, winddirection, unit } =
    props;

  const tempUnit = unit === 'fahrenheit' ? '°F' : '°C';

  return (
    <div className="p-4 my-2 border rounded-lg bg-secondary/50 text-secondary-foreground shadow-md">
      <h3 className="font-semibold text-lg mb-2">Weather in {location}</h3>
      <div className="flex justify-between items-center">
        <p className="text-4xl font-bold">
          {temperature.toFixed(1)}
          {tempUnit}
        </p>
        {/* TODO: Add weather icon based on conditions/weathercode */}
        <p className="capitalize text-lg">{conditions}</p>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">
        <p>
          Wind: {windspeed.toFixed(1)} {unit === 'fahrenheit' ? 'mph' : 'km/h'}{' '}
          at {winddirection}°
        </p>
        {/* TODO: Add more details like humidity, pressure if available/desired */}
      </div>
    </div>
  );
}

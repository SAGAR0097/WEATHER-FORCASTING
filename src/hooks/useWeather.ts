import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types';

export function useWeather(lat: number, lon: number, unit: 'celsius' | 'fahrenheit' = 'celsius') {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (isNaN(lat) || isNaN(lon)) {
      setError("Invalid location coordinates");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unitParam = unit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';
      // Using best_match for maximum accuracy
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&models=best_match${unitParam}&_=${Date.now()}`
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.reason || "Failed to fetch weather data");
      }
      
      const json = await res.json();
      
      if (!json.current || !json.daily) {
        throw new Error("Incomplete weather data received");
      }
      
      setData({
        temperature: json.current.temperature_2m,
        weatherCode: json.current.weather_code,
        windSpeed: json.current.wind_speed_10m,
        humidity: json.current.relative_humidity_2m,
        apparentTemperature: json.current.apparent_temperature,
        time: json.current.time,
        daily: {
          time: json.daily.time,
          temperatureMax: json.daily.temperature_2m_max,
          temperatureMin: json.daily.temperature_2m_min,
          weatherCode: json.daily.weather_code,
        }
      });
      setError(null);
    } catch (err: any) {
      console.error("Weather Fetch Error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [lat, lon, unit]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { data, loading, error, refresh: fetchWeather };
}

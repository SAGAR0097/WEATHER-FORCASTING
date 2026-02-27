import { motion } from 'motion/react';
import { Star, Trash2, Wind, Thermometer, Cloud, Sun, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, RefreshCw, Sparkles } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { WEATHER_INTERPRETATION } from '../lib/utils';
import { City } from '../types';
import { useState, useEffect } from 'react';
import { getWeatherInsights } from '../services/geminiService';

const ICON_MAP: Record<string, any> = {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning
};

interface WeatherCardProps {
  city: City;
  unit: 'celsius' | 'fahrenheit';
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

export function WeatherCard({ city, unit, onDelete, onToggleFavorite }: WeatherCardProps) {
  const { data, loading, error, refresh } = useWeather(city.lat, city.lon, unit);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const unitLabel = unit === 'celsius' ? 'C' : 'F';

  useEffect(() => {
    let mounted = true;
    const apiKey = process.env.GEMINI_API_KEY;
    const hasApiKey = apiKey && apiKey !== "undefined" && apiKey !== "";

    if (data && !insight && !loadingInsight) {
      if (!hasApiKey) {
        setInsight("Check the forecast and plan your day accordingly!");
        return;
      }

      setLoadingInsight(true);
      getWeatherInsights(data, city.name).then(res => {
        if (mounted) {
          setInsight(res || null);
          setLoadingInsight(false);
        }
      }).catch(err => {
        console.error("Insight error:", err);
        if (mounted) setLoadingInsight(false);
      });
    }
    return () => { mounted = false; };
  }, [data, city.name, insight, loadingInsight]);

  const handleRefresh = () => {
    setInsight(null); // Clear insight to trigger re-generation if needed
    refresh();
  };

  if (loading && !data) return (
    <div className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
  );

  if (error && !data) return (
    <div className="h-64 bg-white border border-red-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <h3 className="text-slate-900 font-bold">{city.name}</h3>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={handleRefresh}
        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const weatherInfo = data ? (WEATHER_INTERPRETATION[data.weatherCode] || { label: "Unknown", icon: "Cloud" }) : { label: "Loading...", icon: "Cloud" };
  const WeatherIcon = ICON_MAP[weatherInfo.icon] || Cloud;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-sky-200 transition-all duration-500 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold text-slate-900">{city.name}</h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Live data" />
          </div>
          <p className="text-slate-500 text-sm">{weatherInfo.label}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-full bg-slate-50 text-slate-300 hover:text-sky-600 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="Refresh weather"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleFavorite(city.id, !!city.is_favorite)}
            className={`p-2 rounded-full transition-colors ${city.is_favorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300 hover:text-slate-600'}`}
          >
            <Star className={`w-5 h-5 ${city.is_favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onDelete(city.id)}
            className="p-2 rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="flex items-center gap-6 mb-8">
            <div className="p-4 bg-sky-50 rounded-2xl">
              <WeatherIcon className="w-12 h-12 text-sky-500" />
            </div>
            <div>
              <div className="text-5xl font-black text-slate-900">{(data.temperature ?? 0).toFixed(1)}°{unitLabel}</div>
              <div className="flex gap-3 text-xs text-slate-400 font-mono mt-1">
                <span>H: {(data.daily?.temperatureMax?.[0] ?? 0).toFixed(1)}°{unitLabel}</span>
                <span>L: {(data.daily?.temperatureMin?.[0] ?? 0).toFixed(1)}°{unitLabel}</span>
              </div>
              <div className="text-[10px] text-slate-300 mt-2 font-medium uppercase tracking-tighter">
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
              <Wind className="w-4 h-4 text-sky-500" />
              <div className="text-sm text-slate-600">{(data.windSpeed ?? 0)} km/h</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
              <Thermometer className="w-4 h-4 text-sky-500" />
              <div className="text-sm text-slate-600">Feels {Math.round(data.apparentTemperature ?? data.temperature ?? 0)}°{unitLabel}</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
              <Cloud className="w-4 h-4 text-sky-500" />
              <div className="text-sm text-slate-600">Hum {(data.humidity ?? 0)}%</div>
            </div>
          </div>

          {/* AI Insight Section */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SkyCast AI Insight</span>
            </div>
            {loadingInsight ? (
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{insight || 'Analyzing weather patterns for localized advice...'}"
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

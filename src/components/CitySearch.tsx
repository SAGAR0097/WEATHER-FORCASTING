import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface CitySearchProps {
  onSelect: (city: { name: string; lat: number; lon: number }) => void;
}

export function CitySearch({ onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-8">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city..."
          className="w-full px-4 py-3 pl-12 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-500 w-5 h-5 animate-spin" />}
      </form>

      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
          {results.map((city) => (
            <button
              key={`${city.latitude}-${city.longitude}`}
              onClick={() => {
                onSelect({ name: city.name, lat: city.latitude, lon: city.longitude });
                setResults([]);
                setQuery('');
              }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-left text-slate-700 transition-colors border-b border-slate-100 last:border-0"
            >
              <MapPin className="w-4 h-4 text-sky-500" />
              <div>
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-slate-400">{city.admin1}, {city.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

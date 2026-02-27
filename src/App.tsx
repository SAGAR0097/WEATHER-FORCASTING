import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { CitySearch } from './components/CitySearch';
import { WeatherCard } from './components/WeatherCard';
import { LogOut, CloudRain, User as UserIcon, Plus, LayoutDashboard, Star, Sparkles, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { City } from './types';

export default function App() {
  const { user, token, login, logout, loading: authLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchCities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCities(data);
      } else {
        console.error("Expected array of cities, got:", data);
        setCities([]);
      }
    } catch (err) {
      console.error(err);
      setCities([]);
    }
  }, [token]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.');
        return;
      }
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error("Non-JSON response received:", text);
        setError('Server returned an invalid response. Please check if the backend is running.');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Something went wrong');
    }
  };

  const addCity = async (cityData: { name: string; lat: number; lon: number }) => {
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cityData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.alreadyExists) {
          // If city already exists, we just refresh the list to ensure it's visible
          // and maybe scroll to it or just show it's there.
          fetchCities();
        } else {
          fetchCities();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCity = async (id: string) => {
    try {
      const res = await fetch(`/api/cities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCities(cities.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllCities = async () => {
    if (!window.confirm('Are you sure you want to delete ALL cities from your dashboard? This cannot be undone.')) return;
    setIsDeletingAll(true);
    console.log("Frontend: Sending DELETE request to /api/cities");
    try {
      const res = await fetch('/api/cities', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("Frontend: DELETE response status:", res.status);
      if (res.ok) {
        setCities([]);
        console.log("Frontend: Cities state cleared");
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Frontend: DELETE failed:", errorData);
        alert(`Failed to delete cities: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Frontend: DELETE error:", err);
      alert('Network error while deleting cities');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/cities/${id}/favorite`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_favorite: !current })
      });
      if (res.ok) {
        setCities(cities.map(c => c.id === id ? { ...c, is_favorite: current ? 0 : 1 } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-[2rem] shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-4">
              <CloudRain className="w-8 h-8 text-sky-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">SkyCast</h1>
            <p className="text-slate-400 text-sm mt-1">Weather Forecasting</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-sky-600/20"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </motion.div>
      </div>
    );
  }

  const favoriteCities = Array.isArray(cities) ? cities.filter(c => c.is_favorite) : [];
  const otherCities = Array.isArray(cities) ? cities.filter(c => !c.is_favorite) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-500/30">
      {/* Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-sky-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <CloudRain className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">SkyCast</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setUnit('celsius')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'celsius' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  °C
                </button>
                <button
                  onClick={() => setUnit('fahrenheit')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${unit === 'fahrenheit' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  °F
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <UserIcon className="w-3 h-3 text-sky-600" />
                <span className="text-xs font-medium text-slate-600">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl border border-slate-200 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <header className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-slate-900"
          >
            Welcome back <span className="text-sky-600">{user.username}</span>
          </motion.h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Manage your global weather dashboard and favorite locations.
          </p>
        </header>

        <CitySearch onSelect={addCity} />

        {/* Dashboard Sections */}
        <div className="space-y-16">
          {/* Favorites */}
          {favoriteCities.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Favorite Locations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {favoriteCities.map(city => (
                    <WeatherCard 
                      key={city.id} 
                      city={city} 
                      unit={unit}
                      onDelete={deleteCity} 
                      onToggleFavorite={toggleFavorite} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* All Cities */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <LayoutDashboard className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Your Dashboard</h3>
              </div>
              
              
            </div>
            
            {cities.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                <Plus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No cities added yet. Search for a city to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {otherCities.map(city => (
                    <WeatherCard 
                      key={city.id} 
                      city={city} 
                      unit={unit}
                      onDelete={deleteCity} 
                      onToggleFavorite={toggleFavorite} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Powered by SkyCast Weather Forecast</span>
          </div>
          <p className="text-slate-300 text-[10px] uppercase tracking-widest">
            &copy; 2026 Weather Systems. All rights reserved.
          </p>
        </div>
      </footer> 
    </div>
  );
}

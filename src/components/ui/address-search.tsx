'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Loader2, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressSearchProps {
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

/**
 * @fileOverview An elite address search component powered by Nominatim (OpenStreetMap).
 * Provides free-form global address lookup without Google dependencies.
 */
export function AddressSearch({ onSelect, placeholder, className, defaultValue }: AddressSearchProps) {
  const [query, setQuery] = useState(defaultValue || '');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (val: string) => {
    if (val.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Soma-Ecosystem-Builder',
          },
        }
      );
      const data = await response.json();
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Address search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchAddress(val), 500);
  };

  const handleSelect = (result: AddressResult) => {
    setQuery(result.display_name);
    setIsOpen(false);
    onSelect(result);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || "Search for verified warehouse address..."}
          className="pl-10 h-12 border-primary/20 bg-slate-950/50"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl bg-slate-900 border border-primary/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ul className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {results.map((result, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors flex items-start gap-3 group"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-1 opacity-40 group-hover:opacity-100" />
                  <span className="text-sm text-slate-200 line-clamp-2">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

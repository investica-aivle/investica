import { useState, useEffect, useRef } from 'react';

interface StockSearchResult {
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX';
}

interface StockSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onStockSelect: (stock: { code: string; name: string }) => void;
  placeholder?: string;
}

export function StockSearchInput({
  value,
  onChange,
  onStockSelect,
  placeholder = "종목명 또는 코드 입력"
}: StockSearchInputProps) {
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 자동완성 검색 디바운스
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim() && value.trim().length >= 1) {
        searchStocks(value.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/stock/search?query=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) {
        throw new Error(`검색 API 호출 실패: ${response.status}`);
      }

      const results: StockSearchResult[] = await response.json();
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('종목 검색 실패:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: StockSearchResult) => {
    onStockSelect({
      code: suggestion.code,
      name: suggestion.name
    });
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onStockSelect({ code: '', name: value });
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onStockSelect({ code: '', name: value });
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        ref={searchInputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onFocus={handleInputFocus}
        className="w-full bg-zinc-800/50 border border-zinc-600/30 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
        placeholder={placeholder}
        autoComplete="off"
      />

      {/* 로딩 스피너 */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* 자동완성 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-zinc-800/95 backdrop-blur-md border border-zinc-600/30 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.code}-${suggestion.name}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-600/50 text-white'
                  : 'text-gray-100 hover:bg-zinc-700/50'
              } ${index === 0 ? 'rounded-t-xl' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{suggestion.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{suggestion.code}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    suggestion.market === 'KOSPI' 
                      ? 'bg-blue-600/30 text-blue-300' 
                      : suggestion.market === 'KOSDAQ'
                      ? 'bg-green-600/30 text-green-300'
                      : 'bg-purple-600/30 text-purple-300'
                  }`}>
                    {suggestion.market}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

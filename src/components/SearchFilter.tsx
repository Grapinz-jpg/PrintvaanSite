import React from 'react';
import { Search } from 'lucide-react';

interface SearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function SearchFilter({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
}: SearchFilterProps) {
  const categories = ['All', 'Normal flex', 'Star flex', 'Back light', 'Vinyl', 'Sun pack printing'];

  return (
    <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
      {/* Search Bar */}
      <div className="bg-white rounded-full shadow-xl p-2 flex items-center border border-gray-100">
        <div className="pl-4 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search for banners, vinyl, sunpack..."
          className="w-full px-4 py-3 outline-none text-gray-700 placeholder-gray-400 font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-colors hidden sm:block">
          Search
        </button>
      </div>

      {/* Category Filters */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${
              activeCategory === category
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-600 hover:text-orange-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

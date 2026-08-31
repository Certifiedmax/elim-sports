"use client";

export const CATEGORIES = [
  "All",
  "Footwear",
  "Rackets & Paddles",
  "Jerseys & Kits",
  "Apparel & Gym",
  "Accessories & Gear",
] as const;

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function CategoryFilter({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: CategoryFilterProps) {
  return (
    <div className="w-full space-y-3.5 my-4">
      {/* Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search boots, rackets, jerseys, tracksuits, or sizes..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontally Scrollable Category Pills */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-black shadow-md scale-105"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
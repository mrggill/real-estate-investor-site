// src/app/news/page.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  summary?: string;
  date: string;
  city?: string;
  state?: string;
  url?: string;
  content?: string;
  source_url?: string;
}

interface DropdownOption {
  value: string;
  label: string;
  selected: boolean;
}

export default function NewsPage() {
  const router = useRouter();
  
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State filter changed to a multi-select
  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  // City filter changed to a multi-select dependent on state
  const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Show/hide dropdown states
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Function to get unique states from articles
  const getUniqueStates = (articles: Article[]) => {
    const states = articles
      .map(article => article.state)
      .filter((state): state is string => !!state) // Filter out undefined/null
      .filter((value, index, self) => self.indexOf(value) === index) // Get unique values
      .sort();
    
    return states.map(state => ({
      value: state,
      label: state,
      selected: false
    }));
  };

  // Function to get unique cities from articles based on selected states
  const getUniqueCities = (articles: Article[], selectedStates: string[]) => {
    // If no states selected, show no cities
    if (selectedStates.length === 0) return [];
    
    const cities = articles
      .filter(article => article.state && selectedStates.includes(article.state))
      .map(article => article.city)
      .filter((city): city is string => !!city) // Filter out undefined/null
      .filter((value, index, self) => self.indexOf(value) === index) // Get unique values
      .sort();
    
    return cities.map(city => ({
      value: city,
      label: city,
      selected: false
    }));
  };

  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    // Fetch articles
    fetch('/api/news')
      .then(response => response.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
        
        // Initialize state options
        const states = getUniqueStates(data);
        setStateOptions(states);
      })
      .catch(error => {
        console.error('Error fetching articles:', error);
        setLoading(false);
      });
  }, []);
  
  // Update city options when selected states change
  useEffect(() => {
    const cities = getUniqueCities(articles, selectedStates);
    setCityOptions(cities);
    // Clear selected cities when states change
    setSelectedCities([]);
  }, [selectedStates, articles]);

  // Toggle state selection
  const toggleStateSelection = (stateValue: string) => {
    if (selectedStates.includes(stateValue)) {
      setSelectedStates(selectedStates.filter(state => state !== stateValue));
    } else {
      setSelectedStates([...selectedStates, stateValue]);
    }
  };
  
  // Toggle city selection
  const toggleCitySelection = (cityValue: string) => {
    if (selectedCities.includes(cityValue)) {
      setSelectedCities(selectedCities.filter(city => city !== cityValue));
    } else {
      setSelectedCities([...selectedCities, cityValue]);
    }
  };

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (article.content && 
          article.content.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesState = selectedStates.length === 0 || 
        (article.state && selectedStates.includes(article.state));
      
      const matchesCity = selectedCities.length === 0 || 
        (article.city && selectedCities.includes(article.city));
      
      return matchesSearch && matchesState && matchesCity;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Format date: Wed Dec 13 2023 -> Dec 13, 2023
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if summary is similar to content beginning
  const isSummarySimilarToContent = (summary?: string, content?: string) => {
    if (!summary || !content) return false;
    
    // Strip any HTML tags that might be present
    const cleanSummary = summary.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "").trim();
    
    // Convert to lowercase for case-insensitive comparison
    const lowerSummary = cleanSummary.toLowerCase();
    const lowerContent = cleanContent.toLowerCase().substring(0, 300);
    
    // Check if one is a subset of the other, with some flexibility
    return lowerContent.includes(lowerSummary) || 
           lowerSummary.includes(lowerContent.substring(0, 100)) ||
           // Check for high similarity
           (lowerSummary.length > 20 && 
            lowerContent.substring(0, lowerSummary.length).includes(lowerSummary.substring(0, 20)));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Real Estate News</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchQuery || selectedStates.length > 0 || selectedCities.length > 0 
                  ? `Showing ${filteredArticles.length} after filtering.`
                  : `Found ${articles.length} articles.`
                }
              </p>
              
              {/* Filter Controls - Single-row layout */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Search input */}
                <div className="flex-grow min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Sort order dropdown */}
                <div className="w-[150px]">
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                
                {/* State Multi-select Dropdown */}
                <div className="relative w-[180px]">
                  <button 
                    onClick={() => {
                      setStateDropdownOpen(!stateDropdownOpen);
                      setCityDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {selectedStates.length === 0 
                      ? "Select States..." 
                      : `${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''}`}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>
                  
                  {stateDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-60 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                      {stateOptions.length > 0 ? (
                        stateOptions.map((option) => (
                          <div 
                            key={option.value}
                            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleStateSelection(option.value)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStates.includes(option.value)}
                              onChange={() => {}}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 block truncate">{option.label}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No states available</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* City dropdown */}
                <div className="relative w-[180px]">
                  <button 
                    onClick={() => {
                      setCityDropdownOpen(!cityDropdownOpen);
                      setStateDropdownOpen(false);
                    }}
                    disabled={selectedStates.length === 0}
                    className={`w-full px-4 py-2 text-left border border-gray-300 rounded-md shadow-sm focus:outline-none ${
                      selectedStates.length > 0 
                        ? "focus:ring-blue-500 focus:border-blue-500 bg-white" 
                        : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {selectedStates.length === 0 
                      ? "Select Cities..." 
                      : selectedCities.length === 0 
                        ? "Select Cities..." 
                        : `${selectedCities.length} ${selectedCities.length === 1 ? 'city' : 'cities'}`}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </button>
                  
                  {cityDropdownOpen && selectedStates.length > 0 && (
                    <div className="absolute z-10 mt-1 w-60 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                      {cityOptions.length > 0 ? (
                        cityOptions.map((option) => (
                          <div 
                            key={option.value}
                            className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleCitySelection(option.value)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCities.includes(option.value)}
                              onChange={() => {}}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 block truncate">{option.label}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No cities available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        <Link href={`/news/${article.id}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(article.date)}
                      </span>
                    </div>
                    
                    {/* Content - always show this */}
                    {article.content && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {article.content.substring(0, 200)}
                        {article.content.length > 200 ? '...' : ''}
                      </p>
                    )}
                    
                    {/* Only show summary if it exists AND is significantly different from content */}
                    {article.summary && !isSummarySimilarToContent(article.summary, article.content) && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2 mb-3 text-sm italic">
                        Summary: {article.summary}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/news/${article.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Read more →
                      </Link>
                      
                      {article.city && article.state && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {article.city}, {article.state}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No articles found matching your criteria.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
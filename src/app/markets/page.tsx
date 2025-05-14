"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Sample market data
const MARKET_DATA = [
  {
    id: "1",
    city: "Indianapolis",
    state: "IN",
    population: 887642,
    populationGrowth: 0.8,
    medianHomePrice: 225000,
    priceToRentRatio: 12.5,
    cashFlowPotential: "High",
    averageRentalYield: 7.9,
    appreciationLast5Years: 34.2,
    appreciationProjection: "Moderate",
    jobGrowth: 1.5,
    vacancyRate: 3.8,
    thumbnail: "https://via.placeholder.com/500x300?text=Indianapolis",
    overview: "Indianapolis offers strong cash flow with reasonable property prices and solid rental demand driven by major employers and universities."
  },
  {
    id: "2",
    city: "Columbus",
    state: "OH",
    population: 905748,
    populationGrowth: 1.2,
    medianHomePrice: 248000,
    priceToRentRatio: 13.2,
    cashFlowPotential: "High",
    averageRentalYield: 7.5,
    appreciationLast5Years: 38.7,
    appreciationProjection: "Moderate",
    jobGrowth: 1.8,
    vacancyRate: 4.1,
    thumbnail: "https://via.placeholder.com/500x300?text=Columbus",
    overview: "Columbus features a diverse economy with strong education and healthcare sectors, providing stable rental demand and solid returns for investors."
  },
  {
    id: "3",
    city: "Charlotte",
    state: "NC",
    population: 874579,
    populationGrowth: 1.8,
    medianHomePrice: 335000,
    priceToRentRatio: 16.8,
    cashFlowPotential: "Moderate",
    averageRentalYield: 5.9,
    appreciationLast5Years: 52.3,
    appreciationProjection: "Strong",
    jobGrowth: 2.4,
    vacancyRate: 4.5,
    thumbnail: "https://via.placeholder.com/500x300?text=Charlotte",
    overview: "Charlotte's strong financial sector and consistent population growth make it an excellent market for appreciation-focused investment strategies."
  },
  {
    id: "4",
    city: "Jacksonville",
    state: "FL",
    population: 949611,
    populationGrowth: 1.5,
    medianHomePrice: 295000,
    priceToRentRatio: 14.8,
    cashFlowPotential: "Moderate",
    averageRentalYield: 6.7,
    appreciationLast5Years: 43.8,
    appreciationProjection: "Strong",
    jobGrowth: 2.1,
    vacancyRate: 5.2,
    thumbnail: "https://via.placeholder.com/500x300?text=Jacksonville",
    overview: "Jacksonville offers a good balance of cash flow and appreciation potential, with a growing economy and favorable landlord regulations."
  },
  {
    id: "5",
    city: "Memphis",
    state: "TN",
    population: 651073,
    populationGrowth: 0.2,
    medianHomePrice: 168000,
    priceToRentRatio: 9.8,
    cashFlowPotential: "Very High",
    averageRentalYield: 10.2,
    appreciationLast5Years: 28.6,
    appreciationProjection: "Low",
    jobGrowth: 0.9,
    vacancyRate: 6.5,
    thumbnail: "https://via.placeholder.com/500x300?text=Memphis",
    overview: "Memphis provides excellent cash flow opportunities with low entry prices, though investors should be selective about neighborhoods and property management."
  },
  {
    id: "6",
    city: "Phoenix",
    state: "AZ",
    population: 1680992,
    populationGrowth: 1.7,
    medianHomePrice: 410000,
    priceToRentRatio: 18.5,
    cashFlowPotential: "Low",
    averageRentalYield: 5.4,
    appreciationLast5Years: 75.2,
    appreciationProjection: "Moderate",
    jobGrowth: 2.6,
    vacancyRate: 3.9,
    thumbnail: "https://via.placeholder.com/500x300?text=Phoenix",
    overview: "Phoenix has experienced tremendous growth and appreciation, though recent price increases have reduced cash flow potential for new investors."
  },
  {
    id: "7",
    city: "Kansas City",
    state: "MO",
    population: 508090,
    populationGrowth: 0.6,
    medianHomePrice: 225000,
    priceToRentRatio: 12.8,
    cashFlowPotential: "High",
    averageRentalYield: 7.8,
    appreciationLast5Years: 39.4,
    appreciationProjection: "Moderate",
    jobGrowth: 1.3,
    vacancyRate: 4.8,
    thumbnail: "https://via.placeholder.com/500x300?text=KansasCity",
    overview: "Kansas City offers affordable housing with good rental yields, with a stable economy anchored by healthcare, government, and education sectors."
  },
  {
    id: "8",
    city: "Tampa",
    state: "FL",
    population: 392890,
    populationGrowth: 1.4,
    medianHomePrice: 375000,
    priceToRentRatio: 17.2,
    cashFlowPotential: "Low",
    averageRentalYield: 5.8,
    appreciationLast5Years: 58.6,
    appreciationProjection: "Strong",
    jobGrowth: 2.5,
    vacancyRate: 4.2,
    thumbnail: "https://via.placeholder.com/500x300?text=Tampa",
    overview: "Tampa has seen strong price appreciation driven by in-migration, though investors now need to be more selective to find cash-flowing properties."
  },
  {
    id: "9",
    city: "Cleveland",
    state: "OH",
    population: 372624,
    populationGrowth: -0.1,
    medianHomePrice: 115000,
    priceToRentRatio: 7.9,
    cashFlowPotential: "Very High",
    averageRentalYield: 12.6,
    appreciationLast5Years: 24.8,
    appreciationProjection: "Low",
    jobGrowth: 0.4,
    vacancyRate: 6.8,
    thumbnail: "https://via.placeholder.com/500x300?text=Cleveland",
    overview: "Cleveland offers some of the highest cash flow opportunities in the country, though investors should focus on stable neighborhoods with good tenant bases."
  }
];

export default function MarketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [investmentGoal, setInvestmentGoal] = useState('all');
  const [populationMin, setPopulationMin] = useState(0);
  const [rentalYieldMin, setRentalYieldMin] = useState(0);
  
  // Filter markets
  const filteredMarkets = MARKET_DATA.filter(market => {
    const matchesSearch = market.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         market.state.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGoal = investmentGoal === 'all' || 
                      (investmentGoal === 'cashflow' && market.averageRentalYield >= 7) ||
                      (investmentGoal === 'appreciation' && market.appreciationProjection === 'Strong') ||
                      (investmentGoal === 'balanced' && market.averageRentalYield >= 6 && market.appreciationProjection !== 'Low');
    
    const matchesPopulation = market.population >= populationMin;
    const matchesRentalYield = market.averageRentalYield >= rentalYieldMin;
    
    return matchesSearch && matchesGoal && matchesPopulation && matchesRentalYield;
  });
  
  // Sort markets (can expand this with multiple sort options)
  const sortedMarkets = [...filteredMarkets].sort((a, b) => b.averageRentalYield - a.averageRentalYield);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">U.S. Market Research</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Home
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Find Your Ideal Investment Market</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Explore comprehensive data on over 400 real estate markets across the United States. Filter by your investment criteria to find the perfect market for your strategy.
          </p>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by city or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Markets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Investment Goal
                  </label>
                  <select
                    value={investmentGoal}
                    onChange={(e) => setInvestmentGoal(e.target.value)}
                    className="form-input w-full"
                  >
                    <option value="all">All Strategies</option>
                    <option value="cashflow">Cash Flow Focus</option>
                    <option value="appreciation">Appreciation Focus</option>
                    <option value="balanced">Balanced Approach</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Population
                  </label>
                  <select
                    value={populationMin}
                    onChange={(e) => setPopulationMin(Number(e.target.value))}
                    className="form-input w-full"
                  >
                    <option value={0}>Any</option>
                    <option value={100000}>100,000+</option>
                    <option value={500000}>500,000+</option>
                    <option value={1000000}>1 million+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Rental Yield
                  </label>
                  <select
                    value={rentalYieldMin}
                    onChange={(e) => setRentalYieldMin(Number(e.target.value))}
                    className="form-input w-full"
                  >
                    <option value={0}>Any</option>
                    <option value={5}>5%+</option>
                    <option value={7}>7%+</option>
                    <option value={9}>9%+</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setInvestmentGoal('all');
                    setPopulationMin(0);
                    setRentalYieldMin(0);
                  }}
                  className="btn btn-secondary mr-2"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Found {sortedMarkets.length} markets matching your criteria
          </p>
        </div>
        
        {sortedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMarkets.map(market => (
              <Link href={`/markets/${market.id}`} key={market.id}>
                <div className="card overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                  <div className="h-40 bg-gray-200 dark:bg-gray-700">
                    <img 
                      src={market.thumbnail} 
                      alt={`${market.city}, ${market.state}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {market.city}, {market.state}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                        market.cashFlowPotential === 'Very High' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        market.cashFlowPotential === 'High' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        market.cashFlowPotential === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {market.cashFlowPotential} Cash Flow
                      </span>
                      
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                        market.appreciationProjection === 'Strong' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        market.appreciationProjection === 'Moderate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {market.appreciationProjection} Appreciation
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {market.overview}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span>Median Price</span>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${market.
                          <div className="font-medium text-gray-900 dark:text-white">
                          ${market.medianHomePrice.toLocaleString()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          <span>Rental Yield</span>
                        </div>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {market.averageRentalYield}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <HomeIcon className="h-4 w-4 mr-1" />
                          <span>Vacancy Rate</span>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {market.vacancyRate}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                          <span>5-Yr Apprec.</span>
                        </div>
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          {market.appreciationLast5Years}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 text-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        View Full Market Report
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No markets found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your filters to see more markets.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setInvestmentGoal('all');
                setPopulationMin(0);
                setRentalYieldMin(0);
              }}
              className="mt-4 btn btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
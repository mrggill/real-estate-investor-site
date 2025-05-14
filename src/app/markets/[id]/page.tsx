"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// Sample market data (same as on the markets page)
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
    overview: "Indianapolis offers strong cash flow with reasonable property prices and solid rental demand driven by major employers and universities.",
    description: "Indianapolis, the capital of Indiana, represents an excellent market for real estate investors seeking strong cash flow with moderate appreciation potential. The city's diverse economy is anchored by healthcare, education, finance, and manufacturing sectors, providing a stable employment base.\n\nProperty prices remain affordable compared to national averages, while rental rates have been steadily increasing, creating favorable conditions for cash flow investors. The city's revitalized downtown, expanding tech scene, and quality of life improvements have contributed to consistent population growth.\n\nIndianapolis features several distinct submarkets, from urban core neighborhoods experiencing revitalization to stable suburban areas with strong school districts. The presence of multiple universities, including Indiana University-Purdue University Indianapolis, creates reliable rental demand from students, faculty, and healthcare professionals.",
    neighborhoodData: [
      {
        name: "Downtown/Mass Ave",
        medianPrice: 275000,
        rentalYield: 6.8,
        overview: "Urban core with strong appreciation potential and growing rental demand from young professionals."
      },
      {
        name: "Broad Ripple",
        medianPrice: 310000,
        rentalYield: 6.2,
        overview: "Popular area with shops, restaurants, and entertainment. Strong rental demand but higher entry prices."
      },
      {
        name: "Irvington",
        medianPrice: 195000,
        rentalYield: 8.1,
        overview: "Historic neighborhood experiencing revitalization with excellent cash flow potential."
      },
      {
        name: "Lawrence",
        medianPrice: 180000,
        rentalYield: 8.5,
        overview: "Suburban area with lower prices and strong rental demand, offering higher yields."
      }
    ],
    propertyManagement: {
      averageFee: "8-10% of monthly rent",
      availability: "High - numerous professional firms available",
      typicalServices: ["Tenant screening", "Rent collection", "Maintenance coordination", "Legal compliance", "Financial reporting"],
      remoteInvestorFriendly: true
    },
    marketStrengths: [
      "Affordable property prices with solid rental income potential",
      "Diverse economy with multiple major employers",
      "Landlord-friendly regulations compared to many states",
      "Good availability of property management companies experienced with out-of-state investors",
      "Multiple price points from urban condos to suburban single-family homes"
    ],
    marketChallenges: [
      "Property tax rates can be relatively high in some areas",
      "Weather extremes can increase maintenance costs",
      "Some neighborhoods have higher crime rates requiring careful location selection",
      "Appreciation rates historically lower than national average"
    ],
    rentalDemandDrivers: [
      "Major healthcare employers including Eli Lilly and IU Health",
      "Universities and colleges bringing student population",
      "State government offices and related services",
      "Growing tech sector including Salesforce regional headquarters",
      "Affordability attracting residents priced out of more expensive markets"
    ],
    keyMetrics: {
      price_to_rent_ratio: 12.5,
      price_to_income_ratio: 2.8,
      unemployment_rate: 3.5,
      crime_index: "Moderate (varies by neighborhood)",
      walk_score: 32,
      transit_score: 24,
      average_days_on_market: 13
    }
  },
  // More markets data here from previous list...
];

export default function MarketDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const [market, setMarket] = useState(MARKET_DATA.find(m => m.id === id));
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!market) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Market Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sorry, the market you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/markets"
            className="btn btn-primary"
          >
            Browse All Markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/markets" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Markets
          </Link>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${
            market.cashFlowPotential === 'Very High' || market.cashFlowPotential === 'High' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
              : market.appreciationProjection === 'Strong' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
          }`}>
            {market.cashFlowPotential === 'Very High' || market.cashFlowPotential === 'High' 
              ? 'Cash Flow Market' 
              : market.appreciationProjection === 'Strong' 
                ? 'Appreciation Market' 
                : 'Balanced Market'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
              <div className="h-64 bg-gray-200 dark:bg-gray-700">
                <img 
                  src={market.thumbnail} 
                  alt={`${market.city}, ${market.state}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {market.city}, {market.state}
                  </h1>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Median Price</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">${market.medianHomePrice.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rental Yield</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{market.averageRentalYield}%</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Population</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{market.population.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Job Growth</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{market.jobGrowth}%</div>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <div className="flex flex-wrap space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-4 font-medium text-sm border-b-2 ${
                        activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                    >
                      Market Overview
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('neighborhoods')}
                      className={`pb-4 font-medium text-sm border-b-2 ${
                        activeTab === 'neighborhoods'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                    >
                      Neighborhoods
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('metrics')}
                      className={`pb-4 font-medium text-sm border-b-2 ${
                        activeTab === 'metrics'
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                    >
                      Key Metrics
                    </button>
                  </div>
                </div>
                
                {activeTab === 'overview' && (
                  <div className="animate-fade-in">
                    <div className="text-gray-600 dark:text-gray-300 mb-6">
                      {market.description.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Market Strengths
                        </h3>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                          {market.marketStrengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Market Challenges
                        </h3>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                          {market.marketChallenges.map((challenge, index) => (
                            <li key={index}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Rental Demand Drivers
                      </h3>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                        {market.rentalDemandDrivers.map((driver, index) => (
                          <li key={index}>{driver}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {activeTab === 'neighborhoods' && (
                  <div className="animate-fade-in">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {market.city} has several distinct neighborhoods with varying investment potential. Here are key areas to consider for your investment strategy.
                    </p>
                    
                    <div className="space-y-4">
                      {market.neighborhoodData.map((neighborhood, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {neighborhood.name}
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Median Price</div>
                              <div className="font-medium text-gray-900 dark:text-white">${neighborhood.medianPrice.toLocaleString()}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rental Yield</div>
                              <div className="font-medium text-green-600 dark:text-green-400">{neighborhood.rentalYield}%</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {neighborhood.overview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'metrics' && (
                  <div className="animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Financial Metrics
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Price-to-Rent Ratio:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.priceToRentRatio}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Price-to-Income Ratio:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.keyMetrics.price_to_income_ratio}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Avg. Cash Flow Potential:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.cashFlowPotential}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">5-Year Appreciation:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.appreciationLast5Years}%</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Avg. Days on Market:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.keyMetrics.average_days_on_market} days</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Market Indicators
                        </h3>
                        <ul className="space-y-2">
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Population Growth:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.populationGrowth}%</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Job Growth:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.jobGrowth}%</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Unemployment Rate:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.keyMetrics.unemployment_rate}%</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Vacancy Rate:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.vacancyRate}%</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Crime Index:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{market.keyMetrics.crime_index}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Remote Investor Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Property Management</h4>
                          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                            <li className="flex justify-between">
                              <span>Average Fee:</span>
                              <span>{market.propertyManagement.averageFee}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Availability:</span>
                              <span>{market.propertyManagement.availability}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Remote Investor Friendly:</span>
                              <span>{market.propertyManagement.remoteInvestorFriendly ? 'Yes' : 'Limited'}</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Livability Scores</h4>
                          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                            <li className="flex justify-between">
                              <span>Walkability:</span>
                              <span>{market.keyMetrics.walk_score}/100</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Transit Score:</span>
                              <span>{market.keyMetrics.transit_score}/100</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column: Actions and resources */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invest Remotely in {market.city}</h3>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Ready to invest in {market.city}? Our platform provides all the resources you need to invest confidently without physically visiting.
                </p>
                
                <div className="space-y-4">
                  <Link 
                    href={`/markets/${market.id}/properties`}
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <HomeIcon className="h-5 w-5 mr-2" />
                    View Available Properties
                  </Link>
                  
                  <Link
                    href={`/markets/${market.id}/network`}
                    className="btn btn-secondary w-full flex items-center justify-center"
                  >
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Local Partner Network
                  </Link>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Remote Investment Resources
                </h4>
                
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/markets/${market.id}/virtual-tours`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Virtual Property Tours
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/markets/${market.id}/inspections`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Inspection Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/markets/${market.id}/management`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <HomeIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Property Management
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/markets/${market.id}/financing`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Financing Options
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Market Research Reports
                </h4>
                
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/markets/${market.id}/reports/investment`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Investment Analysis Report
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/markets/${market.id}/reports/neighborhood`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Neighborhood Comparison Guide
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/markets/${market.id}/reports/forecast`}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-gray-400" />
                      2025 Market Forecast
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
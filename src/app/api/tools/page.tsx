"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CalculatorIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ToolsPage() {
  const [purchasePrice, setPurchasePrice] = useState<number>(200000);
  const [downPayment, setDownPayment] = useState<number>(40000);
  const [interestRate, setInterestRate] = useState<number>(4.5);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [monthlyRent, setMonthlyRent] = useState<number>(1800);
  const [propertyTax, setPropertyTax] = useState<number>(2400);
  const [insurance, setInsurance] = useState<number>(1200);
  const [maintenance, setMaintenance] = useState<number>(2400);
  const [vacancy, setVacancy] = useState<number>(5);
  const [propertyManagement, setPropertyManagement] = useState<number>(10);
  const [appreciationRate, setAppreciationRate] = useState<number>(3);
  
  // Calculate mortgage payment
  const calculateMortgagePayment = () => {
    const principal = purchasePrice - downPayment;
    const monthlyInterest = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Avoid division by zero
    if (monthlyInterest === 0) return principal / numberOfPayments;
    
    const mortgagePayment = 
      (principal * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
    
    return mortgagePayment;
  };
  
  // Calculate monthly expenses
  const calculateMonthlyExpenses = () => {
    const mortgagePayment = calculateMortgagePayment();
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyMaintenance = maintenance / 12;
    const monthlyVacancy = (monthlyRent * vacancy) / 100;
    const monthlyManagement = (monthlyRent * propertyManagement) / 100;
    
    return mortgagePayment + monthlyPropertyTax + monthlyInsurance + 
           monthlyMaintenance + monthlyVacancy + monthlyManagement;
  };
  
  // Calculate cash flow
  const calculateCashFlow = () => {
    return monthlyRent - calculateMonthlyExpenses();
  };
  
  // Calculate cash on cash return
  const calculateCashOnCashReturn = () => {
    const annualCashFlow = calculateCashFlow() * 12;
    const initialInvestment = downPayment + 5000; // Adding estimated closing costs
    
    return (annualCashFlow / initialInvestment) * 100;
  };
  
  // Calculate 5-year ROI including appreciation
  const calculateFiveYearROI = () => {
    const monthlyCashFlow = calculateCashFlow();
    const annualCashFlow = monthlyCashFlow * 12;
    const initialInvestment = downPayment + 5000; // Adding estimated closing costs
    
    // Calculate appreciation
    const futureValue = purchasePrice * Math.pow(1 + (appreciationRate / 100), 5);
    const equity = futureValue - (purchasePrice - downPayment);
    
    // Principal paydown over 5 years
    const monthlyInterest = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = calculateMortgagePayment();
    
    let remainingBalance = purchasePrice - downPayment;
    for (let i = 0; i < 5 * 12; i++) {
      const interestPayment = remainingBalance * monthlyInterest;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
    }
    
    const principalPaydown = (purchasePrice - downPayment) - remainingBalance;
    
    // Total return
    const totalReturn = (annualCashFlow * 5) + equity - initialInvestment + principalPaydown;
    
    return (totalReturn / initialInvestment) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investment Tools</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card p-6 bg-blue-600 text-white dark:bg-blue-700 flex flex-col items-center">
            <CalculatorIcon className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ROI Calculator</h2>
            <p className="text-blue-100 text-center mb-4">
              Calculate return on investment for rental properties.
            </p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50">
              Active
            </button>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow flex flex-col items-center">
            <ChartBarIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mortgage Calculator</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Calculate mortgage payments, interest, and amortization.
            </p>
            <Link href="/tools/mortgage" className="text-blue-600 dark:text-blue-400 hover:underline">
              Coming Soon
            </Link>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow flex flex-col items-center">
            <CurrencyDollarIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Flip Analyzer</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Analyze potential profits for fix-and-flip projects.
            </p>
            <Link href="/tools/flip" className="text-blue-600 dark:text-blue-400 hover:underline">
              Coming Soon
            </Link>
          </div>
        </div>
        
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Rental Property ROI Calculator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Property Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Down Payment ($)
                  </label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="form-input w-full"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {(downPayment / purchasePrice * 100).toFixed(1)}% of purchase price
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Term (years)
                  </label>
                  <select
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="form-input w-full"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Rent ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Property Tax ($)
                  </label>
                  <input
                    type="number"
                    value={propertyTax}
                    onChange={(e) => setPropertyTax(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Insurance ($)
                  </label>
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Maintenance ($)
                  </label>
                  <input
                    type="number"
                    value={maintenance}
                    onChange={(e) => setMaintenance(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Additional Expenses</h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vacancy Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vacancy}
                    onChange={(e) => setVacancy(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property Management (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={propertyManagement}
                    onChange={(e) => setPropertyManagement(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Appreciation Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={appreciationRate}
                    onChange={(e) => setAppreciationRate(Number(e.target.value))}
                    className="form-input w-full"
                  />
                </div>
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Results</h3>
              
              <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Monthly Mortgage:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${calculateMortgagePayment().toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total Monthly Expenses:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${calculateMonthlyExpenses().toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Monthly Cash Flow:</span>
                  <span className={`font-medium ${
                    calculateCashFlow() >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                  }`}>
                    ${calculateCashFlow().toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t border-blue-200 dark:border-blue-700 my-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Cash-on-Cash Return:</span>
                    <span className={`font-medium ${
                      calculateCashOnCashReturn() >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateCashOnCashReturn().toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">5-Year ROI (incl. appreciation):</span>
                    <span className={`font-medium ${
                      calculateFiveYearROI() >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                    }`}>
                      {calculateFiveYearROI().toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">How to Use This Calculator</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Enter your property's details to calculate potential returns. The calculator provides key metrics including:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-4">
            <li>Monthly cash flow (rental income minus expenses)</li>
            <li>Cash-on-cash return (annual cash flow divided by initial investment)</li>
            <li>Five-year ROI including property appreciation and mortgage principal paydown</li>
          </ul>
          <p className="text-gray-600 dark:text-gray-300">
            Adjust the values to compare different scenarios and investment properties.
          </p>
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { 
 ArrowRightIcon, 
 GlobeAltIcon, 
 DocumentTextIcon, 
 UserGroupIcon, 
 BuildingOfficeIcon, 
 CurrencyDollarIcon, 
 ChartBarIcon,
 MapPinIcon,
 ClipboardDocumentCheckIcon,
 CalculatorIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
 return (
   <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
     {/* Hero Section */}
     <div className="relative overflow-hidden">
       <div className="absolute inset-0 bg-blue-900 opacity-10 dark:opacity-30"></div>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
         <div className="text-center md:text-left md:w-2/3">
           <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
             <span className="block">Invest Anywhere</span>
             <span className="block text-blue-600 dark:text-blue-400">Without Being There</span>
           </h1>
           <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl">
             The complete platform for remote real estate investors to find, analyze, and manage properties across the United States.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
             <Link href="/markets" className="btn btn-primary px-8 py-3 text-lg rounded-lg flex items-center justify-center gap-2">
               Explore Markets
               <ArrowRightIcon className="h-5 w-5" />
             </Link>
             <Link href="/analysis-tools" className="btn btn-secondary px-8 py-3 text-lg rounded-lg">
               Investment Tools
             </Link>
           </div>
         </div>
       </div>
     </div>

     {/* Why Remote Investing Section */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <div className="text-center mb-16">
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Invest Anywhere. Manage Remotely.</h2>
         <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
           Our platform provides everything you need to confidently invest in real estate anywhere in the United States, without ever needing to physically visit the property.
         </p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
         <div className="card p-8 hover:shadow-lg transition-shadow text-center">
           <div className="flex justify-center mb-4">
             <GlobeAltIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
           </div>
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Any Market</h3>
           <p className="text-gray-600 dark:text-gray-300">
             Break free from geographical constraints and invest in the best-performing markets nationwide, from high-growth cities to steady cash flow areas.
           </p>
         </div>
         
         <div className="card p-8 hover:shadow-lg transition-shadow text-center">
           <div className="flex justify-center mb-4">
             <ClipboardDocumentCheckIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
           </div>
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Full Due Diligence</h3>
           <p className="text-gray-600 dark:text-gray-300">
             Our platform provides comprehensive property inspections, market analysis, and all necessary due diligence without you ever leaving home.
           </p>
         </div>
         
         <div className="card p-8 hover:shadow-lg transition-shadow text-center">
           <div className="flex justify-center mb-4">
             <BuildingOfficeIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
           </div>
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Turnkey Management</h3>
           <p className="text-gray-600 dark:text-gray-300">
             Connect with vetted property managers and service providers in every market to ensure your investment runs smoothly without your physical presence.
           </p>
         </div>
       </div>
     </div>

     {/* How It Works Section */}
     <div className="bg-white dark:bg-gray-800 py-20">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How Remote Investing Works</h2>
           <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
             Our streamlined process makes it easy to invest in properties thousands of miles away with the same confidence as if you were there in person.
           </p>
         </div>
         
         <div className="relative">
           {/* Connecting Line */}
           <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-800 hidden md:block"></div>
           
           <div className="space-y-12 relative">
             {/* Step 1 */}
             <div className="flex flex-col md:flex-row items-center">
               <div className="md:w-1/2 md:pr-12 mb-6 md:mb-0 md:text-right">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Market Research & Selection</h3>
                 <p className="text-gray-600 dark:text-gray-300">
                   Use our comprehensive data on over 400 U.S. markets to identify areas with your desired investment criteria. Filter by appreciation rates, rental yields, population growth, job markets, and more.
                 </p>
               </div>
               <div className="md:w-1/2 flex md:justify-start justify-center">
                 <div className="rounded-full bg-blue-600 p-4 relative z-10">
                   <MapPinIcon className="h-8 w-8 text-white" />
                 </div>
               </div>
             </div>
             
             {/* Step 2 */}
             <div className="flex flex-col md:flex-row-reverse items-center">
               <div className="md:w-1/2 md:pl-12 mb-6 md:mb-0 md:text-left">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Virtual Property Tours & Analysis</h3>
                 <p className="text-gray-600 dark:text-gray-300">
                   Review properties with detailed virtual tours, professional inspection reports, and 360° walkthroughs. Our advanced analysis tools calculate ROI, cash flow, appreciation potential, and risk factors.
                 </p>
               </div>
               <div className="md:w-1/2 flex md:justify-end justify-center">
                 <div className="rounded-full bg-blue-600 p-4 relative z-10">
                   <DocumentTextIcon className="h-8 w-8 text-white" />
                 </div>
               </div>
             </div>
             
             {/* Step 3 */}
             <div className="flex flex-col md:flex-row items-center">
               <div className="md:w-1/2 md:pr-12 mb-6 md:mb-0 md:text-right">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verified Local Partners</h3>
                 <p className="text-gray-600 dark:text-gray-300">
                   Work with our network of vetted local partners - agents, inspectors, contractors, and property managers - who serve as your eyes and hands on the ground, ensuring quality and accountability.
                 </p>
               </div>
               <div className="md:w-1/2 flex md:justify-start justify-center">
                 <div className="rounded-full bg-blue-600 p-4 relative z-10">
                   <UserGroupIcon className="h-8 w-8 text-white" />
                 </div>
               </div>
             </div>
             
             {/* Step 4 */}
             <div className="flex flex-col md:flex-row-reverse items-center">
               <div className="md:w-1/2 md:pl-12 mb-6 md:mb-0 md:text-left">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Remote Closing & Setup</h3>
                 <p className="text-gray-600 dark:text-gray-300">
                   Complete all paperwork electronically, coordinate with title companies, secure financing, and close on your property - all from your computer. Then set up remote property management and tenant placement.
                 </p>
               </div>
               <div className="md:w-1/2 flex md:justify-end justify-center">
                 <div className="rounded-full bg-blue-600 p-4 relative z-10">
                   <CurrencyDollarIcon className="h-8 w-8 text-white" />
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Platform Features */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <div className="text-center mb-16">
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need In One Platform</h2>
         <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
           Our comprehensive suite of tools and resources eliminates the need for physical presence and ensures successful remote real estate investing.
         </p>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <Link href="/market-data" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Market Data & Analytics</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             Access comprehensive market data, trends, growth projections, rental rates, and investment metrics for every ZIP code in the United States.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             Explore Market Data <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
         
         <Link href="/virtual-tours" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <GlobeAltIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Virtual Property Tours</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             View detailed 3D tours, video walkthroughs, and high-resolution images that make you feel like you're physically at the property.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             See Virtual Tours <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
         
         <Link href="/network" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Verified Partner Network</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             Connect with our vetted network of local real estate agents, property managers, contractors, and inspectors in markets nationwide.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             Find Partners <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
         
         <Link href="/analysis-tools" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <CalculatorIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Investment Analysis Tools</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             Evaluate properties with our comprehensive suite of analysis tools for cash flow, ROI, cap rates, appreciation potential, and risk assessment.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             Try Our Tools <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
         
         <Link href="/inspection-reports" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detailed Inspection Reports</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             Review standardized, comprehensive inspection reports with detailed photos and repair estimates from certified inspectors.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             View Sample Reports <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
         
         <Link href="/remote-management" className="card p-8 hover:shadow-lg transition-shadow">
           <div className="flex items-center mb-4">
             <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Remote Property Management</h3>
           </div>
           <p className="text-gray-600 dark:text-gray-300 mb-4">
             Access our platform for remote property management, tenant screening, maintenance coordination, and financial reporting.
           </p>
           <span className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
             Learn About Management <ArrowRightIcon className="h-4 w-4 ml-1" />
           </span>
         </Link>
       </div>
     </div>

     {/* Testimonials */}
     <div className="bg-gray-100 dark:bg-gray-800 py-20">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Remote Investors Say</h2>
           <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
             Hear from investors who've successfully built real estate portfolios across the country without ever visiting their properties.
           </p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="card p-8">
             <div className="flex items-center mb-4">
               <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mr-4">
                 JD
               </div>
               <div>
                 <h4 className="font-semibold text-gray-900 dark:text-white">James Davidson</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400">San Francisco, CA</p>
               </div>
             </div>
             <p className="text-gray-600 dark:text-gray-300 italic">
               "I own 7 rental properties across 3 states that I've never personally visited. This platform made it possible to invest confidently in high-yield markets outside my expensive home city."
             </p>
           </div>
           
           <div className="card p-8">
             <div className="flex items-center mb-4">
               <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mr-4">
                 SR
               </div>
               <div>
                 <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Rodriguez</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400">New York, NY</p>
               </div>
             </div>
             <p className="text-gray-600 dark:text-gray-300 italic">
               "The virtual tours and inspection reports were so detailed that I felt like I had walked through the properties myself. I've purchased 4 rentals remotely and all perform better than my local investments."
             </p>
           </div>
           
           <div className="card p-8">
             <div className="flex items-center mb-4">
               <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mr-4">
                 MT
               </div>
               <div>
                 <h4 className="font-semibold text-gray-900 dark:text-white">Michael Thompson</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Seattle, WA</p>
               </div>
             </div>
             <p className="text-gray-600 dark:text-gray-300 italic">
               "The network of property managers has been invaluable. They handle everything from tenant selection to maintenance, allowing me to scale to 12 doors across 5 markets while working full-time."
             </p>
           </div>
         </div>
       </div>
     </div>

     {/* CTA Section */}
     <div className="bg-blue-600 dark:bg-blue-800">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
         <div className="text-center">
           <h2 className="text-3xl font-bold text-white mb-4">Ready to Invest Anywhere?</h2>
           <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
             Join thousands of investors who are building wealth through remote real estate investing.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link 
               href="/signup" 
               className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-medium rounded-lg inline-block shadow-md hover:shadow-lg transition-all"
             >
               Get Started Free
             </Link>
             <Link 
               href="/demo" 
               className="bg-transparent text-white border border-white hover:bg-blue-700 px-8 py-3 text-lg font-medium rounded-lg inline-block"
             >
               Request a Demo
             </Link>
           </div>
           <p className="text-blue-200 mt-4">No credit card required. Free basic plan available.</p>
         </div>
       </div>
     </div>

     {/* Featured in Section */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="text-center mb-8">
         <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
           Featured In
         </p>
       </div>
       <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
         <div className="flex items-center justify-center h-12">
           <svg className="h-8 text-gray-500 dark:text-gray-400" viewBox="0 0 150 30" fill="currentColor">
             <rect width="150" height="30" fillOpacity="0" />
             <text x="0" y="20" fontSize="20" fontWeight="bold">FORBES</text>
           </svg>
         </div>
         <div className="flex items-center justify-center h-12">
           <svg className="h-8 text-gray-500 dark:text-gray-400" viewBox="0 0 150 30" fill="currentColor">
             <rect width="150" height="30" fillOpacity="0" />
             <text x="0" y="20" fontSize="18" fontWeight="bold">WALL STREET JOURNAL</text>
           </svg>
         </div>
         <div className="flex items-center justify-center h-12">
           <svg className="h-8 text-gray-500 dark:text-gray-400" viewBox="0 0 150 30" fill="currentColor">
             <rect width="150" height="30" fillOpacity="0" />
             <text x="0" y="20" fontSize="18" fontWeight="bold">BUSINESS INSIDER</text>
           </svg>
         </div>
         <div className="flex items-center justify-center h-12">
           <svg className="h-8 text-gray-500 dark:text-gray-400" viewBox="0 0 150 30" fill="currentColor">
             <rect width="150" height="30" fillOpacity="0" />
             <text x="0" y="20" fontSize="18" fontWeight="bold">CNBC</text>
           </svg>
         </div>
       </div>
     </div>

     {/* Stats Section */}
     <div className="bg-blue-600 dark:bg-blue-800 py-16">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
           <div>
             <p className="text-4xl font-bold text-white mb-2">400+</p>
             <p className="text-blue-100">Markets Covered</p>
           </div>
           <div>
             <p className="text-4xl font-bold text-white mb-2">15,000+</p>
             <p className="text-blue-100">Remote Investors</p>
           </div>
           <div>
             <p className="text-4xl font-bold text-white mb-2">$2.1B+</p>
             <p className="text-blue-100">Property Value Managed</p>
           </div>
           <div>
             <p className="text-4xl font-bold text-white mb-2">98%</p>
             <p className="text-blue-100">Investor Satisfaction</p>
           </div>
         </div>
       </div>
     </div>

     {/* Latest Blog Section */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
       <div className="flex justify-between items-center mb-10">
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Latest Remote Investing Insights</h2>
         <Link 
           href="/blog" 
           className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
         >
           View All <ArrowRightIcon className="h-4 w-4 ml-1" />
         </Link>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="card overflow-hidden hover:shadow-lg transition-shadow">
           <div className="h-48 bg-gray-200 dark:bg-gray-700">
             <img 
               src="https://via.placeholder.com/600x400?text=Remote+Investing+Blog" 
               alt="Blog thumbnail"
               className="w-full h-full object-cover"
             />
           </div>
           <div className="p-6">
             <span className="text-sm text-blue-600 dark:text-blue-400">Market Analysis</span>
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-3">
               10 Emerging Markets for Remote Investors in 2025
             </h3>
             <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
               Discover the top emerging real estate markets that are projected to deliver strong returns for remote investors in the coming year.
             </p>
             <Link 
               href="/blog/emerging-markets-2025" 
               className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
             >
               Read Article <ArrowRightIcon className="h-4 w-4 ml-1" />
             </Link>
           </div>
         </div>
         
         <div className="card overflow-hidden hover:shadow-lg transition-shadow">
           <div className="h-48 bg-gray-200 dark:bg-gray-700">
             <img 
               src="https://via.placeholder.com/600x400?text=Remote+Management" 
               alt="Blog thumbnail"
               className="w-full h-full object-cover"
             />
           </div>
           <div className="p-6">
             <span className="text-sm text-blue-600 dark:text-blue-400">Property Management</span>
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-3">
               How to Effectively Manage Properties You've Never Visited
             </h3>
             <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
               Learn the proven systems and tools that successful remote investors use to manage their properties from anywhere in the world.
             </p>
             <Link 
               href="/blog/remote-management-tips" 
               className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
             >
               Read Article <ArrowRightIcon className="h-4 w-4 ml-1" />
             </Link>
           </div>
         </div>
         
         <div className="card overflow-hidden hover:shadow-lg transition-shadow">
           <div className="h-48 bg-gray-200 dark:bg-gray-700">
             <img 
               src="https://via.placeholder.com/600x400?text=Due+Diligence" 
               alt="Blog thumbnail"
               className="w-full h-full object-cover"
             />
           </div>
           <div className="p-6">
             <span className="text-sm text-blue-600 dark:text-blue-400">Due Diligence</span>
             <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-3">
               The Remote Investor's Due Diligence Checklist
             </h3>
             <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
               The essential steps every remote investor must take to thoroughly evaluate properties without being physically present.
             </p>
             <Link 
               href="/blog/due-diligence-checklist" 
               className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
             >
               Read Article <ArrowRightIcon className="h-4 w-4 ml-1" />
             </Link>
           </div>
         </div>
       </div>
     </div>

     {/* FAQ Section */}
     <div className="bg-gray-50 dark:bg-gray-900 py-20">
       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
           <p className="text-lg text-gray-600 dark:text-gray-300">
             Get answers to common questions about remote real estate investing.
           </p>
         </div>
         
         <div className="space-y-6">
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
               Is it really possible to invest in real estate without visiting the property?
             </h3>
             <p className="text-gray-600 dark:text-gray-300">
               Absolutely! With the right tools, network, and processes, you can confidently invest in properties anywhere in the United States. Our platform provides virtual tours, professional inspection reports, market data, and connections to local experts who
               Absolutely! With the right tools, network, and processes, you can confidently invest in properties anywhere in the United States. Our platform provides virtual tours, professional inspection reports, market data, and connections to local experts who serve as your eyes and hands on the ground.
             </p>
           </div>
           
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
               How do I know I'm getting accurate information about the property?
             </h3>
             <p className="text-gray-600 dark:text-gray-300">
               We partner with licensed, insured, and thoroughly vetted inspectors who follow standardized reporting processes. Our virtual tours use high-definition 3D scanning technology to give you an accurate view of the property. Additionally, all partners in our network have been verified and are held to strict quality standards.
             </p>
           </div>
           
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
               How is property management handled for remote investments?
             </h3>
             <p className="text-gray-600 dark:text-gray-300">
               We connect you with professional property management companies in each market who specialize in working with remote investors. Our platform includes tools for oversight, reporting, and communication with your property manager. You'll have visibility into property performance, maintenance issues, and financial reporting - all from your dashboard.
             </p>
           </div>
           
           <div className="card p-6">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
               What if something goes wrong with my property?
             </h3>
             <p className="text-gray-600 dark:text-gray-300">
               Your property manager serves as your local representative to handle any issues that arise. For major problems, our network includes vetted contractors, emergency service providers, and other professionals who can quickly address issues. The platform provides real-time notifications and updates on any maintenance requests or incidents.
             </p>
           </div>
         </div>
         
         <div className="text-center mt-10">
           <Link 
             href="/faq" 
             className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
           >
             View All FAQs <ArrowRightIcon className="h-4 w-4 ml-1" />
           </Link>
         </div>
       </div>
     </div>

     {/* Newsletter Section */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
       <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-8 md:p-12">
         <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Get Remote Investment Insights</h2>
           <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
             Join our newsletter for market updates, investment opportunities, and remote investing strategies.
           </p>
         </div>
         <form className="max-w-md mx-auto">
           <div className="flex flex-col sm:flex-row gap-3">
             <input 
               type="email" 
               placeholder="Enter your email" 
               className="form-input w-full flex-grow"
             />
             <button 
               type="submit" 
               className="btn btn-primary whitespace-nowrap"
             >
               Subscribe
             </button>
           </div>
           <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
             We respect your privacy. Unsubscribe at any time.
           </p>
         </form>
       </div>
     </div>

     {/* Footer */}
     <div className="bg-gray-100 dark:bg-gray-800 py-12">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div>
             <Link href="/" className="flex items-center mb-4">
               <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Remote</span>
               <span className="text-2xl font-bold text-gray-900 dark:text-white ml-1">Invest</span>
             </Link>
             <p className="text-gray-600 dark:text-gray-300 mb-4">
               The complete platform for remote real estate investors to find, analyze, and manage properties across the United States.
             </p>
             <div className="flex space-x-4">
               <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                 <span className="sr-only">Facebook</span>
                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                   <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                 </svg>
               </a>
               <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                 <span className="sr-only">Twitter</span>
                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                 </svg>
               </a>
               <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                 <span className="sr-only">LinkedIn</span>
                 <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                   <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                 </svg>
               </a>
             </div>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
             <ul className="space-y-2">
               <li><Link href="/markets" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Market Research</Link></li>
               <li><Link href="/analysis-tools" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Analysis Tools</Link></li>
               <li><Link href="/virtual-tours" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Virtual Tours</Link></li>
               <li><Link href="/network" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Partner Network</Link></li>
               <li><Link href="/management" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Property Management</Link></li>
             </ul>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
             <ul className="space-y-2">
               <li><Link href="/blog" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Blog</Link></li>
               <li><Link href="/guides" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Investor Guides</Link></li>
               <li><Link href="/webinars" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Webinars</Link></li>
               <li><Link href="/calculator" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">ROI Calculator</Link></li>
               <li><Link href="/faq" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">FAQ</Link></li>
             </ul>
           </div>
           
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
             <ul className="space-y-2">
               <li><Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">About Us</Link></li>
               <li><Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Pricing</Link></li>
               <li><Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Contact</Link></li>
               <li><Link href="/careers" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Careers</Link></li>
               <li><Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link></li>
             </ul>
           </div>
         </div>
         
         <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
           <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
             © {new Date().getFullYear()} RemoteInvest. All rights reserved.
           </p>
         </div>
       </div>
     </div>
   </div>
 );
}
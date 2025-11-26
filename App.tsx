import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuctionCard } from './components/AuctionCard';
import { BidHistory } from './components/BidHistory';
import { ContractViewer } from './components/ContractViewer';
import { generateAuctionItem } from './services/geminiService';
import { AuctionItem, Bid, AppView } from './types';
import { MOCK_INITIAL_BIDS } from './constants';
import { Loader2, Gavel, FileCode, History } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('auction');
  const [dailyItem, setDailyItem] = useState<AuctionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bids, setBids] = useState<Bid[]>(MOCK_INITIAL_BIDS);
  const [error, setError] = useState<string | null>(null);

  // Load or Generate Daily Item
  useEffect(() => {
    const loadDailyItem = async () => {
      try {
        setIsLoading(true);
        // In a real app, we would check if today's item exists in DB/Contract.
        // Here, we generate a fresh one using Gemini to simulate the "Daily Drop".
        const item = await generateAuctionItem();
        setDailyItem(item);
      } catch (err) {
        console.error(err);
        setError("Failed to generate today's auction item. Please check your API Key.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyItem();
  }, []);

  const handlePlaceBid = (amount: number) => {
    const newBid: Bid = {
      id: Date.now().toString(),
      bidder: 'You',
      amount: amount,
      timestamp: new Date(),
      hash: '0x' + Math.random().toString(16).substr(2, 40) // Mock hash
    };
    setBids(prev => [newBid, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-slate-400 animate-pulse">Gemini is curating today's artifact...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        ) : (
          <>
            {currentView === 'auction' && dailyItem && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <AuctionCard item={dailyItem} currentBid={bids[0]?.amount || dailyItem.startingPrice} />
                </div>
                <div className="space-y-6">
                   <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-purple-400" />
                        Place a Bid
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between text-sm text-slate-400">
                           <span>Current Top Bid</span>
                           <span className="font-mono text-white">{bids[0]?.amount || dailyItem.startingPrice} ETH</span>
                        </div>
                         <button
                           onClick={() => handlePlaceBid((bids[0]?.amount || dailyItem.startingPrice) + 0.1)}
                           className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-95"
                         >
                           Bid {(bids[0]?.amount || dailyItem.startingPrice) + 0.1} ETH
                         </button>
                         <p className="text-xs text-center text-slate-500">
                           + Gas fees apply. Powered by Farcaster & Gemini 3.
                         </p>
                      </div>
                   </div>
                   <BidHistory bids={bids} />
                </div>
              </div>
            )}

            {currentView === 'contract' && (
              <ContractViewer />
            )}
            
            {currentView === 'history' && (
               <div className="text-center py-20 text-slate-500">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-2xl font-bold mb-2">Past Auctions</h2>
                  <p>This is the genesis auction. History starts tomorrow.</p>
               </div>
            )}
          </>
        )}
      </main>
      
      <footer className="py-6 border-t border-slate-800 mt-12 text-center text-slate-500 text-sm">
        <p>© 2024 DailyCast Auction. Generated by Gemini 3.</p>
      </footer>
    </div>
  );
};

export default App;
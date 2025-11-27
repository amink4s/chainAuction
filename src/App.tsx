import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header.tsx';
import { AuctionCard } from '../components/AuctionCard.tsx';
import { BidHistory } from '../components/BidHistory.tsx';
import { ImageUploader } from '../components/ImageUploader.tsx';
import { getDailyAuctionItem } from '../services/auctionService.ts';
import { AuctionItem, Bid, AppView } from '../types.ts';
import { MOCK_INITIAL_BIDS } from '../constants.ts';
import { Loader2, Gavel, History } from 'lucide-react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useQuickAuth } from './hooks/useQuickAuth.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('auction');
  const [dailyItem, setDailyItem] = useState<AuctionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bids, setBids] = useState<Bid[]>(MOCK_INITIAL_BIDS);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useQuickAuth();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  // Load Daily Item
  useEffect(() => {
    const loadDailyItem = async () => {
      try {
        setIsLoading(true);
        const item = await getDailyAuctionItem();
        setDailyItem(item);
      } catch (err) {
        console.error(err);
        setError("Failed to load today's auction item.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyItem();
  }, []);

  // Notify Farcaster that the miniapp is ready once the UI is stable.
  useEffect(() => {
    let cancelled = false;

    const callReady = async () => {
      try {
        if (isLoading) return;

        if (document.fonts?.ready) {
          await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]);
        } else {
          await new Promise((r) => setTimeout(r, 300));
        }

        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        if (!cancelled) {
          await sdk.actions.ready();
          console.debug('Farcaster miniapp: sdk.actions.ready() called');
        }
      } catch (err) {
        console.warn('Farcaster ready failed:', err);
      }
    };

    callReady();

    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  const handlePlaceBid = (amount: number) => {
    const newBid: Bid = {
      id: Date.now().toString(),
      bidder: user?.username || 'You',
      amount: amount,
      timestamp: new Date(),
      hash: '0x' + Math.random().toString(16).substr(2, 40)
    };
    setBids(prev => [newBid, ...prev]);
  };

  const handleCreateAuction = () => {
    // Placeholder for creating auction
    console.log('Creating auction with image:', uploadedImage);
    // TODO: Implement API call to create auction
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} user={user} />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-slate-400 animate-pulse">Loading today's artifact...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-900/20 border border-red-800 rounded-xl text-center">
            <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        ) : (
          <>
            {currentView === 'auction' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Create Auction</h3>
                    <ImageUploader onImageSelect={setUploadedImage} />
                    {uploadedImage && (
                      <button
                        onClick={handleCreateAuction}
                        className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
                      >
                        Start Auction
                      </button>
                    )}
                  </div>

                  {dailyItem && !uploadedImage && (
                    <AuctionCard item={dailyItem} currentBid={bids[0]?.amount || dailyItem.startingPrice} />
                  )}
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
                        <span className="font-mono text-white">${bids[0]?.amount || dailyItem?.startingPrice || 0}</span>
                      </div>
                      <button
                        onClick={() => handlePlaceBid((bids[0]?.amount || dailyItem?.startingPrice || 0) + 1)}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]"
                      >
                        Bid ${(bids[0]?.amount || dailyItem?.startingPrice || 0) + 1}
                      </button>
                      <p className="text-xs text-center text-slate-500">
                        + Gas fees apply. Powered by Farcaster.
                      </p>
                    </div>
                  </div>
                  <BidHistory bids={bids} />
                </div>
              </div>
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
        <p>© 2024 DailyCast Auction.</p>
      </footer>
    </div>
  );
};

export default App;
import React from 'react';
import { Bid } from '../types';
import { User, ExternalLink } from 'lucide-react';

interface BidHistoryProps {
  bids: Bid[];
}

export const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/80">
        <h3 className="font-semibold text-slate-200">Recent Activity</h3>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {bids.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No bids yet. Be the first!
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {bids.map((bid) => (
              <div key={bid.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-200 text-sm">{bid.bidder}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                       {bid.timestamp.toLocaleTimeString()}
                       <ExternalLink className="w-2.5 h-2.5 hover:text-purple-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white font-mono">{bid.amount} ETH</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
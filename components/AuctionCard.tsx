import React from 'react';
import { AuctionItem } from '../types';
import { Countdown } from './Countdown';
import { Sparkles } from 'lucide-react';

interface AuctionCardProps {
  item: AuctionItem;
  currentBid: number;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ item, currentBid }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Image Container */}
      <div className="relative group rounded-2xl overflow-hidden aspect-square border border-slate-700 shadow-2xl bg-slate-800">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
        
        {/* Floating Timer Badge */}
        <div className="absolute top-4 right-4">
           <Countdown targetDate={item.endsAt} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
           <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md font-display">{item.name}</h1>
           <p className="text-slate-300 line-clamp-2 drop-shadow-sm">{item.description}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Artifact Lore</span>
        </div>
        <p className="text-slate-300 leading-relaxed mb-6 italic">
          "{item.lore}"
        </p>

        <div className="grid grid-cols-2 gap-3">
          {item.attributes.map((attr, idx) => (
            <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <span className="block text-xs text-slate-500 uppercase">{attr.trait}</span>
              <span className="text-sm font-medium text-slate-200">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
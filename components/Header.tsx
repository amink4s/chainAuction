import React from 'react';
import { AppView, User } from '../types';
import { Radio, History } from 'lucide-react';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, user }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
        <div
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-white cursor-pointer hover:opacity-80 transition"
          onClick={() => onViewChange('auction')}
        >
          {user ? (
            <div className="flex items-center gap-2">
              {user.pfpUrl && <img src={user.pfpUrl} alt={user.username} className="w-8 h-8 rounded-full border border-purple-500" />}
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="text-purple-400">Cast<span>Auction</span></span>
            </>
          )}
        </div>

        <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700">
          <button
            onClick={() => onViewChange('auction')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'auction'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Auction
          </button>
          <button
            onClick={() => onViewChange('history')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${currentView === 'history'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
        </nav>
      </div>
    </header>
  );
};
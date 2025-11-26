export type AppView = 'auction' | 'contract' | 'history';

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  lore: string;
  startingPrice: number;
  imageUrl: string;
  endsAt: Date;
  attributes: { trait: string; value: string }[];
}

export interface Bid {
  id: string;
  bidder: string;
  amount: number;
  timestamp: Date;
  hash: string;
}

export interface ContractAnalysis {
  riskScore: number;
  summary: string;
  functions: string[];
}
import { Bid } from '../types';

const API_BASE = '/api';

export const createAuction = async (imageUrl: string, creatorId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, creatorId }),
    });
    if (!response.ok) throw new Error('Failed to create auction');
    return response.json();
};

export const getAuction = async (id: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/auction/${id}`);
    if (!response.ok) throw new Error('Failed to fetch auction');
    return response.json();
};

export const placeBid = async (auctionId: string, bidderId: string, amountUsd: number): Promise<Bid> => {
    const response = await fetch(`${API_BASE}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, bidderId, amountUsd }),
    });
    if (!response.ok) throw new Error('Failed to place bid');
    return response.json();
};

export const getHistory = async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
};

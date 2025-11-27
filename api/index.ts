import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Create Auction
app.post('/api/auction', async (req, res) => {
    const { imageUrl, creatorId, durationHours = 24 } = req.body;
    try {
        const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        const auction = await prisma.auction.create({
            data: {
                imageUrl,
                creatorId,
                endTime,
            },
        });
        res.json(auction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create auction' });
    }
});

// Get Auction
app.get('/api/auction/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const auction = await prisma.auction.findUnique({
            where: { id },
            include: { bids: { orderBy: { amountUsd: 'desc' } }, creator: true },
        });
        res.json(auction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch auction' });
    }
});

// Place Bid
app.post('/api/bid', async (req, res) => {
    const { auctionId, bidderId, amountUsd } = req.body;
    try {
        // Mock conversion: 1 ETH = $3000
        // TODO: Use Chainlink price feed
        const amountEth = amountUsd / 3000;

        const bid = await prisma.bid.create({
            data: {
                auctionId,
                bidderId,
                amountUsd,
                amountEth,
            },
        });
        res.json(bid);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to place bid' });
    }
});

// History
app.get('/api/history', async (req, res) => {
    try {
        const auctions = await prisma.auction.findMany({
            where: { endTime: { lt: new Date() } },
            orderBy: { endTime: 'desc' },
            include: { bids: { orderBy: { amountUsd: 'desc' }, take: 1 } },
        });
        res.json(auctions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default app;

import { AuctionItem, ContractAnalysis } from "../types";

export const getDailyAuctionItem = async (): Promise<AuctionItem> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        id: "static-1",
        name: "Chronos Dial",
        description: "A device said to turn back time by 5 seconds.",
        lore: "Forged in the fires of a dying star, the Chronos Dial was used by the Time Keepers to prevent minor inconveniences. It hums with a low frequency.",
        startingPrice: 0.5,
        imageUrl: "https://picsum.photos/800/800",
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
        attributes: [
            { trait: "Material", value: "Stardust" },
            { trait: "Era", value: "Pre-Void" }
        ]
    };
};

export const analyzeSmartContract = async (contractCode: string): Promise<ContractAnalysis> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        riskScore: 5,
        summary: "Static Analysis: Contract appears safe based on standard patterns.",
        functions: ["startAuction", "bid", "withdraw", "endAuction"]
    };
}

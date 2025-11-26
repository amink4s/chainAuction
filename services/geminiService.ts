import { GoogleGenAI, Type } from "@google/genai";
import { AuctionItem, ContractAnalysis } from "../types";

// NOTE: In a real environment, you should proxy these calls through a backend to protect your API key.
// Since this is a frontend-only demo generated for a user who will run it locally/Verce, we use process.env.
// The user MUST provide the key in their environment variables.

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateAuctionItem = async (): Promise<AuctionItem> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock item.");
    return getMockItem();
  }

  try {
    // 1. Generate the Concept & Text
    // Use gemini-2.5-flash for speed and reliability.
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Create a unique, high-value, sci-fi or fantasy artifact for a daily auction. It should sound legendary and expensive.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the artifact" },
            description: { type: Type.STRING, description: "A short catchy description (max 100 chars)" },
            lore: { type: Type.STRING, description: "A paragraph of lore explaining its origin and power" },
            startingPrice: { type: Type.NUMBER, description: "Starting price in ETH (0.1 to 5.0)" },
            visualPrompt: { type: Type.STRING, description: "A highly detailed visual description for an image generator" },
            attributes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  trait: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            }
          },
          required: ["name", "description", "lore", "startingPrice", "visualPrompt", "attributes"]
        }
      }
    });

    const itemData = JSON.parse(textResponse.text || "{}");

    // 2. Generate the Image
    // Using gemini-2.5-flash-image to avoid 403 Permission Denied errors 
    // associated with the preview pro models on some API keys.
    let imageUrl = "https://picsum.photos/800/800"; // Fallback
    
    try {
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: itemData.visualPrompt || `A legendary artifact: ${itemData.name}, 8k resolution, cinematic lighting`,
            // Note: imageConfig is omitted to ensure maximum compatibility with the flash model
        });
        
        // Extract image
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    } catch (imgError) {
        console.error("Image generation failed", imgError);
        // Fallback is already set to picsum
    }

    return {
      id: Date.now().toString(),
      name: itemData.name,
      description: itemData.description,
      lore: itemData.lore,
      startingPrice: itemData.startingPrice,
      imageUrl: imageUrl,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
      attributes: itemData.attributes || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getMockItem();
  }
};

export const analyzeSmartContract = async (contractCode: string): Promise<ContractAnalysis> => {
     if (!apiKey) {
        return {
            riskScore: 10,
            summary: "API Key missing. Cannot analyze. (Mock Analysis: Safe)",
            functions: ["startAuction", "bid", "withdraw"]
        };
     }

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this Solidity smart contract. Provide a risk score (0-100, where 100 is risky), a one-sentence summary, and a list of key function names.
            
            Contract:
            ${contractCode}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        functions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || "{}");
     } catch (e) {
         console.error("Analysis failed", e);
         return {
             riskScore: 0,
             summary: "Analysis failed due to API error.",
             functions: []
         };
     }
}

const getMockItem = (): AuctionItem => ({
  id: "mock-1",
  name: "Chronos Dial",
  description: "A device said to turn back time by 5 seconds.",
  lore: "Forged in the fires of a dying star, the Chronos Dial was used by the Time Keepers to prevent minor inconveniences. It hums with a low frequency.",
  startingPrice: 0.5,
  imageUrl: "https://picsum.photos/800/800",
  endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
  attributes: [
    { trait: "Material", value: "Stardust" },
    { trait: "Era", value: "Pre-Void" }
  ]
});
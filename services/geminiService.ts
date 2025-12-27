
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAircraftIntel = async (type: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a futuristic pilot callsign, a short aircraft bio, and a unique "Tactical Ability" name for a ${type} class fighter jet.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            callsign: { type: Type.STRING },
            bio: { type: Type.STRING },
            ability: { type: Type.STRING },
            squadron: { type: Type.STRING }
          },
          required: ["callsign", "bio", "ability", "squadron"],
          propertyOrdering: ["callsign", "bio", "ability", "squadron"]
        }
      }
    });
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    return {
      callsign: "Viper 1",
      bio: "Standard interceptor modified for high-altitude engagement.",
      ability: "EMP Burst",
      squadron: "Ghost Wing"
    };
  }
};

export const getAWACSCommentary = async (playerHull: number, enemyHull: number, lastEvent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AWACS tactical officer. Give a brief, professional radio update. Player: ${playerHull}% hull, Enemy: ${enemyHull}% hull. Last event: ${lastEvent}. Keep it under 12 words.`,
    });
    return response.text || "Continue mission. Targets in range.";
  } catch (error) {
    return "Check your six! Enemy on the move.";
  }
};

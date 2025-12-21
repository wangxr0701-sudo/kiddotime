import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an optimized schedule including breaks using Gemini.
 */
export const generateOptimizedSchedule = async (
  tasks: Partial<Task>[],
  availableTimeMinutes?: number
): Promise<any[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    I have a list of homework tasks for a child. 
    Please organize them into a logical schedule. 
    If the total time is long (over 45 minutes), insert short 5-10 minute "Break" items between hard subjects.
    Try to alternate between subjects if possible.
    Assign a fun emoji to each task.
    
    Current Tasks: ${JSON.stringify(tasks)}
    ${availableTimeMinutes ? `Total Available Time: ${availableTimeMinutes} minutes` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              estimatedMinutes: { type: Type.NUMBER },
              isBreak: { type: Type.BOOLEAN },
              emoji: { type: Type.STRING },
              reasoning: { type: Type.STRING, description: "Short friendly reason for this order" }
            },
            required: ["title", "subject", "estimatedMinutes", "isBreak", "emoji"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate schedule:", error);
    // Fallback: just return original tasks with defaults if API fails
    return tasks.map(t => ({...t, isBreak: false, emoji: '📝'}));
  }
};

/**
 * Gets a motivational message based on progress.
 */
export const getMotivationalMessage = async (
  taskTitle: string,
  isComplete: boolean
): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = isComplete 
    ? `Give a short, super enthusiastic high-five message for a child who just finished their "${taskTitle}" homework! Max 20 words. Use emojis.`
    : `Give a gentle, encouraging nudge for a child starting their "${taskTitle}" homework. Max 15 words. Use emojis.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "You're doing great! 🌟";
  } catch (error) {
    return "Good job! Keep going! 🚀";
  }
};

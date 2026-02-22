
import { ChatMessage } from "../types";

// NOTE: All AI logic has been moved to Firebase Cloud Functions for security.
// Ensure you have deployed functions: 'chatWithAI', 'analyzeMeal', 'analyzeMealText', 'analyzeBodyPhysique'.

export async function getChatResponse(history: ChatMessage[], message: string) {
    console.warn("Firebase Functions not initialized. AI Chat offline.");
    return "Estou offline no momento (Configuração pendente).";
}

export async function analyzeMeal(base64Image: string) {
  return null;
}

export async function analyzeMealText(text: string) {
  return null;
}

export async function analyzeBodyPhysique(base64Image: string) {
  return null;
}

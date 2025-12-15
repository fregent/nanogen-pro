import { GoogleGenAI } from "@google/genai";
import { SafetySetting, AspectRatio, ImageResolution } from "../types";

// The mapping for "Nano Banana Pro" / "Gemini 3 Pro Image"
const MODEL_NAME = 'gemini-3-pro-image-preview';
const REQUEST_TIMEOUT_MS = 120000; // 2 minutes timeout

export const checkApiKeySelection = async (): Promise<boolean> => {
  const aistudio = (window as any).aistudio;
  if (aistudio && aistudio.hasSelectedApiKey) {
    return await aistudio.hasSelectedApiKey();
  }
  return true; // Fallback for environments where the wrapper might not exist, though strictly required for this model context
};

export const openApiKeySelection = async (): Promise<void> => {
  const aistudio = (window as any).aistudio;
  if (aistudio && aistudio.openSelectKey) {
    await aistudio.openSelectKey();
  }
};

export const generateImage = async (
  prompt: string,
  safetySettings: SafetySetting[],
  aspectRatio: AspectRatio,
  resolution: ImageResolution
): Promise<string> => {
  // CRITICAL: Initialize client here to pick up the latest selected key from process.env.API_KEY
  // which is injected after selection.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (true) {
    try {
      const generatePromise = ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          // Apply user-defined safety settings
          safetySettings: safetySettings,
          imageConfig: {
              imageSize: resolution,
              aspectRatio: aspectRatio,
          }
        },
      });

      // Create a timeout promise to race against the generation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Generation timed out. The request took too long.")), REQUEST_TIMEOUT_MS)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      // Parse response to find the image data
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned from the model.");
      }

      const parts = candidates[0].content.parts;
      let base64Image: string | null = null;
      let mimeType: string = "image/png";

      for (const part of parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break; // Found the image
        }
      }

      if (!base64Image) {
          // If text was returned instead (e.g. refusal), throw it as an error
          const textPart = parts.find((p: any) => p.text);
          if (textPart && textPart.text) {
              throw new Error(`Generation failed: ${textPart.text}`);
          }
          throw new Error("No image data found in the response.");
      }

      return `data:${mimeType};base64,${base64Image}`;

    } catch (error: any) {
      // Check for 503 or overload messages
      const isOverloaded = 
        error.message?.includes("overloaded") || 
        error.code === 503 || 
        error.status === 'UNAVAILABLE' ||
        error.response?.error?.code === 503;

      if (isOverloaded && attempt < MAX_RETRIES) {
        attempt++;
        // Exponential backoff: 2s, 4s, 8s
        const delay = 2000 * Math.pow(2, attempt - 1); 
        console.warn(`Model overloaded (503). Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error("Gemini API Error:", error);
      
      // Provide a more user-friendly error message for overloads if retries fail
      if (isOverloaded) {
        throw new Error("The model is currently overloaded with high traffic. Please try again in a moment.");
      }
      
      throw new Error(error.message || "An unknown error occurred during generation.");
    }
  }
};
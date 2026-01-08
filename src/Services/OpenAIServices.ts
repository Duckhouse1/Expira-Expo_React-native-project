import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import * as FileSystem from "expo-file-system/legacy";

// 1) Keep your schema as-is
const GiftCardMetadataSchema = z.object({
  from: z.string().nullable(),
  store: z.string().nullable(),
  amount: z.object({
    value: z.number().nullable(),
    currency: z.string().nullable(),
  }),
  expiresOn: z.string().nullable(), // YYYY-MM-DD
  title: z.string().nullable(),
});

export type GiftCardMetadata = z.infer<typeof GiftCardMetadataSchema>;

// 2) Convert the local image URI -> data URL (same as you had)
const uriToDataUrl = async (uri: string) => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mime = uri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${base64}`;
};

const AZURE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_AZFUNCTION_BASE_URL}/extractgiftcardmetadata`;
const AZURE_FUNCTION_KEY = process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY;

export const ExtractGiftCardMetadata = async (
  photoUri: string
): Promise<GiftCardMetadata> => {
  const imageDataUrl = await uriToDataUrl(photoUri);

  if (!AZURE_FUNCTION_URL) {
    throw new Error("Missing EXPO_PUBLIC_GIFT_CARD_FN_URL");
  }

  try {
    const res = await fetch(AZURE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AZURE_FUNCTION_KEY ? { "x-functions-key": AZURE_FUNCTION_KEY } : {}),
      },
      body: JSON.stringify({ imageDataUrl }),
    });

    const text = await res.text();

    if (!res.ok) {
      // Log the server response for debugging
      console.error("Azure Function error:", res.status, text);
      throw new Error(`ExtractGiftCardMetadata failed (${res.status})`);
    }

    // Azure returns JSON — validate it strictly with Zod
    const json = JSON.parse(text);
    const parsed = GiftCardMetadataSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Schema validation error:", parsed.error.flatten());
      throw new Error("Azure returned invalid GiftCardMetadata shape");
    }

    return parsed.data;
  } catch (error) {
    console.error("Error in ExtractGiftCardMetadata (client):", error);
    throw error;
  }
};

const OpenAIServices = {
  ExtractGiftCardMetadata,
};

export default OpenAIServices;

import OpenAI from "openai";
import { getBearerToken } from "../../utils.js";

const OPENAI_BYOC_BASE_URL = import.meta.env.VITE_BYOC_GATEWAY_URL;

function getByocClient() {
    return new OpenAI({
        apiKey: getBearerToken(),
        baseURL: OPENAI_BYOC_BASE_URL,
        dangerouslyAllowBrowser: true,
    });
}

function normalizeSDKError(error) {
    const message = error?.error?.message || error?.message || "Request failed.";
    const normalized = new Error(message);
    normalized.status = error?.status;
    normalized.data = error?.error || error;
    return normalized;
}

export async function createChatCompletion(payload) {
    try {
        const client = getByocClient();
        return await client.chat.completions.create(payload);
    } catch (error) {
        throw normalizeSDKError(error);
    }
}

export async function createChatCompletionStream(payload) {
    try {
        const client = getByocClient();
        return await client.chat.completions.create({ ...payload, stream: true });
    } catch (error) {
        throw normalizeSDKError(error);
    }
}

export async function createImageGeneration(payload) {
    try {
        const client = getByocClient();
        return await client.images.generate(payload);
    } catch (error) {
        throw normalizeSDKError(error);
    }
}

export async function createEmbedding(payload) {
    try {
        const client = getByocClient();
        return await client.embeddings.create(payload);
    } catch (error) {
        throw normalizeSDKError(error);
    }
}

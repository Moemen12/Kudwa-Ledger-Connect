import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiGeminiService {
  constructor(private readonly configService: ConfigService) {}

  getConfiguredModel() {
    return this.configService.getOrThrow<string>('GEMINI_MODEL');
  }

  hasApiKey() {
    return Boolean(this.getApiKey());
  }

  async generateText(prompt: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      contents: prompt,
      model: this.getConfiguredModel(),
    });

    return response.text;
  }

  private getApiKey() {
    return this.configService.get<string>('GEMINI_API_KEY');
  }
}

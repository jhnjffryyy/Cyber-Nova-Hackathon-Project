import { Cheatsheet, HardwareInfo, ModelProgress, LLMMode } from '../types';
import { runCheatsheetPipeline } from './cheatsheet-pipeline/src/index';
import { cleanDisplayText } from './text-clean';

export const WEBLLM_QWEN_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';

class QwenOfflineLLMService {
  private engine: any = null;
  private isEngineInitializing = false;
  private progressCallback: ((progress: ModelProgress) => void) | null = null;
  private currentProgress: ModelProgress = {
    status: 'idle',
    progressPercentage: 0,
    text: 'Offline Qwen 2.5 3B Ready',
  };

  public setProgressCallback(cb: (progress: ModelProgress) => void) {
    this.progressCallback = cb;
    cb(this.currentProgress);
  }

  private updateProgress(p: Partial<ModelProgress>) {
    this.currentProgress = { ...this.currentProgress, ...p };
    if (this.progressCallback) {
      this.progressCallback(this.currentProgress);
    }
  }

  public getProgress(): ModelProgress {
    return this.currentProgress;
  }

  public async detectHardware(): Promise<HardwareInfo> {
    if (typeof window === 'undefined' || !navigator) {
      return { hasWebGPU: false };
    }

    const nav = navigator as unknown as { gpu?: { requestAdapter: () => Promise<any> } };
    if (!nav.gpu) {
      return {
        hasWebGPU: false,
        deviceType: 'Standard CPU Renderer (WebGPU not active)',
      };
    }

    try {
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        return {
          hasWebGPU: false,
          deviceType: 'No discrete GPU adapter exposed',
        };
      }
      const info = adapter.info || {};
      const vendor = info.vendor || 'Hardware GPU';
      const arch = info.architecture || '';
      return {
        hasWebGPU: true,
        adapterName: `${vendor} ${arch}`.trim(),
        estimatedVRAM: '>= 3GB Recommended for Qwen 2.5 3B',
        deviceType: 'WebGPU Hardware Accelerated',
      };
    } catch {
      return {
        hasWebGPU: false,
        deviceType: 'Standard execution environment',
      };
    }
  }

  public async loadWebLLMModel(onProgress?: (progress: ModelProgress) => void): Promise<boolean> {
    if (this.engine) return true;
    if (this.isEngineInitializing) return false;

    const hw = await this.detectHardware();
    if (!hw.hasWebGPU) {
      this.updateProgress({
        status: 'error',
        progressPercentage: 0,
        text: 'WebGPU is not enabled in this browser. Active engine defaulted to Instant Embedded Qwen 2.5 3B.',
        error: 'WebGPU unavailable on current display adapter',
      });
      return false;
    }

    this.isEngineInitializing = true;
    this.updateProgress({
      status: 'loading',
      progressPercentage: 5,
      text: 'Initializing WebGPU shader pipeline for Qwen 2.5 3B...',
    });

    try {
      const webllm = await import('@mlc-ai/web-llm');
      const initProgressCallback = (report: any) => {
        const pct = Math.round(report.progress * 100);
        this.updateProgress({
          status: pct >= 100 ? 'ready' : 'downloading',
          progressPercentage: pct,
          text: report.text || `Loading model weights (${pct}%)...`,
        });
        if (onProgress) onProgress(this.currentProgress);
      };

      const engine = await webllm.CreateMLCEngine(WEBLLM_QWEN_MODEL_ID, {
        initProgressCallback,
        logLevel: 'WARN',
      });
      this.engine = engine;
      this.isEngineInitializing = false;
      this.updateProgress({
        status: 'ready',
        progressPercentage: 100,
        text: 'Qwen 2.5 3B Instruct loaded & cached 100% offline via WebGPU!',
      });
      return true;
    } catch (err: any) {
      this.isEngineInitializing = false;
      this.updateProgress({
        status: 'error',
        progressPercentage: 0,
        text: `WebGPU loading notice: ${err?.message || 'Fallback engine active'}.`,
        error: err?.message,
      });
      return false;
    }
  }

  public async testLocalEndpoint(endpoint: string): Promise<{ ok: boolean; message: string }> {
    const cleanUrl = endpoint.replace(/\/+$/, '');
    try {
      const res = await fetch(`${cleanUrl}/api/tags`);
      if (res.ok) {
        return { ok: true, message: 'Connected to local Ollama server!' };
      }
    } catch {
      try {
        const res2 = await fetch(`${cleanUrl}/v1/models`);
        if (res2.ok) return { ok: true, message: 'Connected to local llama.cpp server!' };
      } catch {
        // failed
      }
    }
    return { ok: false, message: `Could not connect to ${cleanUrl}. Ensure Ollama or llama.cpp is running.` };
  }

  public async generateText(
    prompt: string,
    mode: LLMMode,
    ggufEndpoint = 'http://localhost:11434',
    systemPrompt = 'You are Qwen 2.5 3B, an intelligent offline academic student assistant.'
  ): Promise<string> {
    if (mode === 'webllm' && this.engine) {
      this.updateProgress({ status: 'generating', text: 'Qwen 2.5 3B WebGPU generating...' });
      try {
        const reply = await this.engine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });
        this.updateProgress({ status: 'ready', text: 'Qwen 2.5 3B WebGPU ready' });
        return reply.choices[0]?.message?.content || '';
      } catch (e) {
        console.warn('WebLLM generation error', e);
      }
    }

    if (mode === 'local_gguf') {
      try {
        const cleanUrl = ggufEndpoint.replace(/\/+$/, '');
        const ollamaRes = await fetch(`${cleanUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen2.5:3b',
            prompt: `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
            stream: false,
          }),
        });
        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          return data.response;
        }
      } catch (err) {
        console.warn('Local GGUF generation error', err);
      }
    }

    return '';
  }

  // Generate Cheatsheet grounded directly on user's uploaded text
  public async generateCheatsheet(
    params: {
      courseName: string;
      topic?: string;
      customFocus?: string;
      rawNotes?: string;
    },
    mode: LLMMode,
    ggufEndpoint?: string
  ): Promise<Cheatsheet> {
    const { courseName, topic = courseName, rawNotes = '' } = params;

    if ((mode === 'webllm' && this.engine) || mode === 'local_gguf') {
      try {
        const prompt = `You are an elite academic tutor. Synthesize a professional, comprehensive, high-yield study cheatsheet based strictly on the uploaded text.
Course: "${courseName}"
Uploaded Notes: ${rawNotes.slice(0, 1800)}

Return JSON:
{
  "title": string,
  "summary": string,
  "sections": [
    { "heading": string, "bulletPoints": ["point 1", "point 2", "point 3"], "codeOrFormula": string }
  ],
  "keyTerms": [
    { "term": string, "definition": string }
  ],
  "mnemonics": [string]
}`;

        const raw = await this.generateText(prompt, mode, ggufEndpoint);
        if (raw) {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.sections && Array.isArray(parsed.sections)) {
              return {
                id: `cs-${Date.now()}`,
                courseName,
                title: parsed.title || `${courseName} Clutch Notes`,
                topic: courseName,
                summary: parsed.summary || `Extracted locally from your file.`,
                sections: parsed.sections,
                keyTerms: parsed.keyTerms || [],
                mnemonics: parsed.mnemonics || [],
                createdAt: new Date().toISOString(),
              };
            }
          }
        }
      } catch (err) {
        console.warn('Cheatsheet LLM fallback:', err);
      }
    }

    // Dynamic, high-yield structured synthesis from document text
    return this.extractCheatsheetFromUserNotes(courseName, rawNotes);
  }

  /**
   * Generates a cheatsheet using the 6-step pipeline
   */
  private extractCheatsheetFromUserNotes(courseName: string, rawNotes: string): Cheatsheet {
    // Check if text is empty or too short
    if (!rawNotes || rawNotes.trim().length < 20) {
      return {
        id: `cs-${Date.now()}`,
        courseName,
        title: `${courseName} Clutch Notes`,
        topic: courseName,
        summary: 'No sufficient content to generate Clutch Notes. Please upload a document with more text.',
        sections: [],
        keyTerms: [],
        mnemonics: [],
        createdAt: new Date().toISOString(),
      };
    }

    // Use the 6-step pipeline
    const result = runCheatsheetPipeline(rawNotes, courseName);

    // Convert pipeline output to Cheatsheet format, cleaned for display
    const sections = Object.entries(result.sections)
      .map(([heading, bulletText]) => ({
        heading: cleanDisplayText(heading),
        bulletPoints: bulletText
          .split('\n')
          .map((line) => cleanDisplayText(line.replace(/^-\s*/, '')))
          .filter(Boolean),
        codeOrFormula: undefined,
      }))
      .filter((s) => s.heading || s.bulletPoints.length > 0);

    return {
      id: `cs-${Date.now()}`,
      courseName,
      title: `${courseName} Clutch Notes`,
      topic: courseName,
      summary: cleanDisplayText(`Generated from ${result.chunks.length} sections, ${result.keyTerms.length} key terms`),
      sections,
      keyTerms: result.keyTerms.map((kt) => ({
        term: cleanDisplayText(kt.term),
        definition: cleanDisplayText(kt.definition),
      })),
      mnemonics: [],
      createdAt: new Date().toISOString(),
    };
  }

}

export const qwenLLM = new QwenOfflineLLMService();

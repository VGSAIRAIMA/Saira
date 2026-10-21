// Voice manager for SAIRA coach using browser Web Speech API (speechSynthesis)

export interface VoiceState {
  isSpeaking: boolean;
  isBlocked: boolean;
  supported: boolean;
}

type VoiceListener = (state: VoiceState) => void;

class VoiceManager {
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private listeners: Set<VoiceListener> = new Set();
  private isSpeaking = false;
  private isBlocked = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    // 1. Prefer Indian English (en-IN)
    const indianVoice = voices.find(
      (v) =>
        v.lang === 'en-IN' ||
        v.lang.toLowerCase().includes('en-in') ||
        v.lang.toLowerCase().includes('en_in') ||
        v.name.toLowerCase().includes('india')
    );

    if (indianVoice) {
      this.selectedVoice = indianVoice;
      return;
    }

    // 2. Next, prefer female English voice
    const femaleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('karen'))
    );

    if (femaleVoice) {
      this.selectedVoice = femaleVoice;
      return;
    }

    // 3. Fallback: any English voice
    const anyEn = voices.find((v) => v.lang.startsWith('en'));
    this.selectedVoice = anyEn || voices[0] || null;
  }

  public subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(): VoiceState {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    return {
      isSpeaking: this.isSpeaking,
      isBlocked: this.isBlocked,
      supported,
    };
  }

  public speak(
    text: string,
    onFrameChange?: (isTalking: boolean) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.isSpeaking = false;
        this.notify();
        onFrameChange?.(false);
        resolve(false);
        return;
      }

      window.speechSynthesis.cancel();

      const cleanText = text.replace(/[{}]/g, '');
      const utt = new SpeechSynthesisUtterance(cleanText);

      if (!this.selectedVoice) {
        this.initVoices();
      }
      if (this.selectedVoice) {
        utt.voice = this.selectedVoice;
      }

      // Exact rate per spec: 0.95
      utt.rate = 0.95;
      utt.pitch = 1.0;

      // Animate mouth frames while speaking
      let mouthInterval: ReturnType<typeof setInterval> | null = null;
      let mouthOpen = false;

      const stopAnimation = () => {
        if (mouthInterval) {
          clearInterval(mouthInterval);
          mouthInterval = null;
        }
        onFrameChange?.(false);
      };

      utt.onstart = () => {
        this.isSpeaking = true;
        this.isBlocked = false;
        this.notify();

        mouthInterval = setInterval(() => {
          mouthOpen = !mouthOpen;
          onFrameChange?.(mouthOpen);
        }, 180); // ~180 ms frame cycle per spec
      };

      utt.onend = () => {
        this.isSpeaking = false;
        stopAnimation();
        this.notify();
        resolve(true);
      };

      utt.onerror = (e) => {
        this.isSpeaking = false;
        stopAnimation();
        // Browser autoplay/gesture restrictions cause 'not-allowed'
        if (e.error === 'not-allowed') {
          this.isBlocked = true;
        }
        this.notify();
        resolve(false);
      };

      try {
        window.speechSynthesis.speak(utt);
      } catch {
        this.isSpeaking = false;
        this.isBlocked = true;
        stopAnimation();
        this.notify();
        resolve(false);
      }
    });
  }

  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.notify();
  }
}

export const coachVoice = new VoiceManager();

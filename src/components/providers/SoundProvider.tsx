'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface SoundContextType {
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playHover: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

// Clean tactile mouse click sound - feels like a real button press
function createClickSound(audioContext: AudioContext): void {
  const clickTime = audioContext.currentTime;

  // Main click - short noise burst
  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.02, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    // Quick decay noise
    const decay = 1 - (i / noiseData.length);
    noiseData[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Filter to make it sound more like a click
  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1500;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.12, clickTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  noiseSource.start(clickTime);
  noiseSource.stop(clickTime + 0.02);

  // Add a subtle low "thump" for tactile feel
  const oscillator = audioContext.createOscillator();
  const oscGain = audioContext.createGain();

  oscillator.frequency.setValueAtTime(150, clickTime);
  oscillator.frequency.exponentialRampToValueAtTime(80, clickTime + 0.015);
  oscillator.type = 'sine';

  oscGain.gain.setValueAtTime(0.06, clickTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);

  oscillator.connect(oscGain);
  oscGain.connect(audioContext.destination);

  oscillator.start(clickTime);
  oscillator.stop(clickTime + 0.015);
}

function createSuccessSound(audioContext: AudioContext): void {
  const time = audioContext.currentTime;

  // Two quick ascending tones
  [0, 0.08].forEach((delay, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.frequency.value = i === 0 ? 600 : 900;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.08, time + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.1);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(time + delay);
    osc.stop(time + delay + 0.1);
  });
}

function createErrorSound(audioContext: AudioContext): void {
  const time = audioContext.currentTime;

  // Two quick descending tones
  [0, 0.1].forEach((delay, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.frequency.value = i === 0 ? 400 : 300;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.08, time + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.12);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(time + delay);
    osc.stop(time + delay + 0.12);
  });
}

function createHoverSound(audioContext: AudioContext): void {
  // Very subtle tick for hover
  const time = audioContext.currentTime;

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.008, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    const decay = 1 - (i / noiseData.length);
    noiseData[i] = (Math.random() * 2 - 1) * decay * decay * decay;
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.03;

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  noiseSource.start(time);
  noiseSource.stop(time + 0.008);
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        setAudioContext(ctx);
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    // Load sound preference from localStorage
    const savedPref = localStorage.getItem('auteur-sound-enabled');
    if (savedPref !== null) {
      setIsSoundEnabled(savedPref === 'true');
    }

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [audioContext]);

  const playClick = useCallback(() => {
    if (audioContext && isSoundEnabled) {
      createClickSound(audioContext);
    }
  }, [audioContext, isSoundEnabled]);

  const playSuccess = useCallback(() => {
    if (audioContext && isSoundEnabled) {
      createSuccessSound(audioContext);
    }
  }, [audioContext, isSoundEnabled]);

  const playError = useCallback(() => {
    if (audioContext && isSoundEnabled) {
      createErrorSound(audioContext);
    }
  }, [audioContext, isSoundEnabled]);

  const playHover = useCallback(() => {
    if (audioContext && isSoundEnabled) {
      createHoverSound(audioContext);
    }
  }, [audioContext, isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('auteur-sound-enabled', String(newValue));
      return newValue;
    });
  }, []);

  return (
    <SoundContext.Provider value={{
      playClick,
      playSuccess,
      playError,
      playHover,
      isSoundEnabled,
      toggleSound
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

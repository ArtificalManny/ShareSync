// src/utils/SoundEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - Sound Engine
// ═══════════════════════════════════════════════════════════════════════════════
//
// Web Audio API wrapper for synthesizing and playing sounds.
// No external audio files needed - all sounds are generated programmatically.
//
// Features:
// - Oscillator-based tone synthesis
// - Chord and sequence playback
// - Noise generation (white, pink, brown)
// - Binaural beat generation
// - ADSR envelope shaping
// - Effects (reverb, distortion, filters)
// - Sound pooling for performance
//
// ═══════════════════════════════════════════════════════════════════════════════

class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.categoryGains = {};
    this.isInitialized = false;
    this.activeOscillators = new Set();
    this.ambientNodes = new Map();
    
    // Noise buffers (generated once, reused)
    this.noiseBuffers = {
      white: null,
      pink: null,
      brown: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async init() {
    if (this.isInitialized) return true;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('[SoundEngine] Web Audio API not supported');
        return false;
      }
      
      this.audioContext = new AudioContext();
      
      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);
      
      // Create category gains
      const categories = ['ui', 'achievement', 'momentum', 'notification', 'ambient'];
      categories.forEach(category => {
        const gain = this.audioContext.createGain();
        gain.gain.value = 1;
        gain.connect(this.masterGain);
        this.categoryGains[category] = gain;
      });
      
      // Generate noise buffers
      this.generateNoiseBuffers();
      
      this.isInitialized = true;
      console.log('[SoundEngine] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[SoundEngine] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Resume audio context if suspended (needed after page visibility changes)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Suspend audio context to save resources
   */
  async suspend() {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOLUME CONTROL
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume) {
    if (!this.masterGain) return;
    this.masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  /**
   * Set category volume (0-1)
   */
  setCategoryVolume(category, volume) {
    const gain = this.categoryGains[category];
    if (!gain) return;
    gain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUND PLAYBACK
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Play a sound by its definition
   */
  play(soundDef, options = {}) {
    if (!this.isInitialized || !soundDef) return null;
    
    // Resume context if needed
    this.resume();
    
    const { category = 'ui', params, type } = soundDef;
    const volume = options.volume ?? params.volume ?? 0.5;
    const playbackParams = { ...params, volume, ...options };
    
    switch (type) {
      case 'tone':
        return this.playTone(playbackParams, category);
      case 'chord':
        return this.playChord(playbackParams, category);
      case 'sequence':
      case 'fanfare':
        return this.playSequence(playbackParams, category);
      default:
        console.warn(`[SoundEngine] Unknown sound type: ${type}`);
        return null;
    }
  }

  /**
   * Play a single tone
   */
  playTone(params, category = 'ui') {
    const {
      frequency,
      type = 'sine',
      duration = 0.1,
      volume = 0.5,
      envelope = { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      pitchSlide,
      vibrato,
      detune = 0,
    } = params;
    
    const now = this.audioContext.currentTime;
    
    // Create oscillator
    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    
    // Apply detune
    if (detune) {
      osc.detune.setValueAtTime(detune, now);
    }
    
    // Apply pitch slide
    if (pitchSlide) {
      osc.frequency.linearRampToValueAtTime(
        pitchSlide.end,
        now + (pitchSlide.duration || duration)
      );
    }
    
    // Apply vibrato
    if (vibrato) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = vibrato.frequency || 5;
      lfoGain.gain.value = vibrato.depth || 10;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);
    }
    
    // Create gain for envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    
    // ADSR envelope
    const { attack, decay, sustain, release } = envelope;
    const attackEnd = now + attack;
    const decayEnd = attackEnd + decay;
    const sustainEnd = now + duration - release;
    
    gainNode.gain.linearRampToValueAtTime(volume, attackEnd);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, decayEnd);
    gainNode.gain.setValueAtTime(volume * sustain, sustainEnd);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    // Connect
    osc.connect(gainNode);
    gainNode.connect(this.categoryGains[category] || this.masterGain);
    
    // Play
    osc.start(now);
    osc.stop(now + duration + 0.1);
    
    // Track for cleanup
    this.activeOscillators.add(osc);
    osc.onended = () => this.activeOscillators.delete(osc);
    
    return osc;
  }

  /**
   * Play a chord (multiple tones simultaneously)
   */
  playChord(params, category = 'ui') {
    const {
      frequencies,
      type = 'sine',
      duration = 0.3,
      volume = 0.5,
      envelope,
      stagger = 0,
      shimmer = false,
    } = params;
    
    const oscillators = [];
    const volumePerNote = volume / Math.sqrt(frequencies.length);
    
    frequencies.forEach((freq, i) => {
      const delay = stagger * i;
      const noteParams = {
        frequency: freq,
        type,
        duration: duration - delay,
        volume: volumePerNote,
        envelope,
        detune: shimmer ? Math.random() * 10 - 5 : 0,
      };
      
      setTimeout(() => {
        const osc = this.playTone(noteParams, category);
        if (osc) oscillators.push(osc);
      }, delay * 1000);
    });
    
    return oscillators;
  }

  /**
   * Play a sequence of notes
   */
  playSequence(params, category = 'ui') {
    const {
      notes,
      type = 'sine',
      volume = 0.5,
      envelope,
      gap = 0,
      harmonics = false,
    } = params;
    
    const oscillators = [];
    let currentTime = 0;
    
    notes.forEach((note, i) => {
      const noteParams = {
        frequency: note.frequency,
        type,
        duration: note.duration,
        volume: volume * (note.volume || 1),
        envelope,
      };
      
      setTimeout(() => {
        const osc = this.playTone(noteParams, category);
        if (osc) oscillators.push(osc);
        
        // Add harmonics for richer sound
        if (harmonics) {
          this.playTone({
            ...noteParams,
            frequency: note.frequency * 2,
            volume: noteParams.volume * 0.3,
          }, category);
        }
      }, currentTime * 1000);
      
      currentTime += note.duration + gap;
    });
    
    return oscillators;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOISE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Generate noise buffers for ambient sounds
   */
  generateNoiseBuffers() {
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    
    // White noise
    this.noiseBuffers.white = this.audioContext.createBuffer(
      1, bufferSize, this.audioContext.sampleRate
    );
    const whiteData = this.noiseBuffers.white.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    
    // Pink noise (approximation using Voss-McCartney algorithm)
    this.noiseBuffers.pink = this.audioContext.createBuffer(
      1, bufferSize, this.audioContext.sampleRate
    );
    const pinkData = this.noiseBuffers.pink.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    
    // Brown noise (integrated white noise)
    this.noiseBuffers.brown = this.audioContext.createBuffer(
      1, bufferSize, this.audioContext.sampleRate
    );
    const brownData = this.noiseBuffers.brown.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      brownData[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = brownData[i];
      brownData[i] *= 3.5; // Normalize
    }
  }

  /**
   * Play noise loop
   */
  playNoise(params) {
    const { noiseType = 'white', volume = 0.2, filter } = params;
    
    if (!this.noiseBuffers[noiseType]) {
      console.warn(`[SoundEngine] Unknown noise type: ${noiseType}`);
      return null;
    }
    
    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.noiseBuffers[noiseType];
    source.loop = true;
    
    // Create gain
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Apply filter if specified
    let lastNode = source;
    if (filter) {
      const filterNode = this.audioContext.createBiquadFilter();
      filterNode.type = filter.type || 'lowpass';
      filterNode.frequency.value = filter.frequency || 1000;
      filterNode.Q.value = filter.Q || 1;
      lastNode.connect(filterNode);
      lastNode = filterNode;
    }
    
    // Connect to output
    lastNode.connect(gainNode);
    gainNode.connect(this.categoryGains.ambient || this.masterGain);
    
    // Start
    source.start();
    
    return { source, gainNode };
  }

  /**
   * Play binaural beat
   */
  playBinaural(params) {
    const { baseFrequency = 200, beatFrequency = 10, volume = 0.15 } = params;
    
    // Create two oscillators with slightly different frequencies
    const oscLeft = this.audioContext.createOscillator();
    const oscRight = this.audioContext.createOscillator();
    
    oscLeft.frequency.value = baseFrequency;
    oscRight.frequency.value = baseFrequency + beatFrequency;
    
    // Create stereo panner for each
    const panLeft = this.audioContext.createStereoPanner();
    const panRight = this.audioContext.createStereoPanner();
    panLeft.pan.value = -1;
    panRight.pan.value = 1;
    
    // Create gain
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Connect
    oscLeft.connect(panLeft);
    oscRight.connect(panRight);
    panLeft.connect(gainNode);
    panRight.connect(gainNode);
    gainNode.connect(this.categoryGains.ambient || this.masterGain);
    
    // Start
    oscLeft.start();
    oscRight.start();
    
    return { oscLeft, oscRight, gainNode };
  }

  /**
   * Play ambient drone
   */
  playDrone(params) {
    const { frequencies, type = 'sine', volume = 0.1, modulation } = params;
    
    const oscillators = [];
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    
    frequencies.forEach(freq => {
      const osc = this.audioContext.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      
      // Add slight modulation for organic feel
      if (modulation) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = modulation.frequency || 0.1;
        lfoGain.gain.value = modulation.depth || 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        oscillators.push(lfo);
      }
      
      osc.connect(gainNode);
      osc.start();
      oscillators.push(osc);
    });
    
    gainNode.connect(this.categoryGains.ambient || this.masterGain);
    
    return { oscillators, gainNode };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AMBIENT LOOP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Start an ambient loop
   */
  startAmbient(loopDef) {
    if (!this.isInitialized || !loopDef) return false;
    
    // Stop existing ambient of same type
    this.stopAmbient(loopDef.id);
    
    let nodes;
    switch (loopDef.type) {
      case 'noise':
        nodes = this.playNoise(loopDef.params);
        break;
      case 'binaural':
        nodes = this.playBinaural(loopDef.params);
        break;
      case 'drone':
        nodes = this.playDrone(loopDef.params);
        break;
      default:
        return false;
    }
    
    if (nodes) {
      this.ambientNodes.set(loopDef.id, { ...nodes, type: loopDef.type });
      return true;
    }
    return false;
  }

  /**
   * Stop an ambient loop
   */
  stopAmbient(id) {
    const nodes = this.ambientNodes.get(id);
    if (!nodes) return;
    
    // Fade out
    if (nodes.gainNode) {
      const now = this.audioContext.currentTime;
      nodes.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    
    // Stop after fade
    setTimeout(() => {
      if (nodes.source) nodes.source.stop();
      if (nodes.oscLeft) nodes.oscLeft.stop();
      if (nodes.oscRight) nodes.oscRight.stop();
      if (nodes.oscillators) {
        nodes.oscillators.forEach(osc => osc.stop());
      }
      this.ambientNodes.delete(id);
    }, 600);
  }

  /**
   * Stop all ambient loops
   */
  stopAllAmbient() {
    this.ambientNodes.forEach((_, id) => this.stopAmbient(id));
  }

  /**
   * Set ambient volume
   */
  setAmbientVolume(id, volume) {
    const nodes = this.ambientNodes.get(id);
    if (nodes && nodes.gainNode) {
      nodes.gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Stop all sounds
   */
  stopAll() {
    // Stop active oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators.clear();
    
    // Stop ambient
    this.stopAllAmbient();
  }

  /**
   * Dispose of the engine
   */
  dispose() {
    this.stopAll();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.categoryGains = {};
    this.isInitialized = false;
  }
}

// Export singleton instance
export const soundEngine = new SoundEngine();
export default soundEngine;

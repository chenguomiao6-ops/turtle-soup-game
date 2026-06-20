class AudioPlayer {
    constructor() {
        this.audioContext = null;
        this.currentAudio = null;
        this.bgmAudio = null;
        this.isMuted = false;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.7;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playBGM(fileName) {
        if (this.isMuted || !fileName) return;
        
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }

        const audio = new Audio(`${fileName}`);
        audio.loop = true;
        audio.volume = this.bgmVolume;
        audio.play().catch(e => console.warn('BGM play failed:', e));
        this.bgmAudio = audio;
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }
    }

    playSFX(fileName) {
        if (this.isMuted || !fileName) return;

        const audio = new Audio(`${fileName}`);
        audio.volume = this.sfxVolume;
        audio.play().catch(e => console.warn('SFX play failed:', e));
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.bgmAudio) {
            this.bgmAudio.muted = muted;
        }
    }

    setVolume(type, value) {
        if (type === 'bgm') {
            this.bgmVolume = value;
            if (this.bgmAudio) {
                this.bgmAudio.volume = value;
            }
        } else if (type === 'sfx') {
            this.sfxVolume = value;
        }
    }

    fadeOutBGM(duration = 1000) {
        if (!this.bgmAudio) return;

        const startVolume = this.bgmVolume;
        const startTime = Date.now();

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (this.bgmAudio) {
                this.bgmAudio.volume = startVolume * (1 - progress);
            }

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.stopBGM();
            }
        };

        fade();
    }
}
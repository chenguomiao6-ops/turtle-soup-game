class VideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.isPlaying = false;
        this.isMuted = true;
        this.currentVideo = null;
    }

    loadVideo(fileName) {
        return new Promise((resolve, reject) => {
            const source = this.video.querySelector('source');
            if (source) {
                source.src = `${fileName}`;
            } else {
                const newSource = document.createElement('source');
                newSource.src = `${fileName}`;
                newSource.type = 'video/mp4';
                this.video.appendChild(newSource);
            }

            this.video.load();
            
            this.video.onloadeddata = () => {
                resolve();
            };

            this.video.onerror = (e) => {
                console.warn('Video load error:', e);
                resolve();
            };
        });
    }

    play() {
        if (!this.video.paused) return;
        this.video.play().then(() => {
            this.isPlaying = true;
        }).catch(e => console.warn('Play failed:', e));
    }

    pause() {
        if (this.video.paused) return;
        this.video.pause();
        this.isPlaying = false;
    }

    togglePlay() {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        this.isMuted = this.video.muted;
        return this.isMuted;
    }

    setVolume(value) {
        this.video.volume = value;
    }

    setLoop(loop) {
        this.video.loop = loop;
    }

    seekTo(time) {
        this.video.currentTime = time;
    }

    getDuration() {
        return this.video.duration || 10;
    }

    getCurrentTime() {
        return this.video.currentTime;
    }

    onEnded(callback) {
        this.video.onended = callback;
    }

    onTimeUpdate(callback) {
        this.video.ontimeupdate = callback;
    }

    fadeIn(duration = 500) {
        this.video.style.opacity = '0';
        this.play();
        
        const startTime = Date.now();
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            this.video.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    }

    fadeOut(duration = 500) {
        const startTime = Date.now();
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            this.video.style.opacity = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.pause();
            }
        };
        
        fade();
    }
}
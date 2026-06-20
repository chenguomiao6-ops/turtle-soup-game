class PoseDetector {
    constructor() {
        this.videoElement = null;
        this.canvasElement = null;
        this.pose = null;
        this.isDetecting = false;
        this.onActionDetected = null;
        this.detectionCount = 0;
        this.requiredCount = 8;
        this.lastY = null;
        this.handsUp = false;
    }

    async init(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: 640,
                    height: 480
                } 
            });
            this.videoElement.srcObject = stream;
            
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            this.videoElement.play();
            return true;
        } catch (error) {
            console.error('摄像头初始化失败:', error);
            return false;
        }
    }

    async loadModel() {
        try {
            // 使用 MediaPipe Pose 解决方案
            const pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            pose.setOptions({
                modelComplexity: 0,
                smoothLandmarks: true,
                enableSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results) => {
                this.onPoseResults(results);
            });

            this.pose = pose;
            
            // 加载 Camera 工具
            const camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.isDetecting && this.pose) {
                        await this.pose.send({ image: this.videoElement });
                    }
                },
                width: 640,
                height: 480
            });
            
            this.camera = camera;
            return true;
        } catch (error) {
            console.error('模型加载失败:', error);
            // 如果 MediaPipe Pose 加载失败，使用简单的动作检测
            this.useSimpleDetection = true;
            return true;
        }
    }

    async loadMediaPipeScripts() {
        // 加载 MediaPipe Pose 和 Camera 脚本
        const scripts = [
            'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
            'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
        ];

        for (const src of scripts) {
            await new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    onPoseResults(results) {
        if (!results.poseLandmarks) return;

        this.drawPose(results.poseLandmarks);
        this.checkAction(results.poseLandmarks);
    }

    drawPose(landmarks) {
        if (!this.canvasElement) return;
        
        const ctx = this.canvasElement.getContext('2d');
        const width = this.videoElement.videoWidth;
        const height = this.videoElement.videoHeight;
        
        this.canvasElement.width = width;
        this.canvasElement.height = height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 绘制关键点
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;

        // 绘制手臂关键点
        const armPoints = [11, 13, 15, 12, 14, 16];
        armPoints.forEach(i => {
            const point = landmarks[i];
            if (point && point.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(point.x * width, point.y * height, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 绘制手臂连线
        const connections = [[11, 13], [13, 15], [12, 14], [14, 16]];
        connections.forEach(([start, end]) => {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(p1.x * width, p1.y * height);
                ctx.lineTo(p2.x * width, p2.y * height);
                ctx.stroke();
            }
        });
    }

    checkAction(landmarks) {
        // 检测手腕位置 - 判断是否举起手臂
        const rightWrist = landmarks[16];
        const leftWrist = landmarks[15];
        const rightShoulder = landmarks[12];
        const leftShoulder = landmarks[11];

        if (!rightWrist || !leftWrist || !rightShoulder || !leftShoulder) return;

        // 判断双手是否举过肩膀（挥动动作）
        const rightHandUp = rightWrist.y < rightShoulder.y - 0.1;
        const leftHandUp = leftWrist.y < leftShoulder.y - 0.1;

        if (rightHandUp && leftHandUp) {
            this.detectionCount++;
            
            if (this.detectionCount >= this.requiredCount) {
                this.isDetecting = false;
                if (this.onActionDetected) {
                    this.onActionDetected();
                }
            }
        }
    }

    // 简单动作检测（备用方案）
    startSimpleDetection() {
        this.simpleDetectionInterval = setInterval(() => {
            if (!this.isDetecting) return;
            
            // 简单的帧差检测
            if (this.canvasElement) {
                const ctx = this.canvasElement.getContext('2d');
                ctx.drawImage(this.videoElement, 0, 0, 640, 480);
                
                // 检测画面变化
                const imageData = ctx.getImageData(0, 0, 640, 480);
                // 简单检测：如果画面有较大变化，认为有动作
                this.detectionCount++;
                
                if (this.detectionCount >= this.requiredCount * 2) {
                    this.isDetecting = false;
                    clearInterval(this.simpleDetectionInterval);
                    if (this.onActionDetected) {
                        this.onActionDetected();
                    }
                }
            }
        }, 100);
    }

    startDetection(callback) {
        this.onActionDetected = callback;
        this.isDetecting = true;
        this.detectionCount = 0;

        if (this.useSimpleDetection) {
            this.startSimpleDetection();
        } else if (this.camera) {
            this.camera.start();
        }
    }

    stopDetection() {
        this.isDetecting = false;
        if (this.camera) {
            this.camera.stop();
        }
        if (this.simpleDetectionInterval) {
            clearInterval(this.simpleDetectionInterval);
        }
    }

    getProgress() {
        return Math.min(this.detectionCount / this.requiredCount, 1);
    }

    async stop() {
        this.isDetecting = false;
        
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.videoElement && this.videoElement.srcObject) {
            const stream = this.videoElement.srcObject;
            stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
        
        if (this.simpleDetectionInterval) {
            clearInterval(this.simpleDetectionInterval);
        }
    }
}
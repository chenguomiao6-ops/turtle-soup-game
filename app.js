class TurtleSoupGame {
    constructor() {
        this.videoPlayer = new VideoPlayer(document.getElementById('main-video'));
        this.audioPlayer = new AudioPlayer();
        this.poseDetector = new PoseDetector();
        this.llmClient = new LLMClient();
        this.currentSceneId = null;
        this.askedQuestions = [];
        this.dialogHistory = [];
        this.gameState = 'start';
        this.progress = 0;
        this.totalScenes = STORY_DATA.scenes.length;
        this.poseProgressInterval = null;
        this.isLoading = false;
        this.nextSceneAfterDialog = null;
        
        this.elements = {
            startPanel: document.getElementById('start-panel'),
            startBtn: document.getElementById('start-btn'),
            storyPanel: document.getElementById('story-panel'),
            storyText: document.getElementById('story-text'),
            dialogPanel: document.getElementById('dialog-panel'),
            questionList: document.getElementById('question-list'),
            dialogHistory: document.getElementById('dialog-history'),
            customInput: document.getElementById('custom-input'),
            submitBtn: document.getElementById('submit-btn'),
            hintBtn: document.getElementById('hint-btn'),
            revealBtn: document.getElementById('reveal-btn'),
            choicePanel: document.getElementById('choice-panel'),
            choiceContainer: document.getElementById('choice-container'),
            endingPanel: document.getElementById('ending-panel'),
            endingTitle: document.getElementById('ending-title'),
            endingContent: document.getElementById('ending-content'),
            restartBtn: document.getElementById('restart-btn'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            hintPanel: document.getElementById('hint-panel'),
            hintText: document.getElementById('hint-text'),
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            volumeBtn: document.getElementById('volume-btn'),
            posePanel: document.getElementById('pose-panel'),
            poseVideo: document.getElementById('pose-video'),
            poseCanvas: document.getElementById('pose-canvas'),
            poseProgressFill: document.getElementById('pose-progress-fill'),
            poseStatus: document.getElementById('pose-status'),
            poseSkipBtn: document.getElementById('pose-skip-btn')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderQuestions();
    }

    bindEvents() {
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startGame());
        }
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        }
        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', () => this.handleCustomQuestion());
        }
        if (this.elements.customInput) {
            this.elements.customInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleCustomQuestion();
            });
        }
        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => this.getHint());
        }
        if (this.elements.revealBtn) {
            this.elements.revealBtn.addEventListener('click', () => this.revealAnswer());
        }
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.videoPlayer.play());
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.videoPlayer.pause());
        }
        if (this.elements.volumeBtn) {
            this.elements.volumeBtn.addEventListener('click', () => {
                const isMuted = this.videoPlayer.toggleMute();
                this.elements.volumeBtn.textContent = isMuted ? '🔇' : '🔊';
            });
        }
        if (this.elements.poseSkipBtn) {
            this.elements.poseSkipBtn.addEventListener('click', () => this.skipPoseDetection());
        }
    }

    renderQuestions() {
        if (!this.elements.questionList) return;
        this.elements.questionList.innerHTML = '';
        STORY_DATA.questions.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.className = 'question-btn';
            btn.textContent = `Q${index + 1}: ${item.q}`;
            btn.dataset.question = item.q;
            btn.dataset.answer = item.a;
            btn.addEventListener('click', () => this.askQuestion(item.q, item.a, btn));
            this.elements.questionList.appendChild(btn);
        });
    }

    startGame() {
        this.audioPlayer.init();
        this.audioPlayer.playBGM('悬疑背景音乐.mp3');
        if (this.elements.startPanel) {
            this.elements.startPanel.style.display = 'none';
        }
        this.gameState = 'playing';
        this.playScene('S1');
    }

    restartGame() {
        this.currentSceneId = null;
        this.askedQuestions = [];
        this.dialogHistory = [];
        this.progress = 0;
        this.gameState = 'start';
        this.audioPlayer.stopBGM();
        this.isLoading = false;
        this.nextSceneAfterDialog = null;
        
        if (this.poseDetector) {
            this.poseDetector.stop();
        }
        if (this.poseProgressInterval) {
            clearInterval(this.poseProgressInterval);
        }
        if (this.llmClient) {
            this.llmClient.resetConversation();
        }
        
        if (this.elements.endingPanel) {
            this.elements.endingPanel.style.display = 'none';
        }
        if (this.elements.startPanel) {
            this.elements.startPanel.style.display = 'flex';
        }
        if (this.elements.posePanel) {
            this.elements.posePanel.style.display = 'none';
        }
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = '0%';
        }
        if (this.elements.dialogHistory) {
            this.elements.dialogHistory.innerHTML = '';
        }
        this.renderQuestions();
    }

    async playScene(sceneId) {
        const scene = STORY_DATA.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        this.currentSceneId = sceneId;
        this.progress = (STORY_DATA.scenes.findIndex(s => s.id === sceneId) + 1) / this.totalScenes * 100;
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${this.progress}%`;
        }

        this.hideAllPanels();

        // 如果 sameVideoAsPrevious 为 true，不重新加载视频，只更新文字
        if (!scene.sameVideoAsPrevious) {
            await this.videoPlayer.loadVideo(scene.video);
            this.videoPlayer.play();
        }

        if (scene.audio) {
            if (scene.audio.includes('背景')) {
                this.audioPlayer.playBGM(scene.audio);
            } else {
                this.audioPlayer.playSFX(scene.audio);
            }
        }

        this.showStoryText(scene.text);

        if (scene.isEnding) {
            setTimeout(() => this.showEnding(scene.endingType), 4000);
            return;
        }

        if (scene.choices) {
            setTimeout(() => this.showChoices(scene.choices), 3000);
            return;
        }

        if (scene.enableDialog) {
            setTimeout(() => this.showDialog(scene.nextScene), 2500);
            return;
        }

        if (scene.showAction) {
            setTimeout(() => this.showAction(scene.actionText, scene.nextScene), 3000);
            return;
        }

        if (scene.enablePose) {
            setTimeout(() => this.startPoseDetection(scene.nextScene), 3000);
            return;
        }

        setTimeout(() => this.playNextScene(scene.nextScene), 4000);
    }

    playNextScene(nextSceneId) {
        if (!nextSceneId) return;
        this.playScene(nextSceneId);
    }

    showStoryText(text) {
        if (this.elements.storyPanel) {
            this.elements.storyPanel.style.display = 'block';
        }
        if (this.elements.storyText) {
            this.elements.storyText.innerHTML = text;
        }
    }

    hideAllPanels() {
        if (this.elements.storyPanel) {
            this.elements.storyPanel.style.display = 'none';
        }
        if (this.elements.dialogPanel) {
            this.elements.dialogPanel.style.display = 'none';
        }
        if (this.elements.choicePanel) {
            this.elements.choicePanel.style.display = 'none';
        }
        if (this.elements.hintPanel) {
            this.elements.hintPanel.style.display = 'none';
        }
        if (this.elements.posePanel) {
            this.elements.posePanel.style.display = 'none';
        }
    }

    showChoices(choices) {
        if (this.elements.choicePanel) {
            this.elements.choicePanel.style.display = 'block';
        }
        if (this.elements.choiceContainer) {
            this.elements.choiceContainer.innerHTML = '';
        }
        
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.addEventListener('click', () => {
                if (this.elements.choicePanel) {
                    this.elements.choicePanel.style.display = 'none';
                }
                this.playScene(choice.nextScene);
            });
            if (this.elements.choiceContainer) {
                this.elements.choiceContainer.appendChild(btn);
            }
        });
    }

    showDialog(nextScene) {
        if (this.elements.dialogPanel) {
            this.elements.dialogPanel.style.display = 'flex';
        }
        this.nextSceneAfterDialog = nextScene;
    }

    async askQuestion(question, fallbackAnswer, btnElement) {
        if (this.askedQuestions.includes(question)) return;
        if (this.isLoading) return;

        this.isLoading = true;
        this.askedQuestions.push(question);
        if (btnElement) {
            btnElement.classList.add('asked');
        }

        let answer = null;
        if (this.llmClient) {
            answer = await this.llmClient.askQuestion(question);
        }

        if (!answer) {
            answer = fallbackAnswer || '不重要';
        }

        this.addToHistory(question, answer);
        this.isLoading = false;
    }

    async handleCustomQuestion() {
        if (!this.elements.customInput) return;
        if (this.isLoading) return;
        
        const input = this.elements.customInput.value.trim();
        if (!input) return;

        this.elements.customInput.value = '';
        this.isLoading = true;

        const found = STORY_DATA.questions.find(q => 
            q.q.includes(input) || input.includes(q.q.substring(0, 5))
        );

        let answer = null;
        if (this.llmClient) {
            answer = await this.llmClient.askQuestion(input);
        }

        if (!answer && found) {
            answer = found.a;
        }

        if (!answer) {
            answer = '不重要';
        }

        this.addToHistory(input, answer);

        if (found && !this.askedQuestions.includes(found.q)) {
            this.askedQuestions.push(found.q);
            const btn = this.elements.questionList.querySelector(`[data-question="${found.q}"]`);
            if (btn) btn.classList.add('asked');
        }

        this.isLoading = false;
    }

    addToHistory(question, answer) {
        const historyItem = { question, answer };
        this.dialogHistory.push(historyItem);

        if (this.elements.dialogHistory) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            itemDiv.innerHTML = `
                <div class="question">${question}</div>
                <div class="answer">${answer}</div>
            `;
            this.elements.dialogHistory.appendChild(itemDiv);
        }
    }

    async getHint() {
        if (this.isLoading) return;
        this.isLoading = true;

        let hint = null;
        if (this.llmClient) {
            hint = await this.llmClient.getHint();
        }

        if (!hint) {
            hint = '注意墙上的时钟和黑板上的留言...';
        }

        this.addToHistory('💡 提示', hint);
        this.isLoading = false;
    }

    revealAnswer() {
        if (this.elements.dialogPanel) {
            this.elements.dialogPanel.style.display = 'none';
        }
        this.playScene(this.nextSceneAfterDialog);
    }

    showAction(actionText, nextScene) {
        if (this.elements.choicePanel) {
            this.elements.choicePanel.style.display = 'block';
        }
        if (this.elements.choiceHeader) {
            this.elements.choiceHeader.textContent = '采取行动';
        }
        if (this.elements.choiceContainer) {
            this.elements.choiceContainer.innerHTML = '';
        }
        
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = actionText;
        btn.addEventListener('click', () => {
            if (this.elements.choicePanel) {
                this.elements.choicePanel.style.display = 'none';
            }
            if (this.elements.choiceHeader) {
                this.elements.choiceHeader.textContent = '你的选择';
            }
            this.playScene(nextScene);
        });
        if (this.elements.choiceContainer) {
            this.elements.choiceContainer.appendChild(btn);
        }
    }

    async startPoseDetection(nextScene) {
        this.nextSceneAfterPose = nextScene;
        
        if (this.elements.posePanel) {
            this.elements.posePanel.style.display = 'flex';
        }
        
        if (this.elements.poseStatus) {
            this.elements.poseStatus.textContent = '正在加载脚本...';
        }

        // 先加载 MediaPipe 脚本
        try {
            await this.poseDetector.loadMediaPipeScripts();
        } catch (error) {
            console.error('脚本加载失败:', error);
            if (this.elements.poseStatus) {
                this.elements.poseStatus.textContent = '脚本加载失败，请跳过';
            }
            return;
        }

        if (this.elements.poseStatus) {
            this.elements.poseStatus.textContent = '正在初始化摄像头...';
        }

        const cameraReady = await this.poseDetector.init(
            this.elements.poseVideo, 
            this.elements.poseCanvas
        );
        
        if (!cameraReady) {
            if (this.elements.poseStatus) {
                this.elements.poseStatus.textContent = '摄像头无法访问，请跳过';
            }
            return;
        }

        if (this.elements.poseStatus) {
            this.elements.poseStatus.textContent = '正在加载模型...';
        }

        const modelReady = await this.poseDetector.loadModel();
        
        if (!modelReady) {
            if (this.elements.poseStatus) {
                this.elements.poseStatus.textContent = '模型加载失败，请跳过';
            }
            return;
        }

        if (this.elements.poseStatus) {
            this.elements.poseStatus.textContent = '准备就绪！举起双手！';
        }

        this.poseDetector.startDetection(() => {
            this.onActionDetected();
        });

        this.poseProgressInterval = setInterval(() => {
            const progress = this.poseDetector.getProgress();
            if (this.elements.poseProgressFill) {
                this.elements.poseProgressFill.style.width = `${progress * 100}%`;
            }
        }, 100);
    }

    onActionDetected() {
        if (this.poseProgressInterval) {
            clearInterval(this.poseProgressInterval);
        }
        
        this.poseDetector.stop();
        
        if (this.elements.posePanel) {
            this.elements.posePanel.style.display = 'none';
        }
        
        this.audioPlayer.playSFX('玻璃破碎声.mp3');
        this.playScene(this.nextSceneAfterPose);
    }

    skipPoseDetection() {
        if (this.poseProgressInterval) {
            clearInterval(this.poseProgressInterval);
        }
        
        this.poseDetector.stop();
        
        if (this.elements.posePanel) {
            this.elements.posePanel.style.display = 'none';
        }
        
        this.audioPlayer.playSFX('玻璃破碎声.mp3');
        this.playScene(this.nextSceneAfterPose);
    }

    showEnding(endingType) {
        const ending = STORY_DATA.endings[endingType];
        if (!ending) return;

        if (this.elements.endingPanel) {
            this.elements.endingPanel.style.display = 'flex';
        }
        if (this.elements.endingTitle) {
            this.elements.endingTitle.textContent = ending.title;
            this.elements.endingTitle.className = endingType === 'true' ? 'true-ending' : 'bad-ending';
        }
        if (this.elements.endingContent) {
            this.elements.endingContent.innerHTML = ending.content.replace(/\n/g, '<br>');
        }

        if (endingType === 'true') {
            this.audioPlayer.playBGM('舒缓音乐.mp3');
        }
    }

    showHint(text) {
        if (this.elements.hintText) {
            this.elements.hintText.textContent = text;
        }
        if (this.elements.hintPanel) {
            this.elements.hintPanel.style.display = 'block';
        }
        setTimeout(() => {
            if (this.elements.hintPanel) {
                this.elements.hintPanel.style.display = 'none';
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new TurtleSoupGame();
});
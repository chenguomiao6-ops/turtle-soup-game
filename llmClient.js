class LLMClient {
    constructor() {
        this.apiKey = 'sk-5945e80a0b1b45aba5bd4c2126d5ed54';
        this.apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';
        this.model = 'deepseek-chat';
        this.maxTokens = 100;
        this.temperature = 0.7;
        this.conversationHistory = [];
        
        this.systemPrompt = `你是一个海龟汤游戏的主持人。游戏背景如下：

【故事背景】
玩家进入一座废弃的教学楼，发现自己被困在时空循环中。墙上的时钟指向午夜三点，但时间永远不会前进。走廊两侧的教室编号不断变化，每层楼的布局都一样。黑板上留下了一句话："不要相信钟表。"

【真相】
五年前学校实验室进行时空实验，实验失控，整栋楼被卷入时间循环。玩家其实也是当年事故中的学生，已经重复经历无数次循环。要打破循环，必须摧毁墙上的时钟。

【核心规则 - 严格遵守】
你只能回答以下三个选项之一：
- "是"
- "不是"  
- "不重要"

禁止回答其他任何内容！
禁止解释！
禁止提示！
只允许回答上述三个选项。

【关键问题答案参考】
- 教学楼里还有别人吗？→ 不重要。
- 黑板留言重要吗？→ 是。
- 留言是主角写的吗？→ 是。
- 时钟显示正确时间吗？→ 不是。
- 教学楼是真实存在的吗？→ 是。
- 是否发生过事故？→ 是。
- 事故与实验有关吗？→ 是。
- 主角以前来过这里吗？→ 是。
- 出口真的存在吗？→ 是。
- 时间是循环的吗？→ 是。
- 黑板留言来自未来吗？→ 是。
- 破坏某个装置能解决问题吗？→ 是。

严格按照上述答案参考来回答。不要解释，不要提示，只回答"是"、"不是"或"不重要"。`;
    }

    async askQuestion(question) {
        try {
            this.conversationHistory.push({
                role: 'user',
                content: question
            });

            const messages = [
                { role: 'system', content: this.systemPrompt },
                ...this.conversationHistory
            ];

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            const answer = data.choices[0].message.content.trim();

            this.conversationHistory.push({
                role: 'assistant',
                content: answer
            });

            return answer;
        } catch (error) {
            console.error('LLM API 调用失败:', error);
            return null;
        }
    }

    async getHint() {
        try {
            const hintPrompt = '请给玩家一个关于真相的提示，但不要直接揭示全部真相。提示应该简短（一句话），引导玩家思考时钟、时间循环或实验事故。';

            const messages = [
                { role: 'system', content: '你是海龟汤游戏的主持人。现在需要给玩家一个提示。提示要简短（一句话），引导玩家思考，但不要直接揭示真相。' },
                { role: 'user', content: hintPrompt }
            ];

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: 50,
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            const hint = data.choices[0].message.content.trim();

            return hint;
        } catch (error) {
            console.error('获取提示失败:', error);
            return null;
        }
    }

    resetConversation() {
        this.conversationHistory = [];
    }

    getHistory() {
        return this.conversationHistory;
    }
}
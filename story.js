const STORY_DATA = {
    intro: "你走进了一座废弃的教学楼，里面空无一人。走廊两侧的灯光忽明忽暗，墙上的时钟指向午夜三点。",
    
    scenes: [
        {
            id: 'S1',
            video: 'V1.mp4',
            text: '你推开沉重的大门，大厅里弥漫着灰尘的气息。墙上的时钟指向午夜三点，指针发出微弱的滴答声。',
            audio: '悬疑背景音乐.mp3',
            nextScene: 'S2'
        },
        {
            id: 'S2',
            video: 'V1.mp4',
            sameVideoAsPrevious: true,
            text: '你走上楼梯，发现每层楼的布局完全相同——同样的走廊、同样的教室门、同样的时钟。',
            audio: null,
            nextScene: 'S3'
        },
        {
            id: 'S3',
            video: 'V2.mp4',
            text: '走廊两侧的教室门编号在不断变化，像是有某种力量在操控这一切。时钟依然指向3:00。',
            audio: '钟表滴答声.mp3',
            nextScene: 'S4'
        },
        {
            id: 'S4',
            video: 'V2.mp4',
            sameVideoAsPrevious: true,
            text: '你来到一个分叉路口。一侧是无尽的黑暗，另一侧有微弱的灯光闪烁。你必须做出选择。',
            audio: '心跳声.mp3',
            choices: [
                { text: '走向黑暗', nextScene: 'S5' },
                { text: '走向光明', nextScene: 'S10' }
            ]
        },
        {
            id: 'S5',
            video: 'V3.mp4',
            text: '你走进黑暗的走廊，来到一间教室。黑板上写着一行字："不要相信钟表。"',
            audio: null,
            nextScene: 'S6'
        },
        {
            id: 'S6',
            video: 'V3.mp4',
            sameVideoAsPrevious: true,
            text: '你注意到墙上的挂钟秒针在逆时针转动。时间仿佛在这里失去了意义。你可以开始提问了。',
            audio: '钟表滴答声.mp3',
            enableDialog: true,
            nextScene: 'S7'
        },
        {
            id: 'S7',
            video: 'V3.mp4',
            sameVideoAsPrevious: true,
            text: '时钟突然指向了6:00。一阵强烈的眩晕感袭来，周围的空间开始扭曲...',
            audio: null,
            nextScene: 'S8'
        },
        {
            id: 'S8',
            video: 'V5.mp4',
            text: '你的身体逐渐变得透明，被这片时空裂缝吞噬...',
            audio: '消散声.mp3',
            isEnding: true,
            endingType: 'bad'
        },
        {
            id: 'S9',
            video: 'V9.mp4',
            text: '你终于明白留言是谁写的了。在无尽的循环中，你成为了下一个写下警告的人。',
            audio: null,
            isEnding: true,
            endingType: 'bad'
        },
        {
            id: 'S10',
            video: 'V4.mp4',
            text: '你走向有灯光的一侧，发现了一个公告栏。旁边的时钟正在逆时针转动。',
            audio: '钟表滴答声.mp3',
            nextScene: 'S11'
        },
        {
            id: 'S11',
            video: 'V8.mp4',
            text: '公告栏上贴着一份泛黄的旧报纸："2021年，学校实验室进行时空实验，实验失控，整栋楼被卷入时间循环。"',
            audio: null,
            enableDialog: true,
            nextScene: 'S12'
        },
        {
            id: 'S12',
            video: 'V7.mp4',
            text: '你终于明白了真相。要打破循环，必须摧毁控制时间的装置——那个时钟。\n伸出手，做出挥砸的动作来摔碎它！',
            audio: null,
            enablePose: true,
            nextScene: 'S13'
        },
        {
            id: 'S13',
            video: 'V6.mp4',
            text: '你用力将墙上的时钟摘下，狠狠摔在地上。玻璃碎裂的声音响彻走廊。',
            audio: '玻璃破碎声.mp3',
            nextScene: 'S14'
        },
        {
            id: 'S14',
            video: 'V6.mp4',
            sameVideoAsPrevious: true,
            text: '时钟破碎的瞬间，时间开始正常流动。走廊的灯光逐一亮起，窗外传来了鸟鸣声。轮回终于终结了。',
            audio: '鸟鸣声.mp3',
            isEnding: true,
            endingType: 'true'
        }
    ],
    
    questions: [
        { q: '教学楼里还有别人吗？', a: '不重要。' },
        { q: '黑板留言重要吗？', a: '是。' },
        { q: '留言是主角写的吗？', a: '是。' },
        { q: '时钟显示正确时间吗？', a: '不是。' },
        { q: '教学楼是真实存在的吗？', a: '是。' },
        { q: '是否发生过事故？', a: '是。' },
        { q: '事故与实验有关吗？', a: '是。' },
        { q: '主角以前来过这里吗？', a: '是。' },
        { q: '出口真的存在吗？', a: '是。' },
        { q: '时间是循环的吗？', a: '是。' },
        { q: '黑板留言来自未来吗？', a: '是。' },
        { q: '破坏某个装置能解决问题吗？', a: '是。' }
    ],
    
    endings: {
        bad: {
            title: '消失',
            content: '你终于明白留言是谁写的了。\n\n这栋教学楼处于时空裂缝之中，午夜后进入的人会被拉入循环空间。实际上时钟已经被裂缝控制。当时间显示6:00时，你被空间彻底吞噬。\n\n你消失了，成为下一轮循环中黑板留言的留下者。在无尽的轮回中，你将永远重复这个故事...'
        },
        true: {
            title: '真相',
            content: '轮回终结，教学楼恢复原状。\n\n五年前学校实验室进行时空实验，实验失控，整栋楼被卷入时间循环。你其实也是当年事故中的学生，已经重复经历无数次循环。\n\n当你把墙上的钟摘下来摔碎的那一刻，时间终于恢复正常。\n\n太阳升起，新的一天开始了。'
        }
    }
};

const ENDINGS = {
    BAD: 'bad',
    TRUE: 'true'
};
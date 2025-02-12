// 游戏主类：实现一个向下跳跃的平台游戏
class Game {
    // 初始化游戏：设置画布、玩家属性、游戏参数等
    constructor() {
        // 获取画布和绘图上下文
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.floorElement = document.getElementById('floor');
        this.floor = 0;  // 当前层数
        this.gameStartTime = Date.now();  // 记录游戏开始时间
        this.jumpSound = new Audio();  // 跳跃音效
        this.gameOverSound = new Audio();  // 游戏结束音效
        this.platformLandSound = new Audio();  // 落地音效
        this.gameStartSound = new Audio();  // 游戏开始音效
        
        // 初始化玩家属性
        this.player = {
            x: this.canvas.width / 2,  // 玩家水平位置（居中）
            y: 50,                     // 玩家垂直位置
            width: 30,                 // 玩家宽度
            height: 30,                // 玩家高度
            speedY: 0,                 // 垂直速度
            speedX: 0,                 // 水平速度
            isMovingLeft: false,       // 是否向左移动
            isMovingRight: false,      // 是否向右移动
            isJumping: false,          // 是否在跳跃
            jumpStartTime: 0,          // 开始跳跃的时间
            emoji: '🏃‍♂️',               // 玩家显示图标
            direction: 1                // 朝向：1表示向右，-1表示向左
        };

        // 初始化游戏参数
        this.platforms = [];          // 平台数组
        this.gravity = 0.6;          // 增加重力加速度，让下落更快
        this.jumpForce = -13;        // 调整基础跳跃力度
        this.maxJumpForce = -17;     // 调整最大跳跃力度
        this.minJumpForce = -9;      // 调整最小跳跃力度
        this.maxJumpTime = 300;      // 减少最长跳跃按键时间，让控制更精确
        this.baseSpeed = 6;          // 增加基础移动速度
        this.moveSpeed = this.baseSpeed;  // 当前移动速度
        this.scrollSpeed = 2.5;      // 增加初始画面滚动速度
        this.gameOver = false;       // 游戏结束标志
        this.sawTeeth = [];         // 顶部锯齿数组
        this.lastPlatform = null;    // 记录最后生成的平台

        // 初始化顶部锯齿
        const teethCount = 10;  // 锯齿数量
        const teethWidth = this.canvas.width / teethCount;  // 每个锯齿的宽度
        for (let i = 0; i < teethCount; i++) {
            this.sawTeeth.push({
                x: i * teethWidth,
                y: 0,
                width: teethWidth,
                height: 20
            });
        }

        // 初始化游戏
        this.init();
        this.setupEventListeners();
        // 自动设置焦点到canvas元素
        this.canvas.focus();
        this.gameLoop();
    }

    // 初始化游戏场景
    init() {
        // 创建初始平台，确保玩家有落脚点
        this.platforms.push({
            x: this.canvas.width / 2 - 50,
            y: this.canvas.height - 100,  // 靠近屏幕底部
            width: 100,
            height: 20
        });

        // 生成初始平台组
        for (let i = 0; i < 5; i++) {
            this.generatePlatform();
        }
    }

    // 设置事件监听器：处理键盘和鼠标输入
    setupEventListeners() {
        // 键盘按下事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.player.isJumping) {
                this.player.jumpStartTime = Date.now();
                this.player.isJumping = true;
            }
            if (e.code === 'ArrowLeft') {
                this.player.isMovingLeft = true;
                this.player.isMovingRight = false;
                this.player.direction = -1;
            }
            if (e.code === 'ArrowRight') {
                this.player.isMovingRight = true;
                this.player.isMovingLeft = false;
                this.player.direction = 1;
            }
        });

        // 键盘释放事件
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.player.isJumping) {
                const jumpTime = Math.min(Date.now() - this.player.jumpStartTime, this.maxJumpTime);
                // 无论按多久，跳跃力度都不会超过maxJumpForce
                const jumpForce = Math.max(this.maxJumpForce, this.minJumpForce + (jumpTime / this.maxJumpTime) * (this.maxJumpForce - this.minJumpForce));
                this.player.speedY = jumpForce;
            }
            if (e.code === 'ArrowLeft') {
                this.player.isMovingLeft = false;
            }
            if (e.code === 'ArrowRight') {
                this.player.isMovingRight = false;
            }
        });


    }

    // 生成新的平台
    generatePlatform() {
        const minWidth = 80;  // 最小平台宽度
        const maxWidth = 150;  // 最大平台宽度
        const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
        
        let x;
        if (this.lastPlatform) {
            // 根据上一个平台的位置，生成新平台的位置
            const minDistance = 80;  // 增加最小水平距离
            const maxDistance = 180;  // 增加最大水平距离
            const direction = Math.random() < 0.5 ? -1 : 1;  // 随机选择左右方向
            const distance = Math.floor(Math.random() * (maxDistance - minDistance + 1)) + minDistance;
            
            x = this.lastPlatform.x + (direction * distance);
            
            // 确保平台不会超出画布边界
            if (x < 0) x = 0;
            if (x + width > this.canvas.width) x = this.canvas.width - width;
        } else {
            x = this.canvas.width / 2 - width / 2;
        }
        
        // 修改平台的垂直位置生成逻辑
        let y;
        if (this.lastPlatform) {
            // 根据上一个平台的位置，确定新平台的垂直位置
            const minVerticalDistance = 60;  // 减少最小垂直距离
            const maxVerticalDistance = 100; // 减少最大垂直距离
            const verticalDistance = Math.floor(Math.random() * (maxVerticalDistance - minVerticalDistance + 1)) + minVerticalDistance;
            y = this.lastPlatform.y + verticalDistance;
        } else {
            y = this.canvas.height + 50;
        }
        
        // 添加新平台
        const platform = {
            x,
            y,
            width,
            height: 20
        };
        
        this.platforms.push(platform);
        this.lastPlatform = platform;
    }

    // 更新游戏状态
    update() {
        if (this.gameOver) return;

        // 根据游戏时间动态调整难度
        const gameTime = (Date.now() - this.gameStartTime) / 1000; // 游戏时间（秒）
        this.moveSpeed = this.baseSpeed + (gameTime / 20); // 加快速度增长
        this.scrollSpeed = 2.5 + (gameTime / 40); // 加快滚动速度增长

        // 更新玩家垂直位置（应用重力）
        this.player.speedY += this.gravity;
        this.player.y += this.player.speedY;
        
        // 更新玩家水平位置（根据移动状态）
        if (this.player.isMovingLeft) {
            this.player.speedX = -this.moveSpeed;
        } else if (this.player.isMovingRight) {
            this.player.speedX = this.moveSpeed;
        } else {
            this.player.speedX = 0;
        }
        this.player.x += this.player.speedX;

        // 限制玩家在画面范围内
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }

        // 检查与顶部锯齿的碰撞
        for (let tooth of this.sawTeeth) {
            if (this.player.x + this.player.width > tooth.x &&
                this.player.x < tooth.x + tooth.width &&
                this.player.y < tooth.y + tooth.height) {
                this.gameOver = true;
                return;
            }
        }

        // 检查与平台的碰撞
        let onPlatform = false;
        for (let platform of this.platforms) {
            if (this.player.speedY > 0 && // 只在下落时检测碰撞
                this.player.x + this.player.width > platform.x && 
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10) {
                
                this.player.y = platform.y - this.player.height;
                this.player.speedY = 0;
                this.player.isJumping = false;
                onPlatform = true;
                this.platformLandSound.play().catch(e => {}); // 添加落地音效
                break;
            }
        }

        // 向上滚动画面
        this.player.y -= this.scrollSpeed;
        for (let platform of this.platforms) {
            platform.y -= this.scrollSpeed;
        }

        // 清理离开屏幕的平台并生成新平台
        this.platforms = this.platforms.filter(p => p.y > -50); // 修改过滤条件，让平台完全离开屏幕才删除
        while (this.platforms.length < 8) { // 增加平台数量，确保屏幕上有足够的平台
            this.generatePlatform();
            this.floor++;  // 增加层数
            this.floorElement.textContent = this.floor;
        }

        // 检查游戏结束条件（玩家触顶或掉出屏幕）
        if (this.player.y < 0 || this.player.y > this.canvas.height) {
            this.gameOver = true;
            this.gameOverSound.play().catch(e => {}); // 添加游戏结束音效
        }
    }

    // 绘制游戏画面
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制顶部锯齿
        this.ctx.fillStyle = '#FF0000';
        for (let tooth of this.sawTeeth) {
            this.ctx.beginPath();
            this.ctx.moveTo(tooth.x, tooth.y);
            this.ctx.lineTo(tooth.x + tooth.width / 2, tooth.y + tooth.height);
            this.ctx.lineTo(tooth.x + tooth.width, tooth.y);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // 绘制玩家
        this.ctx.font = '30px Arial';
        this.ctx.textBaseline = 'top';
        this.ctx.save();
        if (this.player.direction === -1) {
            this.ctx.scale(-1, 1);
            this.ctx.fillText(this.player.emoji, -this.player.x - this.player.width, this.player.y);
        } else {
            this.ctx.fillText(this.player.emoji, this.player.x, this.player.y);
        }
        this.ctx.restore();

        // 绘制平台
        this.ctx.fillStyle = '#333';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }

        // 绘制游戏结束界面
        if (this.gameOver) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`你下到了第 ${this.floor} 层`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.fillText('点击刷新重新开始', this.canvas.width / 2, this.canvas.height / 2 + 80);

            // 添加重新开始事件监听
            this.canvas.addEventListener('click', () => {
                location.reload();
            }, { once: true });
        }
    }

    // 游戏主循环
    gameLoop() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameStartSound.play().catch(e => {}); // 添加游戏开始音效
        }
        this.update();  // 更新游戏状态
        this.draw();    // 绘制画面
        requestAnimationFrame(() => this.gameLoop());  // 请求下一帧动画
    }
}

// 创建游戏实例并启动
new Game();
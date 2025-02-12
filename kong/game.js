// 获取画布和绘图上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态对象，包含所有游戏相关的状态数据
const gameState = {
    score: 0,                    // 当前得分
    isGameOver: false,           // 游戏是否结束
    speed: 6,                    // 游戏速度
    obstacles: [],               // 障碍物数组
    level: 1,                    // 当前关卡
    obstacleFrequency: 0.02,     // 障碍物生成频率
    highScore: localStorage.getItem('highScore') || 0  // 最高分，从本地存储获取
};

// 加载游戏精灵图
const sprite = new Image();
sprite.src = 'https://raw.githubusercontent.com/wayou/t-rex-runner/gh-pages/assets/default_100_percent/100-offline-sprite.png';

// 恐龙对象，包含位置、大小、动画和物理属性
const dino = {
    x: 50,                      // 恐龙的X坐标
    y: 200,                     // 恐龙的Y坐标
    width: 44,                  // 恐龙的宽度
    height: 47,                 // 恐龙的高度
    jumping: false,             // 是否在跳跃中
    jumpSpeed: 0,              // 跳跃速度
    gravity: 0.6,              // 重力值
    frame: 0,                  // 当前动画帧
    frameCount: 0              // 动画帧计数器
};

/**
 * 绘制恐龙函数
 * 根据恐龙的状态（跳跃/奔跑）选择对应的精灵图位置进行绘制
 * 并处理奔跑动画的帧更新
 */
function drawDino() {
    // 根据恐龙状态选择精灵图位置（跳跃或奔跑动画）
    const spriteX = dino.jumping ? 848 : (1338 + dino.frame * 44);
    ctx.drawImage(sprite, spriteX, 0, 44, 47, dino.x, dino.y, 44, 47);
    
    // 更新奔跑动画帧
    if (!dino.jumping && !gameState.isGameOver) {
        dino.frameCount++;
        if (dino.frameCount > 6) {  // 每6帧切换一次动画
            dino.frame = (dino.frame + 1) % 2;  // 在两个动画帧之间切换
            dino.frameCount = 0;
        }
    }
}

/**
 * 障碍物类
 * 定义了障碍物的属性和行为
 */
class Obstacle {
    constructor(type = 'cactus') {
        this.type = type;
        if (type === 'cactus') {
            this.width = 25;
            this.height = 50;
            this.y = 197;
            // 随机选择仙人掌类型
            const cactusTypes = [
                {x: 228, w: 17},
                {x: 245, w: 34},
                {x: 279, w: 51}
            ];
            const selected = cactusTypes[Math.floor(Math.random() * cactusTypes.length)];
            this.spriteX = selected.x;
            this.width = selected.w;
        } else { // 翼龙
            this.width = 46;
            this.height = 40;
            this.y = Math.random() < 0.5 ? 197 : 150; // 随机高度
            this.frame = 0;
            this.frameCount = 0;
        }
        this.x = canvas.width;
    }

    // 绘制障碍物
    draw() {
        if (this.type === 'cactus') {
            ctx.drawImage(sprite, this.spriteX, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        } else {
            // 翼龙动画，在两个翅膀位置之间切换
            const spriteX = 134 + (this.frame * 46);
            ctx.drawImage(sprite, spriteX, 0, 46, 40, this.x, this.y, 46, 40);
            
            // 更新翼龙动画
            if (!gameState.isGameOver) {
                this.frameCount++;
                if (this.frameCount > 10) {
                    this.frame = (this.frame + 1) % 2;
                    this.frameCount = 0;
                }
            }
        }
    }

    // 更新障碍物位置
    update() {
        this.x -= gameState.speed;  // 根据游戏速度向左移动
    }
}

/**
 * 更新游戏难度
 * 根据得分调整游戏速度和障碍物生成频率
 */
function updateDifficulty() {
    const newLevel = Math.floor(gameState.score / 100) + 1;  // 每100分升一级
    if (newLevel !== gameState.level) {
        gameState.level = newLevel;
        // 随等级提高障碍物生成频率，最高0.05
        gameState.obstacleFrequency = Math.min(0.02 + (newLevel - 1) * 0.005, 0.05);
        // 随等级提高游戏速度，最高12
        gameState.speed = Math.min(6 + (newLevel - 1) * 0.5, 12);
    }
}

/**
 * 生成障碍物
 * 根据频率随机生成新的障碍物
 */
function generateObstacle() {
    if (Math.random() < gameState.obstacleFrequency && !gameState.isGameOver) {
        // 根据等级决定是否生成翼龙，等级越高翼龙出现概率越大
        const type = Math.random() < (gameState.level - 1) * 0.1 ? 'pterodactyl' : 'cactus';
        gameState.obstacles.push(new Obstacle(type));
    }
}

/**
 * 绘制得分信息
 * 显示当前得分、最高分和关卡等级
 */
function drawScore() {
    ctx.fillStyle = '#535353';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(gameState.score)}`, 600, 30);
    ctx.fillText(`High Score: ${Math.floor(gameState.highScore)}`, 600, 60);
    ctx.fillText(`Level: ${gameState.level}`, 600, 90);
}

// 检测碰撞
function checkCollision(dino, obstacle) {
    return dino.x < obstacle.x + obstacle.width &&
           dino.x + dino.width > obstacle.x &&
           dino.y < obstacle.y + obstacle.height &&
           dino.y + dino.height > obstacle.y;
}

// 游戏主循环
function gameLoop() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameState.isGameOver) {
        // 更新恐龙位置
        if (dino.jumping) {
            dino.jumpSpeed += dino.gravity;
            dino.y += dino.jumpSpeed;
            if (dino.y >= 200) {  // 着陆检测
                dino.y = 200;
                dino.jumping = false;
                dino.jumpSpeed = 0;
            }
        }
        
        // 生成和更新障碍物
        generateObstacle();
        gameState.obstacles = gameState.obstacles.filter(obstacle => {
            obstacle.update();
            if (checkCollision(dino, obstacle)) {
                gameOver();
                return false;
            }
            return obstacle.x > -obstacle.width;
        });
        
        // 更新得分和难度
        gameState.score += 0.1;
        updateDifficulty();
    }
    
    // 绘制游戏元素（无论游戏是否结束都绘制）
    gameState.obstacles.forEach(obstacle => obstacle.draw());
    drawDino();
    drawScore();
    
    requestAnimationFrame(gameLoop);
}

// 重置游戏
function resetGame() {
    gameState.score = 0;
    gameState.isGameOver = false;
    gameState.speed = 6;
    gameState.obstacles = [];
    gameState.level = 1;
    gameState.obstacleFrequency = 0.02;
    dino.y = 200;
    dino.jumping = false;
    dino.jumpSpeed = 0;
    dino.frame = 0;
    dino.frameCount = 0;
}

// 事件监听器
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        if (gameState.isGameOver) {
            resetGame();
        } else if (!dino.jumping) {
            dino.jumping = true;
            dino.jumpSpeed = -12;
        }
    }
});

// 开始游戏
sprite.onload = () => {
    gameLoop();
};

/**
 * 游戏结束处理
 * 更新最高分并显示游戏结束界面
 */
function gameOver() {
    gameState.isGameOver = true;
    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }
    // 显示游戏结束界面
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('游戏结束', canvas.width / 2 - 60, canvas.height / 2 - 30);
    ctx.fillText(`得分: ${Math.floor(gameState.score)}`, canvas.width / 2 - 60, canvas.height / 2 + 10);
    ctx.font = '20px Arial';
    ctx.fillText('按空格键重新开始', canvas.width / 2 - 80, canvas.height / 2 + 50);
}
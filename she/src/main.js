import './style.css'
import { soundManager } from './sounds.js'
import foodIcons from './foodIcons.js'
import obstacleIcons from './obstacleIcons.js'
import { render } from './renderer.js'
import { adjustCanvasSize, createGameLayout, createModeSelection, createContinueGameModal, createGameOverPanel, updateScoreBoard } from './layout.js'

// 游戏配置对象，包含所有游戏相关的参数设置
const GAME_CONFIG = {
  // 检测是否为移动设备，用于适配移动端控制
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // 画布尺寸设置
  canvasWidth: 600,
  canvasHeight: 400,
  
  // 游戏网格大小，决定蛇身、食物和障碍物的大小
  gridSize: 20,
  
  // 蛇的初始长度 
  initialSnakeLength: 3,
  
  // 游戏速度相关设置
  initialGameSpeed: 200,  // 初始移动间隔(毫秒)，数值越小移动越快
  speedIncreaseInterval: 200, // 每得多少分增加一次速度
  speedIncreaseAmount: 2,     // 每次提速减少的毫秒数
  minGameSpeed: 120,         // 最快速度限制，防止游戏难度过高
  
  // 游戏模式设置
  wallPassEnabled: false,     // 是否启用穿墙模式
  gameMode: 'default',       // 游戏模式：'default'(默认模式) 或 'levels'(闯关模式)
  totalLevels: 50,          // 闯关模式的总关卡数
  currentLevel: 1,          // 当前关卡编号
  
  // 移动端长按加速配置
  touchSpeedBoost: {
    enabled: true,           // 是否启用长按加速
    boostSpeed: 100,        // 加速时的移动间隔(毫秒)
    minTouchDuration: 200   // 触发加速的最小按住时间（毫秒）
  },
  
  // 闯关模式配置
  levelConfig: {
    obstacleIncrease: 1,    // 每关增加的障碍物数量
    baseObstacles: 3,       // 第一关的基础障碍物数量
    maxObstacles: 15,       // 最大障碍物数量上限
    speedDecrease: 2,       // 每关减少的速度值(ms)，增加难度
    targetScore: 100,       // 每关通关所需基础分数
    scoreIncrease: 50       // 每关增加的目标分数
  },
  
  // 蛇身颜色配置，包含颜色和发光效果 - 卡通可爱风格
  snakeColors: [
    { color: '#FF69B4', glow: '#FFB6C1' },  // 粉色主体
    { color: '#FF1493', glow: '#FF69B4' },  // 深粉过渡
    { color: '#FFB6C1', glow: '#FFC0CB' }   // 浅粉尾部
  ],
  
  // 食物类型配置
  foodTypes: [
    { type: 'normal', color: '#FF5252', glow: '#FF867F', points: 10, probability: 0.5 },  // 普通食物
    { type: 'speed', color: '#2196F3', glow: '#64B5F6', points: 20, probability: 0.15 },    // 加速食物
    { type: 'bonus', color: '#FFC107', glow: '#FFD54F', points: 30, probability: 0.15 },    // 奖励食物
    { type: 'slow', color: '#9C27B0', glow: '#BA68C8', points: 15, probability: 0.1, speedModifier: 1.5 },  // 减速食物
    { type: 'double', color: '#E91E63', glow: '#F06292', points: 25, probability: 0.1 }     // 双倍分数食物
  ],
  
  // 加速模式配置
  boostSpeed: 50,           // 加速时的移动间隔（毫秒）
  normalSpeed: null         // 用于临时存储正常速度
}
 
// 游戏状态变量
// 存储蛇身体的数组，每个元素是一个包含 x, y 坐标的对象，数组第一个元素是蛇头
let snake = []
// 当前食物的对象，包含位置坐标和类型信息，null 表示当前没有食物
let food = null
// 存储障碍物的数组，每个元素是一个包含 x, y 坐标的对象，在闯关模式中使用
let obstacles = []
// 蛇当前的移动方向，可能的值：'up', 'down', 'left', 'right'
let direction = 'right'
// 蛇的下一个移动方向，初始值与当前方向相同
let nextDirection = direction
// 游戏主循环的计时器 ID，用于控制游戏的暂停和继续
let gameLoop = null
// 当前游戏得分
let score = 0
// 历史最高分，从 localStorage 中读取，如果没有则默认为 0
let highScore = localStorage.getItem('highScore') || 0
// 当前游戏速度（毫秒），值越小移动越快，初始值从游戏配置中获取
let currentGameSpeed = GAME_CONFIG.initialGameSpeed

// 显示模式选择界面
function showModeSelection() {
  const modeContainer = createModeSelection()
  
  // 添加模式选择事件监听
  modeContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('mode-btn')) {
      GAME_CONFIG.gameMode = e.target.dataset.mode
      
      if (e.target.dataset.mode === 'levels') {
        // 获取上次保存的关卡进度
        const savedLevel = parseInt(localStorage.getItem('lastLevel')) || 1
        
        // 如果有存档且不是第一关，显示选择弹窗
        if (savedLevel > 1) {
          // 创建选择弹窗
          const modal = createContinueGameModal(savedLevel)
          
          // 添加弹窗点击事件
          modal.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-btn')) {
              if (event.target.dataset.action === 'new') {
                GAME_CONFIG.currentLevel = 1
              } else if (event.target.dataset.action === 'continue') {
                GAME_CONFIG.currentLevel = savedLevel
              }
              // 保存当前关卡
              localStorage.setItem('lastLevel', GAME_CONFIG.currentLevel)
              // 设置穿墙功能并开始游戏
              GAME_CONFIG.wallPassEnabled = true
              modal.remove()
              initGame()
            }
          })
          
          document.body.appendChild(modal)
        } else {
          // 没有存档或是第一关，直接开始新游戏
          GAME_CONFIG.currentLevel = 1
          localStorage.setItem('lastLevel', GAME_CONFIG.currentLevel)
          GAME_CONFIG.wallPassEnabled = true
          initGame()
        }
      } else {
        // 默认模式直接开始
        GAME_CONFIG.currentLevel = 1
        GAME_CONFIG.wallPassEnabled = false
        initGame()
      }
    }
  })

  app.appendChild(modeContainer)
}



// 监听屏幕旋转事件
window.addEventListener('resize', () => {
  if (GAME_CONFIG.isMobile) {
    adjustCanvasSize()
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.width = GAME_CONFIG.canvasWidth
      canvas.height = GAME_CONFIG.canvasHeight
    }
  }
})

// 初始化游戏
function initGame() {
  // 初始化时调整画布大小
  adjustCanvasSize(GAME_CONFIG)
  
  // 创建游戏布局
  const { canvas, ctx } = createGameLayout(GAME_CONFIG)

  // 初始化蛇的位置和长度
  snake = []
  // 计算蛇的初始位置，将蛇头放在画布中央
  const startX = Math.floor(GAME_CONFIG.canvasWidth / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
  const startY = Math.floor(GAME_CONFIG.canvasHeight / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
  // 初始化蛇身，从右向左生成指定长度的蛇身
  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    snake.push({
      x: startX - (i * GAME_CONFIG.gridSize),
      y: startY
    })
  }

  // 重置游戏状态
  score = 0
  updateScore()
  currentGameSpeed = GAME_CONFIG.initialGameSpeed
  obstacles = generateObstacles()
  generateFood()
  direction = 'right'
  nextDirection = 'right'

  // 启动游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, currentGameSpeed)

  // 根据设备类型添加控制
  if (GAME_CONFIG.isMobile) {
    initTouchControls(gameLoop, currentGameSpeed, GAME_CONFIG, gameStep)
  } else {
    // 添加按键冷却时间变量
    let lastKeyPressTime = 0;

    const KEY_COOLDOWN = 50; // 设置50毫秒的按键冷却时间

    document.addEventListener('keydown', (event) => {
      const currentTime = Date.now();
      // 检查是否超过冷却时间
      if (currentTime - lastKeyPressTime < KEY_COOLDOWN) {
        return;
      }
      lastKeyPressTime = currentTime;
      const newDirection = handleKeyPress(event, direction);
      if (newDirection) {
        nextDirection = newDirection;
      }
    })
  }
}

// 更新分数显示
function updateScore() {
  updateScoreBoard(score, highScore, GAME_CONFIG)
}

// 生成障碍物
function generateObstacles() {
  // 默认模式下不生成障碍物
  if (GAME_CONFIG.gameMode === 'default') {
    return [];
  }

  // 闯关模式下，根据当前关卡计算障碍物数量
  const obstacleCount = Math.min(
    GAME_CONFIG.levelConfig.baseObstacles + 
    (GAME_CONFIG.currentLevel - 1) * GAME_CONFIG.levelConfig.obstacleIncrease,
    GAME_CONFIG.levelConfig.maxObstacles
  );
  const newObstacles = [];
  
  // 定义蛇头周围的安全区域（以格子为单位）
  const safeZoneSize = 5; // 增加安全区域大小
  const snakeHead = snake[0];
  
  // 循环生成指定数量的障碍物
  for (let i = 0; i < obstacleCount; i++) {
    let obstacle;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环
    
    do {
      // 随机生成障碍物位置
      obstacle = {
        x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
        y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
      };
      
      attempts++;
      if (attempts >= maxAttempts) {
        // 如果尝试次数过多，说明可能没有合适的位置，减少障碍物数量
        return newObstacles;
      }
    } while (
      // 确保障碍物不会生成在蛇身上或其他障碍物上
      snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
      newObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y) ||
      // 使用更严格的安全区域判定，确保蛇头周围有足够的活动空间
      (Math.abs(obstacle.x - snakeHead.x) <= GAME_CONFIG.gridSize * safeZoneSize &&
       Math.abs(obstacle.y - snakeHead.y) <= GAME_CONFIG.gridSize * safeZoneSize) ||
      // 额外检查对角线方向的安全距离
      (Math.sqrt(Math.pow(obstacle.x - snakeHead.x, 2) + Math.pow(obstacle.y - snakeHead.y, 2)) <= 
       GAME_CONFIG.gridSize * (safeZoneSize - 1))
    );
    
    newObstacles.push(obstacle);
  }
  return newObstacles;
}

// 生成食物
function generateFood() {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  
  // 随机选择食物类型，根据概率权重分配
  const random = Math.random()
  let selectedType = GAME_CONFIG.foodTypes[0] // 默认普通食物
  let probability = 0
  
  // 根据每种食物的概率权重选择食物类型
  for (const foodType of GAME_CONFIG.foodTypes) {
    probability += foodType.probability
    if (random <= probability) {
      selectedType = foodType
      break
    }
  }
  
  // 随机生成食物位置，确保在画布范围内
  const maxGridX = Math.floor(GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)
  const maxGridY = Math.floor(GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)
  food = {
    x: (Math.floor(Math.random() * maxGridX)) * GAME_CONFIG.gridSize,
    y: (Math.floor(Math.random() * maxGridY)) * GAME_CONFIG.gridSize,
    type: selectedType.type,
    color: selectedType.color,
    glow: selectedType.glow,
    points: selectedType.points
  }

  // 确保食物不会生成在蛇身上或障碍物上
  while (
    snake.some(segment => segment.x === food.x && segment.y === food.y) ||
    obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y)
  ) {
    food.x = Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
    food.y = Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
  }
}

// 处理键盘输入
// 初始化触摸控制
function initTouchControls() {
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let isLongPress = false
  let longPressTimer = null
  const minSwipeDistance = 30

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
    isLongPress = false

    // 清除之前的长按计时器
    if (longPressTimer) clearTimeout(longPressTimer)

    // 设置新的长按计时器
    longPressTimer = setTimeout(() => {
      if (touchStartTime) {
        isLongPress = true
        if (GAME_CONFIG.touchSpeedBoost.enabled) {
          GAME_CONFIG.normalSpeed = currentGameSpeed
          currentGameSpeed = GAME_CONFIG.touchSpeedBoost.boostSpeed
          clearInterval(gameLoop)
          gameLoop = setInterval(gameStep, currentGameSpeed)
        }
      }
    }, GAME_CONFIG.touchSpeedBoost.minTouchDuration)
  })

  document.addEventListener('touchmove', (e) => {
    e.preventDefault()
    // 如果是长按状态，取消滑动方向改变
    if (isLongPress) return
  }, { passive: false })

  document.addEventListener('touchend', (e) => {
    // 清除长按计时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const touchDuration = Date.now() - touchStartTime

    // 恢复正常速度
    if (GAME_CONFIG.touchSpeedBoost.enabled && GAME_CONFIG.normalSpeed) {
      currentGameSpeed = GAME_CONFIG.normalSpeed
      GAME_CONFIG.normalSpeed = null
      clearInterval(gameLoop)
      gameLoop = setInterval(gameStep, currentGameSpeed)
    }

    touchStartTime = 0
    isLongPress = false

    // 只在非长按状态下处理滑动
    if (!isLongPress && (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance)) {
      let newDirection;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        newDirection = deltaY > 0 ? 'down' : 'up';
      }
      nextDirection = changeDirection(newDirection, direction)
    }
  })
}

// 创建虚拟方向按钮（用于移动端）
function createVirtualControls() {
  const controls = document.createElement('div')
  controls.className = 'virtual-controls'
  controls.innerHTML = `
    <button class="control-btn up-btn" data-direction="up">↑</button>
    <div class="horizontal-controls">
      <button class="control-btn left-btn" data-direction="left">←</button>
      <button class="control-btn right-btn" data-direction="right">→</button>
    </div>
    <button class="control-btn down-btn" data-direction="down">↓</button>
  `

  // 添加触摸事件监听
  controls.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('control-btn')) {
      e.preventDefault()
      nextDirection = changeDirection(e.target.dataset.direction, direction)
    }
  })

  document.querySelector('#app').appendChild(controls)
}

// 导入方向控制函数
import { changeDirection } from './controller.js'

// 导入键盘控制函数
import { handleKeyPress } from './controller.js'

function gameStep() {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  // 在移动前更新实际方向
  direction = nextDirection;

  // 根据当前方向移动蛇头
  const head = { x: snake[0].x, y: snake[0].y }
  switch (direction) {
    case 'up': head.y -= GAME_CONFIG.gridSize; break
    case 'down': head.y += GAME_CONFIG.gridSize; break
    case 'left': head.x -= GAME_CONFIG.gridSize; break
    case 'right': head.x += GAME_CONFIG.gridSize; break
  }

  // 处理边界碰撞
  if (GAME_CONFIG.wallPassEnabled) {
    // 穿墙模式：从一边穿过到另一边
    if (head.x < 0) head.x = GAME_CONFIG.canvasWidth - GAME_CONFIG.gridSize;
    if (head.x >= GAME_CONFIG.canvasWidth) head.x = 0;
    if (head.y < 0) head.y = GAME_CONFIG.canvasHeight - GAME_CONFIG.gridSize;
    if (head.y >= GAME_CONFIG.canvasHeight) head.y = 0;
  } else if (
    // 非穿墙模式：碰到边界游戏结束
    head.x < 0 ||
    head.x >= GAME_CONFIG.canvasWidth ||
    head.y < 0 ||
    head.y >= GAME_CONFIG.canvasHeight
  ) {
    gameOver();
    return;
  }

  // 检查是否会撞到自己
  const willCollideWithSelf = snake.slice(1).some(segment => {
    return head.x === segment.x && head.y === segment.y;
  });

  // 检查是否会撞到障碍物
  const willCollideWithObstacle = obstacles.some(obstacle => {
    return head.x === obstacle.x && head.y === obstacle.y;
  });

  if (willCollideWithSelf || willCollideWithObstacle) {
    gameOver();
    return;
  }

  // 添加新头部
  snake.unshift(head)

  // 检查是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    // 播放吃食物音效
    soundManager.playSound(food.type === 'bonus' ? 'bonus' : 'eat')
    
    // 根据食物类型增加分数和特殊效果
    if (food.type === 'double') {
      score += food.points * 2  // 双倍积分
    } else if (food.type === 'speed') {
      score += food.points
      // 使用平滑的速度增长算法
      const speedIncrease = Math.floor(score / GAME_CONFIG.speedIncreaseInterval) * GAME_CONFIG.speedIncreaseAmount
      const newSpeed = Math.max(GAME_CONFIG.minGameSpeed, GAME_CONFIG.initialGameSpeed - speedIncrease)
      if (newSpeed !== currentGameSpeed) {
        currentGameSpeed = newSpeed
        clearInterval(gameLoop)
        gameLoop = setInterval(gameStep, currentGameSpeed)
      }
    } else if (food.type === 'slow') {
      score += food.points
      // 限制减速效果，确保游戏节奏不会过慢
      const maxSlowSpeed = GAME_CONFIG.initialGameSpeed * 1.2
      const newSpeed = Math.min(maxSlowSpeed, currentGameSpeed + GAME_CONFIG.speedIncreaseAmount)
      if (newSpeed !== currentGameSpeed) {
        currentGameSpeed = newSpeed
        clearInterval(gameLoop)
        gameLoop = setInterval(gameStep, currentGameSpeed)
      }
    } else {
      score += food.points
    }
    
    // 更新最高分
    if (score > highScore) {
      highScore = score
      localStorage.setItem('highScore', highScore)
    }
    
    // 检查是否达到关卡目标
    if (GAME_CONFIG.gameMode === 'levels') {
      const targetScore = GAME_CONFIG.levelConfig.targetScore + 
        (GAME_CONFIG.currentLevel - 1) * GAME_CONFIG.levelConfig.scoreIncrease
      if (score >= targetScore) {
        if (GAME_CONFIG.currentLevel >= GAME_CONFIG.totalLevels) {
          // 通关全部关卡
          gameOver(true)
          return
        } else {
          // 进入下一关
          GAME_CONFIG.currentLevel++
          initGame()
          return
        }
      }
    }

    // 生成新的食物
    generateFood()
  } else {
    // 如果没有吃到食物，移除蛇尾
    snake.pop()
  }

  // 确保画布上下文状态正确
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // 使用渲染器模块进行渲染
  render(ctx, snake, food, obstacles, GAME_CONFIG, foodIcons, obstacleIcons)
}

// 游戏结束
function gameOver(isComplete = false) {
  clearInterval(gameLoop)
  soundManager.playSound(isComplete ? 'bonus' : 'crash')
  
  // 获取上次保存的关卡
  const savedLevel = parseInt(localStorage.getItem('lastLevel')) || 1
  
  // 在游戏结束时保存当前关卡进度
  if (GAME_CONFIG.gameMode === 'levels' && !isComplete) {
    localStorage.setItem('lastLevel', GAME_CONFIG.currentLevel)
  }
  
  // 创建游戏结束面板
  const gameOverPanel = createGameOverPanel(score, highScore, GAME_CONFIG, isComplete)
  
  document.querySelector('#app').appendChild(gameOverPanel)

  if (GAME_CONFIG.isMobile) {
    // 移动端添加触摸事件
    const restartBtn = gameOverPanel.querySelector('.restart-btn')
    const menuBtn = gameOverPanel.querySelector('.menu-btn')

    restartBtn.addEventListener('click', () => {
      gameOverPanel.remove()
      // 在闯关模式下保持当前关卡，默认模式则重置到第一关
      if (GAME_CONFIG.gameMode !== 'levels') {
        GAME_CONFIG.currentLevel = 1
      }
      direction = 'right'
      nextDirection = 'right'
      initGame()
    })

    menuBtn.addEventListener('click', () => {
      gameOverPanel.remove()
      showModeSelection()
    })
  } else {
    // PC端保持键盘控制
    const restartHandler = (event) => {
      if (event.code === 'Space') {
        document.removeEventListener('keydown', restartHandler)
        const gameOverPanel = document.querySelector('.game-over')
        if (gameOverPanel) gameOverPanel.remove()
        // 在闯关模式下保持当前关卡，默认模式则重置到第一关
        if (GAME_CONFIG.gameMode !== 'levels') {
          GAME_CONFIG.currentLevel = 1
        }
        direction = 'right'
        nextDirection = 'right'
        initGame()
      } else if (event.code === 'Escape') {
        document.removeEventListener('keydown', restartHandler)
        const gameOverPanel = document.querySelector('.game-over')
        if (gameOverPanel) gameOverPanel.remove()
        showModeSelection()
      }
    }
    document.addEventListener('keydown', restartHandler)
  }
}

// 启动游戏
showModeSelection()

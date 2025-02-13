import './style.css'
import { soundManager } from './sounds.js'
import foodIcons from './foodIcons.js'
import obstacleIcons from './obstacleIcons.js'
import { render } from './renderer.js'

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
  const app = document.querySelector('#app')
  app.innerHTML = ''

  // 创建游戏标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = '贪吃蛇'
  app.appendChild(title)

  // 创建模式选择容器
  const modeContainer = document.createElement('div')
  modeContainer.className = 'mode-selection'
  modeContainer.innerHTML = `
    <button class="mode-btn" data-mode="default">默认模式</button>
    <button class="mode-btn" data-mode="levels">闯关模式</button>
  `

  // 添加模式选择事件监听
  modeContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('mode-btn')) {
      GAME_CONFIG.gameMode = e.target.dataset.mode
      GAME_CONFIG.currentLevel = 1
      // 根据游戏模式设置穿墙功能
      GAME_CONFIG.wallPassEnabled = e.target.dataset.mode === 'levels'
      initGame()
    }
  })

  app.appendChild(modeContainer)
}

// 根据屏幕方向和尺寸调整画布大小
function adjustCanvasSize() {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const isPortrait = screenHeight > screenWidth
  const padding = 20
  
  if (GAME_CONFIG.isMobile) {
    // 根据屏幕方向调整画布尺寸
    if (isPortrait) {
      GAME_CONFIG.canvasWidth = Math.min(screenWidth - padding * 2, 400)
      GAME_CONFIG.canvasHeight = Math.min(screenHeight * 0.6, 600)
    } else {
      GAME_CONFIG.canvasWidth = Math.min(screenWidth * 0.7, 600)
      GAME_CONFIG.canvasHeight = Math.min(screenHeight - padding * 2, 400)
    }
    // 确保网格大小适配屏幕
    GAME_CONFIG.gridSize = Math.max(Math.floor(GAME_CONFIG.canvasWidth / 30), 15)
  }
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
  adjustCanvasSize()
  
  // 创建游戏标题，根据模式显示不同标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = GAME_CONFIG.gameMode === 'levels' ? `贪吃蛇 - 第${GAME_CONFIG.currentLevel}关` : '贪吃蛇'
  
  // 创建游戏画布
  const canvas = document.createElement('canvas')
  canvas.width = GAME_CONFIG.canvasWidth
  canvas.height = GAME_CONFIG.canvasHeight
  
  // 获取2D上下文并设置基本属性
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // 创建计分板
  const scoreBoard = document.createElement('div')
  scoreBoard.className = 'score-board'
  
  // 清空并添加游戏元素
  document.querySelector('#app').innerHTML = ''
  document.querySelector('#app').appendChild(title)
  document.querySelector('#app').appendChild(canvas)
  document.querySelector('#app').appendChild(scoreBoard)

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

  // 启动游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, currentGameSpeed)

  // 根据设备类型添加控制
  if (GAME_CONFIG.isMobile) {
    initTouchControls(gameLoop, currentGameSpeed, GAME_CONFIG, gameStep)
  } else {
    document.addEventListener('keydown', (event) => handleKeyPress(event, direction))
  }
}

// 更新分数显示
function updateScore() {
  const scoreBoard = document.querySelector('.score-board')
  let content = `
    分数: ${score}<br>
    最高分: ${highScore}
  `
  
  if (GAME_CONFIG.gameMode === 'levels') {
    const targetScore = GAME_CONFIG.levelConfig.targetScore + 
      (GAME_CONFIG.currentLevel - 1) * GAME_CONFIG.levelConfig.scoreIncrease
    content = `
      第${GAME_CONFIG.currentLevel}关<br>
      分数: ${score}<br>
      目标: ${targetScore}<br>
      最高分: ${highScore}
    `
  }
  
  scoreBoard.innerHTML = content
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
  
  // 循环生成指定数量的障碍物
  for (let i = 0; i < obstacleCount; i++) {
    let obstacle;
    do {
      // 随机生成障碍物位置
      obstacle = {
        x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
        y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
      };
    } while (
      // 确保障碍物不会生成在蛇身上或其他障碍物上
      snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
      newObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y)
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
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        changeDirection(deltaX > 0 ? 'right' : 'left')
      } else {
        changeDirection(deltaY > 0 ? 'down' : 'up')
      }
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
      changeDirection(e.target.dataset.direction)
    }
  })

  document.querySelector('#app').appendChild(controls)
}

// 改变蛇的移动方向的通用函数
function changeDirection(newDirection) {
  // 防止蛇反向移动（例如向右移动时不能直接向左转向）
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' }
  if (opposites[newDirection] !== direction) {
    direction = newDirection
  }
}

// 处理键盘按键事件
function handleKeyPress(event) {
  // 键盘按键映射到移动方向
  const newDirection = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'w': 'up',
    's': 'down',
    'a': 'left',
    'd': 'right'
  }[event.key]

  // 如果是有效的方向键，则改变方向
  if (newDirection) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' }
    if (opposites[newDirection] !== direction) {
      direction = newDirection
    }
  }
}

// 游戏步骤，处理蛇的移动、碰撞检测和食物收集
function gameStep() {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

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
  
  // 检查是否撞到自己或障碍物
  if (
    snake.some(segment => {
      // 计算蛇身每个段与蛇头的中心点距离
      const segmentCenterX = segment.x + GAME_CONFIG.gridSize / 2;
      const segmentCenterY = segment.y + GAME_CONFIG.gridSize / 2;
      const headCenterX = head.x + GAME_CONFIG.gridSize / 2;
      const headCenterY = head.y + GAME_CONFIG.gridSize / 2;
      return Math.abs(segmentCenterX - headCenterX) < GAME_CONFIG.gridSize / 2 &&
             Math.abs(segmentCenterY - headCenterY) < GAME_CONFIG.gridSize / 2;
    }) ||
    obstacles.some(obstacle => {
      // 计算障碍物与蛇头的中心点距离
      const obstacleCenterX = obstacle.x + GAME_CONFIG.gridSize / 2;
      const obstacleCenterY = obstacle.y + GAME_CONFIG.gridSize / 2;
      const headCenterX = head.x + GAME_CONFIG.gridSize / 2;
      const headCenterY = head.y + GAME_CONFIG.gridSize / 2;
      return Math.abs(obstacleCenterX - headCenterX) < GAME_CONFIG.gridSize / 2 &&
             Math.abs(obstacleCenterY - headCenterY) < GAME_CONFIG.gridSize / 2;
    })
  ) {
    gameOver();
    return;
  }

  // 添加新头部
  snake.unshift(head)

  // 检查是否吃到食物，使用更精确的碰撞检测
  const collisionTolerance = GAME_CONFIG.gridSize / 3



  // 在gameStep函数中，吃到食物时添加得分动画
  if (
    Math.abs((head.x + GAME_CONFIG.gridSize/2) - (food.x + GAME_CONFIG.gridSize/2)) < collisionTolerance &&
    Math.abs((head.y + GAME_CONFIG.gridSize/2) - (food.y + GAME_CONFIG.gridSize/2)) < collisionTolerance
  ) {


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

  // 更新分数显示
  updateScore()

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
  
  // 创建游戏结束面板
  const gameOverPanel = document.createElement('div')
  gameOverPanel.className = 'game-over'
  
  let controlsHtml = GAME_CONFIG.isMobile ?
    '<div class="game-over-controls"><button class="restart-btn">重新开始</button><button class="menu-btn">返回菜单</button></div>' :
    '<p>按空格键重新开始</p><p>按ESC键返回模式选择</p>'

  if (GAME_CONFIG.gameMode === 'levels') {
    if (isComplete) {
      gameOverPanel.innerHTML = `
        <h2>恭喜通关全部关卡！</h2>
        <p>最终得分: ${score}</p>
        <p>最高分: ${highScore}</p>
        ${controlsHtml}
      `
    } else {
      gameOverPanel.innerHTML = `
        <h2>第${GAME_CONFIG.currentLevel}关失败!</h2>
        <p>本关得分: ${score}</p>
        <p>最高分: ${highScore}</p>
        ${controlsHtml}
      `
    }
  } else {
    gameOverPanel.innerHTML = `
      <h2>游戏结束!</h2>
      <p>最终得分: ${score}</p>
      <p>最高分: ${highScore}</p>
      ${controlsHtml}
    `
  }
  
  document.querySelector('#app').appendChild(gameOverPanel)

  if (GAME_CONFIG.isMobile) {
    // 移动端添加触摸事件
    const restartBtn = gameOverPanel.querySelector('.restart-btn')
    const menuBtn = gameOverPanel.querySelector('.menu-btn')

    restartBtn.addEventListener('click', () => {
      gameOverPanel.remove()
      direction = 'right'
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
        direction = 'right'
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

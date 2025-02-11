import './style.css'
import { soundManager } from './sounds.js'

// 游戏配置
const GAME_CONFIG = {
  canvasWidth: 600,
  canvasHeight: 400,
  gridSize: 20,
  initialSnakeLength: 3,
  initialGameSpeed: 200,  // 初始游戏速度(毫秒)，数值越小移动越快
  speedIncreaseInterval: 100, // 每得多少分增加一次速度
  speedIncreaseAmount: 5,     // 每次提速减少的毫秒数
  minGameSpeed: 80,          // 最快速度限制
  wallPassEnabled: false,     // 默认模式下禁用穿墙
  gameMode: 'default',       // 游戏模式：'default' 或 'levels'
  totalLevels: 50,          // 闯关模式的总关卡数
  currentLevel: 1,          // 当前关卡
  levelConfig: {            // 关卡配置
    obstacleIncrease: 1,    // 每关增加的障碍物数量
    baseObstacles: 3,       // 基础障碍物数量
    maxObstacles: 15,       // 最大障碍物数量
    speedDecrease: 2,       // 每关减少的速度值(ms)
    targetScore: 100,       // 每关通关所需基础分数
    scoreIncrease: 50       // 每关增加的目标分数
  },
  snakeColors: [
    { color: '#4CAF50', glow: '#69F0AE' },
    { color: '#8BC34A', glow: '#B2FF59' },
    { color: '#CDDC39', glow: '#EEFF41' }
  ],
  foodTypes: [
    { type: 'normal', color: '#FF5252', glow: '#FF867F', points: 10, probability: 0.5 },
    { type: 'speed', color: '#2196F3', glow: '#64B5F6', points: 20, probability: 0.15 },
    { type: 'bonus', color: '#FFC107', glow: '#FFD54F', points: 30, probability: 0.15 },
    { type: 'slow', color: '#9C27B0', glow: '#BA68C8', points: 15, probability: 0.1, speedModifier: 1.5 },
    { type: 'double', color: '#E91E63', glow: '#F06292', points: 25, probability: 0.1 }
  ]
}

// 游戏状态
let snake = []
let food = null
let obstacles = []
let direction = 'right'
let gameLoop = null
let score = 0
let highScore = localStorage.getItem('highScore') || 0
let currentGameSpeed = GAME_CONFIG.initialGameSpeed

// 显示模式选择界面
function showModeSelection() {
  const app = document.querySelector('#app')
  app.innerHTML = ''

  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = '贪吃蛇'
  app.appendChild(title)

  const modeContainer = document.createElement('div')
  modeContainer.className = 'mode-selection'
  modeContainer.innerHTML = `
    <button class="mode-btn" data-mode="default">默认模式</button>
    <button class="mode-btn" data-mode="levels">闯关模式</button>
  `

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

// 初始化游戏
function initGame() {
  // 创建游戏标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = GAME_CONFIG.gameMode === 'levels' ? `贪吃蛇 - 第${GAME_CONFIG.currentLevel}关` : '贪吃蛇'
  
  // 创建画布
  const canvas = document.createElement('canvas')
  canvas.width = GAME_CONFIG.canvasWidth
  canvas.height = GAME_CONFIG.canvasHeight
  
  // 创建计分板
  const scoreBoard = document.createElement('div')
  scoreBoard.className = 'score-board'
  
  // 清空并添加元素
  document.querySelector('#app').innerHTML = ''
  document.querySelector('#app').appendChild(title)
  document.querySelector('#app').appendChild(canvas)
  document.querySelector('#app').appendChild(scoreBoard)

  // 初始化蛇
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

  // 重置分数
  score = 0
  updateScore()

  // 重置游戏速度
  currentGameSpeed = GAME_CONFIG.initialGameSpeed

  // 清空并生成新的障碍物
  obstacles = generateObstacles()

  // 生成第一个食物
  generateFood()

  // 重置方向
  direction = 'right'

  // 开始游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, currentGameSpeed)

  // 添加键盘控制
  document.addEventListener('keydown', handleKeyPress)
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
  
  for (let i = 0; i < obstacleCount; i++) {
    let obstacle;
    do {
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
  
  // 随机选择食物类型
  const random = Math.random()
  let selectedType = GAME_CONFIG.foodTypes[0] // 默认普通食物
  let probability = 0
  
  for (const foodType of GAME_CONFIG.foodTypes) {
    probability += foodType.probability
    if (random <= probability) {
      selectedType = foodType
      break
    }
  }
  
  // 随机生成食物位置，确保在画布范围内
  food = {
    x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
    y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
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
function handleKeyPress(event) {
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

  if (newDirection) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' }
    if (opposites[newDirection] !== direction) {
      direction = newDirection
    }
  }
}

// 游戏步骤
function gameStep() {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  // 移动蛇
  const head = { x: snake[0].x, y: snake[0].y }
  switch (direction) {
    case 'up': head.y -= GAME_CONFIG.gridSize; break
    case 'down': head.y += GAME_CONFIG.gridSize; break
    case 'left': head.x -= GAME_CONFIG.gridSize; break
    case 'right': head.x += GAME_CONFIG.gridSize; break
  }

  // 检查碰撞
  if (GAME_CONFIG.wallPassEnabled) {
    // 穿墙模式：从一边穿过到另一边
    if (head.x < 0) head.x = GAME_CONFIG.canvasWidth - GAME_CONFIG.gridSize;
    if (head.x >= GAME_CONFIG.canvasWidth) head.x = 0;
    if (head.y < 0) head.y = GAME_CONFIG.canvasHeight - GAME_CONFIG.gridSize;
    if (head.y >= GAME_CONFIG.canvasHeight) head.y = 0;
  } else if (
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
    snake.some(segment => segment.x === head.x && segment.y === head.y) ||
    obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)
  ) {
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
          clearInterval(gameLoop)
          const levelUpPanel = document.createElement('div')
          levelUpPanel.className = 'game-over'
          levelUpPanel.innerHTML = `
            <h2>恭喜通关！</h2>
            <p>即将进入第${GAME_CONFIG.currentLevel}关</p>
            <p>当前得分: ${score}</p>
          `
          document.querySelector('#app').appendChild(levelUpPanel)
          
          setTimeout(() => {
            levelUpPanel.remove()
            initGame()
          }, 2000)
          return
        }
      }
    }
    
    // 处理特殊食物效果
    if (food.type === 'slow') {
      // 减速效果
      currentGameSpeed = Math.min(GAME_CONFIG.initialGameSpeed * food.speedModifier,
        currentGameSpeed * food.speedModifier)
      clearInterval(gameLoop)
      gameLoop = setInterval(gameStep, currentGameSpeed)
    } else if (score % GAME_CONFIG.speedIncreaseInterval === 0 && currentGameSpeed > GAME_CONFIG.minGameSpeed) {
      // 正常速度增加
      currentGameSpeed = Math.max(GAME_CONFIG.minGameSpeed, 
        currentGameSpeed - GAME_CONFIG.speedIncreaseAmount)
      clearInterval(gameLoop)
      gameLoop = setInterval(gameStep, currentGameSpeed)
    }
    
    updateScore()
    generateFood()
  } else {
    snake.pop() // 如果没有吃到食物，移除蛇尾
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制食物
  ctx.shadowColor = food.glow
  ctx.shadowBlur = 15
  ctx.fillStyle = food.color
  ctx.beginPath()
  ctx.arc(food.x + GAME_CONFIG.gridSize/2, food.y + GAME_CONFIG.gridSize/2, 
         GAME_CONFIG.gridSize/2 - 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 绘制障碍物
  ctx.shadowColor = '#FF4444'
  ctx.shadowBlur = 10
  ctx.fillStyle = '#D32F2F'
  obstacles.forEach(obstacle => {
    ctx.fillRect(obstacle.x, obstacle.y, GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2)
  })
  ctx.shadowBlur = 0

  // 绘制蛇
  snake.forEach((segment, index) => {
    const colorIndex = index % GAME_CONFIG.snakeColors.length
    const { color, glow } = GAME_CONFIG.snakeColors[colorIndex]
    
    // 添加发光效果
    ctx.shadowColor = glow
    ctx.shadowBlur = 10
    ctx.fillStyle = color
    
    // 绘制圆角矩形作为蛇身
    const radius = GAME_CONFIG.gridSize / 4
    ctx.beginPath()
    ctx.roundRect(segment.x, segment.y, 
                 GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2, 
                 radius)
    ctx.fill()
    
    // 重置阴影效果
    ctx.shadowBlur = 0
  })
}

// 游戏结束
function gameOver(isComplete = false) {
  clearInterval(gameLoop)
  soundManager.playSound(isComplete ? 'bonus' : 'crash')
  
  // 创建游戏结束面板
  const gameOverPanel = document.createElement('div')
  gameOverPanel.className = 'game-over'
  
  if (GAME_CONFIG.gameMode === 'levels') {
    if (isComplete) {
      gameOverPanel.innerHTML = `
        <h2>恭喜通关全部关卡！</h2>
        <p>最终得分: ${score}</p>
        <p>最高分: ${highScore}</p>
        <p>按空格键重新开始</p>
        <p>按ESC键返回模式选择</p>
      `
    } else {
      gameOverPanel.innerHTML = `
        <h2>第${GAME_CONFIG.currentLevel}关失败!</h2>
        <p>本关得分: ${score}</p>
        <p>最高分: ${highScore}</p>
        <p>按空格键重试本关</p>
        <p>按ESC键返回模式选择</p>
      `
    }
  } else {
    // 默认模式下的游戏结束处理
    gameOverPanel.innerHTML = `
      <h2>游戏结束!</h2>
      <p>最终得分: ${score}</p>
      <p>最高分: ${highScore}</p>
      <p>按空格键重新开始</p>
      <p>按ESC键返回模式选择</p>
    `
  }
  
  document.querySelector('#app').appendChild(gameOverPanel)

  // 添加重启游戏的监听器
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

// 启动游戏
showModeSelection()

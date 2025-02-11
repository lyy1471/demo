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
  snakeColors: [
    { color: '#4CAF50', glow: '#69F0AE' },
    { color: '#8BC34A', glow: '#B2FF59' },
    { color: '#CDDC39', glow: '#EEFF41' }
  ],
  foodTypes: [
    { type: 'normal', color: '#FF5252', glow: '#FF867F', points: 10, probability: 0.7 },
    { type: 'speed', color: '#2196F3', glow: '#64B5F6', points: 20, probability: 0.15 },
    { type: 'bonus', color: '#FFC107', glow: '#FFD54F', points: 30, probability: 0.15 }
  ]
}

// 游戏状态
let snake = []
let food = null
let direction = 'right'
let gameLoop = null
let score = 0
let highScore = localStorage.getItem('highScore') || 0
let currentGameSpeed = GAME_CONFIG.initialGameSpeed

// 初始化游戏
function initGame() {
  // 创建游戏标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = '贪吃蛇'
  
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
  scoreBoard.innerHTML = `
    分数: ${score}<br>
    最高分: ${highScore}
  `
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

  // 确保食物不会生成在蛇身上
  while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
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
  if (
    head.x < 0 ||
    head.x >= GAME_CONFIG.canvasWidth ||
    head.y < 0 ||
    head.y >= GAME_CONFIG.canvasHeight ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver()
    return
  }

  // 添加新头部
  snake.unshift(head)

  // 检查是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    // 播放吃食物音效
    soundManager.playSound(food.type === 'bonus' ? 'bonus' : 'eat')
    
    // 根据食物类型增加分数
    score += food.points
    
    // 更新最高分
    if (score > highScore) {
      highScore = score
      localStorage.setItem('highScore', highScore)
    }
    
    // 根据分数调整游戏速度，每到达特定分数时提升速度
    if (score % GAME_CONFIG.speedIncreaseInterval === 0 && currentGameSpeed > GAME_CONFIG.minGameSpeed) {
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
function gameOver() {
  clearInterval(gameLoop)
  soundManager.playSound('crash')
  
  // 创建游戏结束面板
  const gameOverPanel = document.createElement('div')
  gameOverPanel.className = 'game-over'
  gameOverPanel.innerHTML = `
    <h2>游戏结束!</h2>
    <p>最终得分: ${score}</p>
    <p>最高分: ${highScore}</p>
    <p>按空格键重新开始</p>
  `
  document.querySelector('#app').appendChild(gameOverPanel)

  // 添加重启游戏的监听器
  const restartHandler = (event) => {
    if (event.code === 'Space') {
      document.removeEventListener('keydown', restartHandler)
      const gameOverPanel = document.querySelector('.game-over')
      if (gameOverPanel) gameOverPanel.remove()
      direction = 'right'
      initGame()
    }
  }
  document.addEventListener('keydown', restartHandler)
}

// 启动游戏
initGame()

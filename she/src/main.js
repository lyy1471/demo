import './style.css'

// 游戏配置
const GAME_CONFIG = {
  canvasWidth: 600,
  canvasHeight: 400,
  gridSize: 20,
  initialSnakeLength: 3,
  gameSpeed: 150,
  snakeColors: ['#4CAF50', '#8BC34A', '#CDDC39'] // 蛇身渐变色
}

// 游戏状态
let snake = []
let food = null
let direction = 'right'
let gameLoop = null
let score = 0
let highScore = localStorage.getItem('highScore') || 0

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
  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    snake.unshift({
      x: Math.floor(GAME_CONFIG.canvasWidth / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
      y: Math.floor(GAME_CONFIG.canvasHeight / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
    })
  }

  // 重置分数
  score = 0
  updateScore()

  // 生成第一个食物
  generateFood()

  // 开始游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, GAME_CONFIG.gameSpeed)

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
  
  food = {
    x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
    y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
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
    score += 10
    if (score > highScore) {
      highScore = score
      localStorage.setItem('highScore', highScore)
    }
    updateScore()
    generateFood()
  } else {
    snake.pop()
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制食物
  ctx.fillStyle = '#FF5252'
  ctx.beginPath()
  ctx.arc(food.x + GAME_CONFIG.gridSize/2, food.y + GAME_CONFIG.gridSize/2, 
         GAME_CONFIG.gridSize/2 - 2, 0, Math.PI * 2)
  ctx.fill()

  // 绘制蛇
  snake.forEach((segment, index) => {
    const colorIndex = index % GAME_CONFIG.snakeColors.length
    ctx.fillStyle = GAME_CONFIG.snakeColors[colorIndex]
    
    // 绘制圆角矩形作为蛇身
    const radius = GAME_CONFIG.gridSize / 4
    ctx.beginPath()
    ctx.roundRect(segment.x, segment.y, 
                 GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2, 
                 radius)
    ctx.fill()
  })
}

// 游戏结束
function gameOver() {
  clearInterval(gameLoop)
  
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

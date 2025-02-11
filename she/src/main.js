import './style.css'

// 游戏配置
const GAME_CONFIG = {
  canvasWidth: 600,
  canvasHeight: 400,
  gridSize: 20,
  initialSnakeLength: 3,
  gameSpeed: 150
}

// 游戏状态
let snake = []
let food = null
let direction = 'right'
let gameLoop = null
let score = 0

// 初始化游戏
function initGame() {
  const canvas = document.createElement('canvas')
  canvas.width = GAME_CONFIG.canvasWidth
  canvas.height = GAME_CONFIG.canvasHeight
  document.querySelector('#app').innerHTML = ''
  document.querySelector('#app').appendChild(canvas)

  // 初始化蛇
  snake = []
  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    snake.unshift({
      x: Math.floor(GAME_CONFIG.canvasWidth / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
      y: Math.floor(GAME_CONFIG.canvasHeight / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
    })
  }

  // 生成第一个食物
  generateFood()

  // 开始游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, GAME_CONFIG.gameSpeed)

  // 添加键盘控制
  document.addEventListener('keydown', handleKeyPress)
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
  switch (event.key) {
    case 'ArrowUp':
      if (direction !== 'down') direction = 'up'
      break
    case 'ArrowDown':
      if (direction !== 'up') direction = 'down'
      break
    case 'ArrowLeft':
      if (direction !== 'right') direction = 'left'
      break
    case 'ArrowRight':
      if (direction !== 'left') direction = 'right'
      break
  }
}

// 游戏步骤
function gameStep() {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  // 移动蛇
  const head = { x: snake[0].x, y: snake[0].y }
  switch (direction) {
    case 'up':
      head.y -= GAME_CONFIG.gridSize
      break
    case 'down':
      head.y += GAME_CONFIG.gridSize
      break
    case 'left':
      head.x -= GAME_CONFIG.gridSize
      break
    case 'right':
      head.x += GAME_CONFIG.gridSize
      break
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
    generateFood()
  } else {
    snake.pop()
  }

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制食物
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(food.x, food.y, GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2)

  // 绘制蛇
  ctx.fillStyle = '#00ff00'
  snake.forEach(segment => {
    ctx.fillRect(segment.x, segment.y, GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2)
  })

  // 显示分数
  ctx.fillStyle = '#ffffff'
  ctx.font = '20px Arial'
  ctx.fillText(`Score: ${score}`, 10, 30)
}

// 游戏结束
function gameOver() {
  clearInterval(gameLoop)
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = '#ffffff'
  ctx.font = '48px Arial'
  ctx.fillText('Game Over!', GAME_CONFIG.canvasWidth/2 - 100, GAME_CONFIG.canvasHeight/2)
  ctx.font = '24px Arial'
  ctx.fillText(`Final Score: ${score}`, GAME_CONFIG.canvasWidth/2 - 70, GAME_CONFIG.canvasHeight/2 + 40)
  ctx.fillText('Press Space to Restart', GAME_CONFIG.canvasWidth/2 - 100, GAME_CONFIG.canvasHeight/2 + 80)

  // 添加重启游戏的监听器
  const restartHandler = (event) => {
    if (event.code === 'Space') {
      document.removeEventListener('keydown', restartHandler)
      score = 0
      direction = 'right'
      initGame()
    }
  }
  document.addEventListener('keydown', restartHandler)
}

// 启动游戏
initGame()

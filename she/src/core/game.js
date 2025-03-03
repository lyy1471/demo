// 游戏核心逻辑模块 - 负责管理游戏状态、控制流程和事件处理
import { checkBoundaryCollision, checkSelfCollision, checkObstacleCollision } from './collision.js'
import { soundManager } from '../assets/sounds.js'
import { createModeSelection, createContinueGameModal, adjustCanvasSize, createGameLayout, createGameOverPanel } from '../ui/layout.js'
import { GAME_CONFIG } from './config.js'
import { render } from '../ui/renderer.js'
import { foodIcons, obstacleIcons } from '../assets/assets.js'
import { changeDirection, handleKeyPress } from '../ui/controller.js'

// 显示模式选择界面
export function showModeSelection() {
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
              initGameWithConfig(GAME_CONFIG)
            }
          })
          
          document.body.appendChild(modal)
        } else {
          // 没有存档或是第一关，直接开始新游戏
          GAME_CONFIG.currentLevel = 1
          localStorage.setItem('lastLevel', GAME_CONFIG.currentLevel)
          GAME_CONFIG.wallPassEnabled = true
          initGameWithConfig(GAME_CONFIG)
        }
      } else {
        // 默认模式直接开始
        GAME_CONFIG.currentLevel = 1
        GAME_CONFIG.wallPassEnabled = false
        initGameWithConfig(GAME_CONFIG)
      }
    }
  })

  const app = document.querySelector('#app')
  app.appendChild(modeContainer)
}

// 游戏核心状态变量
let snake = []          // 蛇身体段数组，每个元素包含x,y坐标
let food = null         // 当前食物对象，包含位置、类型和分值信息
let obstacles = []      // 障碍物数组，用于关卡模式
let direction = 'right' // 当前移动方向
let nextDirection = direction  // 下一步的移动方向，用于防止快速按键导致的自身碰撞
let gameLoop = null     // 游戏主循环定时器
let score = 0          // 当前得分
let highScore = localStorage.getItem('highScore') || 0  // 历史最高分，从本地存储获取
let currentGameSpeed = null  // 当前游戏速度（毫秒/帧）

// 回调函数和事件处理器
let onGameOverCallback = null    // 游戏结束回调
let onScoreUpdateCallback = null // 分数更新回调
let handleKeyDown = null        // 键盘事件处理函数
let handleTouchStart = null     // 触摸开始事件处理函数
let handleTouchMove = null      // 触摸移动事件处理函数
let handleTouchEnd = null       // 触摸结束事件处理函数

/**
 * 初始化游戏状态
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @returns {Object} 游戏初始状态
 * 实现细节：
 * 1. 调整画布大小以适应不同设备
 * 2. 创建游戏布局和渲染上下文
 * 3. 初始化游戏状态（蛇、食物、障碍物等）
 * 4. 根据设备类型设置相应的控制方式
 */
export function initGame() {
  // 初始化vConsole
  const vConsole = new VConsole()

  // 监听屏幕旋转事件
  window.addEventListener('resize', () => {
    if (GAME_CONFIG.isMobile) {
      adjustCanvasSize(GAME_CONFIG)
      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.width = GAME_CONFIG.canvasWidth
        canvas.height = GAME_CONFIG.canvasHeight
      }
    }
  })

  // 显示模式选择界面
  showModeSelection()
}

/**
 * 初始化游戏状态
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @returns {Object} 游戏初始状态
 */
export function initGameWithConfig(GAME_CONFIG) {
  // 清理之前的事件监听器和游戏状态
  removeEventListeners()
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = null
  }

  // 初始化时调整画布大小
  adjustCanvasSize(GAME_CONFIG)
  
  // 创建游戏布局
  const { canvas, ctx } = createGameLayout(GAME_CONFIG)

  // 初始化游戏状态
  initGameState(GAME_CONFIG)

  // 启动游戏循环
  startGameLoop(GAME_CONFIG)

  // 根据设备类型添加控制
  if (GAME_CONFIG.isMobile) {
    initTouchControls(GAME_CONFIG)
  } else {
    initKeyboardControls(GAME_CONFIG)
  }
}

/**
 * 初始化游戏状态
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @returns {Object} 包含初始化后的游戏状态
 * 实现细节：
 * 1. 在画布中央初始化蛇的位置
 * 2. 设置初始蛇身长度
 * 3. 重置游戏分数和速度
 * 4. 生成初始障碍物和食物
 */
export function initGameState(GAME_CONFIG) {
  // 初始化蛇的位置和长度
  snake = []
  const startX = Math.floor(GAME_CONFIG.canvasWidth / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
  const startY = Math.floor(GAME_CONFIG.canvasHeight / (2 * GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
  
  // 初始化蛇身
  for (let i = 0; i < GAME_CONFIG.initialSnakeLength; i++) {
    snake.push({
      x: startX - (i * GAME_CONFIG.gridSize),
      y: startY
    })
  }

  // 重置游戏状态
  score = 0
  currentGameSpeed = GAME_CONFIG.initialGameSpeed
  obstacles = generateObstacles(GAME_CONFIG, snake)
  food = generateFood(GAME_CONFIG, snake, obstacles)
  direction = 'right'
  nextDirection = 'right'

  return {
    snake,
    food,
    obstacles,
    direction,
    nextDirection,
    score,
    currentGameSpeed
  }
}

/**
 * 生成障碍物
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {Array} snake - 蛇身体数组
 * @returns {Array} 障碍物数组
 * 实现细节：
 * 1. 根据当前关卡计算障碍物数量
 * 2. 设置安全区域防止障碍物生成在蛇附近
 * 3. 使用循环尝试生成有效的障碍物位置
 * 4. 确保障碍物不会与蛇身重叠或太靠近蛇头
 */
export function generateObstacles(GAME_CONFIG, snake) {
  if (GAME_CONFIG.gameMode === 'default') {
    return []
  }

  const obstacleCount = Math.min(
    GAME_CONFIG.levelConfig.baseObstacles + 
    (GAME_CONFIG.currentLevel - 1) * GAME_CONFIG.levelConfig.obstacleIncrease,
    GAME_CONFIG.levelConfig.maxObstacles
  )
  
  const newObstacles = []
  const safeZoneSize = 5
  const snakeHead = snake[0]
  
  for (let i = 0; i < obstacleCount; i++) {
    let obstacle
    let attempts = 0
    const maxAttempts = 100
    
    do {
      obstacle = {
        x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
        y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        return newObstacles
      }
    } while (
      snake.some(segment => segment.x === obstacle.x && segment.y === obstacle.y) ||
      newObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y) ||
      (Math.abs(obstacle.x - snakeHead.x) <= GAME_CONFIG.gridSize * safeZoneSize &&
       Math.abs(obstacle.y - snakeHead.y) <= GAME_CONFIG.gridSize * safeZoneSize) ||
      (Math.sqrt(Math.pow(obstacle.x - snakeHead.x, 2) + Math.pow(obstacle.y - snakeHead.y, 2)) <= 
       GAME_CONFIG.gridSize * (safeZoneSize - 1))
    )
    
    newObstacles.push(obstacle)
  }
  return newObstacles
}

/**
 * 生成食物
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {Array} snake - 蛇身体数组
 * @param {Array} obstacles - 障碍物数组
 * @returns {Object} 食物对象
 * 实现细节：
 * 1. 根据概率权重随机选择食物类型
 * 2. 在画布范围内随机生成食物位置
 * 3. 确保食物不会生成在蛇身或障碍物上
 * 4. 设置食物的属性（类型、颜色、分值等）
 */
export function generateFood(GAME_CONFIG, snake, obstacles) {
  const random = Math.random()
  let selectedType = GAME_CONFIG.foodTypes[0]
  let probability = 0
  
  for (const foodType of GAME_CONFIG.foodTypes) {
    probability += foodType.probability
    if (random <= probability) {
      selectedType = foodType
      break
    }
  }
  
  const maxGridX = Math.floor(GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)
  const maxGridY = Math.floor(GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)
  let newFood = {
    x: (Math.floor(Math.random() * maxGridX)) * GAME_CONFIG.gridSize,
    y: (Math.floor(Math.random() * maxGridY)) * GAME_CONFIG.gridSize,
    type: selectedType.type,
    color: selectedType.color,
    glow: selectedType.glow,
    points: selectedType.points
  }

  while (
    snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
    obstacles.some(obstacle => obstacle.x === newFood.x && obstacle.y === newFood.y)
  ) {
    newFood.x = Math.floor(Math.random() * maxGridX) * GAME_CONFIG.gridSize
    newFood.y = Math.floor(Math.random() * maxGridY) * GAME_CONFIG.gridSize
  }

  return newFood
}

/**
 * 更新游戏状态
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {Function} onGameOver - 游戏结束回调
 * @param {Function} onScoreUpdate - 分数更新回调
 * @param {Function} onFoodEaten - 吃到食物回调
 * @returns {Object} 更新后的游戏状态
 */
export function updateGameState(GAME_CONFIG) {
  direction = nextDirection

  // 移动蛇头
  const head = { x: snake[0].x, y: snake[0].y }
  switch (direction) {
    case 'up': head.y -= GAME_CONFIG.gridSize; break
    case 'down': head.y += GAME_CONFIG.gridSize; break
    case 'left': head.x -= GAME_CONFIG.gridSize; break
    case 'right': head.x += GAME_CONFIG.gridSize; break
  }

  // 处理边界碰撞
  const { nextHeadX, nextHeadY, isCollided } = checkBoundaryCollision(head, GAME_CONFIG)
  
  if (isCollided && !GAME_CONFIG.wallPassEnabled) {
    gameOver()
    return null
  }

  head.x = nextHeadX
  head.y = nextHeadY

  // 检查碰撞
  if (checkSelfCollision(head, snake) || checkObstacleCollision(head, obstacles)) {
    gameOver()
    return null
  }

  snake.unshift(head)

  // 处理食物碰撞
  if (head.x === food.x && head.y === food.y) {
    handleFoodCollision(GAME_CONFIG)
  } else {
    snake.pop()
  }

  return {
    snake,
    food,
    obstacles,
    direction,
    nextDirection,
    score,
    currentGameSpeed
  }
}

/**
 * 设置下一个方向
 * @param {string} newDirection - 新方向
 */
export function setNextDirection(newDirection) {
  nextDirection = newDirection
}

/**
 * 获取当前游戏状态
 * @returns {Object} 当前游戏状态
 */
export function getGameState() {
  return {
    snake,
    food,
    obstacles,
    direction,
    nextDirection,
    score,
    currentGameSpeed,
    highScore
  }
}

/**
 * 更新游戏速度
 * @param {number} newSpeed - 新的游戏速度
 */
export function updateGameSpeed(newSpeed) {
  currentGameSpeed = newSpeed
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = setInterval(gameStep, currentGameSpeed)
  }
}

/**
 * 处理食物碰撞
 */
function handleFoodCollision(GAME_CONFIG) {
  // 播放吃食物音效
  soundManager.playSound(food.type === 'bonus' ? 'bonus' : 'eat')
  
  // 根据食物类型增加分数和特殊效果
  if (food.type === 'double') {
    score += food.points * 2
  } else if (food.type === 'speed') {
    score += food.points
    // 使用平滑的速度增长算法
    const speedIncrease = Math.floor(score / GAME_CONFIG.speedIncreaseInterval) * GAME_CONFIG.speedIncreaseAmount
    const newSpeed = Math.max(GAME_CONFIG.minGameSpeed, GAME_CONFIG.initialGameSpeed - speedIncrease)
    if (newSpeed !== currentGameSpeed) {
      updateGameSpeed(newSpeed)
    }
  } else if (food.type === 'slow') {
    score += food.points
    // 限制减速效果，确保游戏节奏不会过慢
    const maxSlowSpeed = GAME_CONFIG.initialGameSpeed * 1.2
    const newSpeed = Math.min(maxSlowSpeed, currentGameSpeed + GAME_CONFIG.speedIncreaseAmount)
    if (newSpeed !== currentGameSpeed) {
      updateGameSpeed(newSpeed)
    }
  } else {
    score += food.points
  }

  if (onScoreUpdateCallback) onScoreUpdateCallback(score)
  
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
        initGameState(GAME_CONFIG)
        return
      }
    }
  }

  // 生成新的食物
  food = generateFood(GAME_CONFIG, snake, obstacles)
}

/**
 * 游戏步进函数
 */
function gameStep() {
  const gameState = updateGameState(GAME_CONFIG)
  if (gameState) {
    const { snake, food, obstacles } = gameState
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    render(ctx, snake, food, obstacles, GAME_CONFIG, foodIcons, obstacleIcons)
  }
}

/**
 * 游戏结束处理
 */
export function initKeyboardControls(GAME_CONFIG) {
  // 先移除已存在的事件监听器
  if (handleKeyDown) {
    document.removeEventListener('keydown', handleKeyDown)
  }

  // 添加按键冷却时间变量
  let lastKeyPressTime = 0
  const KEY_COOLDOWN = 50 // 设置50毫秒的按键冷却时间

  handleKeyDown = (event) => {
    const currentTime = Date.now()
    // 检查是否超过冷却时间
    if (currentTime - lastKeyPressTime < KEY_COOLDOWN) {
      return
    }
    lastKeyPressTime = currentTime
    const newDirection = handleKeyPress(event, getGameState().direction)
    if (newDirection) {
      setNextDirection(newDirection)
    }
  }

  document.addEventListener('keydown', handleKeyDown)
}

export function initTouchControls(GAME_CONFIG) {
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let isLongPress = false
  let longPressTimer = null
  const minSwipeDistance = 30

  handleTouchStart = (e) => {
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
  }

  handleTouchMove = (e) => {
    e.preventDefault()
    // 如果是长按状态，取消滑动方向改变
    if (isLongPress) return
  }

  handleTouchEnd = (e) => {
    // 清除长按计时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY

    // 恢复正常速度
    if (GAME_CONFIG.touchSpeedBoost.enabled && GAME_CONFIG.normalSpeed) {
      clearInterval(gameLoop)
      gameLoop = setInterval(gameStep, GAME_CONFIG.normalSpeed)
      currentGameSpeed = GAME_CONFIG.normalSpeed
      GAME_CONFIG.normalSpeed = null
    }

    touchStartTime = 0
    isLongPress = false

    // 只在非长按状态下处理滑动
    if (!isLongPress && (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance)) {
      let newDirection
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? 'right' : 'left'
      } else {
        newDirection = deltaY > 0 ? 'down' : 'up'
      }
      setNextDirection(changeDirection(newDirection, getGameState().direction))
    }
  }

  document.addEventListener('touchstart', handleTouchStart)
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

export function removeEventListeners() {
  if (GAME_CONFIG.isMobile) {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

export function gameOver(isComplete = false) {
  // 清除游戏循环
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = null
  }

  soundManager.playSound(isComplete ? 'bonus' : 'crash')
  
  // 在游戏结束时保存当前关卡进度
  if (GAME_CONFIG.gameMode === 'levels' && !isComplete) {
    localStorage.setItem('lastLevel', GAME_CONFIG.currentLevel)
  }

  if (onGameOverCallback) {
    onGameOverCallback(isComplete)
  }

  // 创建并显示游戏结束面板
  const gameOverPanel = createGameOverPanel(score, highScore, GAME_CONFIG, isComplete)
  
  // 添加事件监听
  if (GAME_CONFIG.isMobile) {
    // 移动端按钮点击事件
    gameOverPanel.addEventListener('click', (e) => {
      if (e.target.classList.contains('restart-btn')) {
        gameOverPanel.remove()
        initGameWithConfig(GAME_CONFIG)
      } else if (e.target.classList.contains('menu-btn')) {
        gameOverPanel.remove()
        showModeSelection()
      }
    })
  } else {
    // PC端键盘事件
    const handleGameOverKeys = (e) => {
      if (e.code === 'Space') {
        gameOverPanel.remove()
        document.removeEventListener('keydown', handleGameOverKeys)
        initGameWithConfig(GAME_CONFIG)
      } else if (e.code === 'Escape') {
        gameOverPanel.remove()
        document.removeEventListener('keydown', handleGameOverKeys)
        showModeSelection()
      }
    }
    document.addEventListener('keydown', handleGameOverKeys)
  }

  // 将结束面板添加到页面
  document.querySelector('#app').appendChild(gameOverPanel)
}

/**
 * 设置游戏回调函数
 */
export function setGameCallbacks(callbacks) {
  const { onGameOver, onScoreUpdate } = callbacks
  onGameOverCallback = onGameOver
  onScoreUpdateCallback = onScoreUpdate
}

/**
 * 启动游戏循环
 * @param {Object} GAME_CONFIG - 游戏配置对象
 */
export function startGameLoop(GAME_CONFIG) {
  if (gameLoop) {
    clearInterval(gameLoop)
  }
  currentGameSpeed = GAME_CONFIG.initialGameSpeed
  gameLoop = setInterval(gameStep, currentGameSpeed)
}

/**
 * 停止游戏循环
 */
export function stopGameLoop() {
  if (gameLoop) {
    clearInterval(gameLoop)
    gameLoop = null
  }
}
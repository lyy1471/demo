// 布局管理模块

// 根据屏幕方向和尺寸调整画布大小
export function adjustCanvasSize(GAME_CONFIG) {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const isPortrait = screenHeight > screenWidth
  const padding = 20
  
  // 计算基础尺寸
  let baseWidth, baseHeight
  
  if (GAME_CONFIG.isMobile) {
    if (isPortrait) {
      // 竖屏模式：使用屏幕宽度作为基准
      baseWidth = Math.min(screenWidth - padding * 2, 400)
      // 保持合适的宽高比
      baseHeight = Math.min(baseWidth * 1.5, screenHeight * 0.6)
    } else {
      // 横屏模式：使用屏幕高度作为基准
      baseHeight = Math.min(screenHeight - padding * 2, 400)
      // 保持合适的宽高比
      baseWidth = Math.min(baseHeight * 1.5, screenWidth * 0.7)
    }
    
    // 确保尺寸为偶数，便于网格对齐
    GAME_CONFIG.canvasWidth = Math.floor(baseWidth / 2) * 2
    GAME_CONFIG.canvasHeight = Math.floor(baseHeight / 2) * 2
    
    // 根据画布尺寸计算合适的网格大小
    const minGridSize = 15
    const maxGridSize = 25
    const idealGridCount = 20 // 理想的网格数量
    
    // 计算网格大小，确保网格数量适中
    const gridSizeFromWidth = Math.floor(GAME_CONFIG.canvasWidth / idealGridCount)
    const gridSizeFromHeight = Math.floor(GAME_CONFIG.canvasHeight / idealGridCount)
    
    // 选择合适的网格大小
    GAME_CONFIG.gridSize = Math.min(
      Math.max(
        Math.min(gridSizeFromWidth, gridSizeFromHeight),
        minGridSize
      ),
      maxGridSize
    )
    
    // 调整画布尺寸以适应网格
    GAME_CONFIG.canvasWidth = Math.floor(GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize) * GAME_CONFIG.gridSize
    GAME_CONFIG.canvasHeight = Math.floor(GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize) * GAME_CONFIG.gridSize
  }
}

// 创建游戏界面布局
export function createGameLayout(GAME_CONFIG) {
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
  
  // 创建计分板，根据屏幕方向调整位置
  const scoreBoard = document.createElement('div')
  scoreBoard.className = 'score-board'
  
  // 根据屏幕方向调整计分板位置
  const isPortrait = window.innerHeight > window.innerWidth
  if (isPortrait) {
    scoreBoard.style.position = 'fixed'
    scoreBoard.style.top = '10px'
    scoreBoard.style.right = '10px'
    scoreBoard.style.transform = 'none'
    scoreBoard.style.width = 'auto'
    scoreBoard.style.maxWidth = '150px'
  } else {
    scoreBoard.style.position = 'fixed'
    scoreBoard.style.top = '20px'
    scoreBoard.style.right = '20px'
    scoreBoard.style.transform = 'none'
  }
  
  // 清空并添加游戏元素
  const app = document.querySelector('#app')
  app.innerHTML = ''
  app.style.position = 'relative'
  app.style.width = '100%'
  app.style.height = '100vh'
  app.style.display = 'flex'
  app.style.flexDirection = 'column'
  app.style.justifyContent = 'center'
  app.style.alignItems = 'center'
  
  app.appendChild(title)
  app.appendChild(canvas)
  app.appendChild(scoreBoard)

  return { canvas, ctx, scoreBoard }
}

// 创建模式选择界面
export function createModeSelection() {
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

  // 添加背景蛇元素
  const backgroundSnake = document.createElement('div')
  backgroundSnake.className = 'background-snake'
  
  // 添加多个蛇头
  for (let i = 0; i < 5; i++) {
    const snakeHead = document.createElement('div')
    snakeHead.className = 'background-snake-head'
    snakeHead.style.animationDelay = `${i * 0.3}s`
    snakeHead.style.left = `${Math.random() * 80}%`
    snakeHead.style.top = `${Math.random() * 80}%`
    backgroundSnake.appendChild(snakeHead)
  }
  
  app.appendChild(backgroundSnake)

  app.appendChild(modeContainer)
  return modeContainer
}

// 创建继续游戏模态框
export function createContinueGameModal(savedLevel) {
  const modal = document.createElement('div')
  modal.className = 'modal'
  modal.innerHTML = `
    <div class="modal-content">
      <h3>选择开始方式</h3>
      <button class="modal-btn" data-action="new">重新开始</button>
      ${savedLevel > 1 ? `<button class="modal-btn" data-action="continue">继续第${savedLevel}关</button>` : ''}
    </div>
  `

  // 添加模态框样式
  const style = document.createElement('style')
  style.textContent = `
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .modal-btn {
      margin: 10px;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      background: #4CAF50;
      color: white;
      cursor: pointer;
    }
    .modal-btn:hover {
      background: #45a049;
    }
  `
  document.head.appendChild(style)

  return modal
}

// 创建游戏结束面板
export function createGameOverPanel(score, highScore, GAME_CONFIG, isComplete = false) {
  const gameOverPanel = document.createElement('div')
  gameOverPanel.className = 'game-over'
  
  const controlsHtml = GAME_CONFIG.isMobile ?
    `<div class="game-over-controls">
      <button class="restart-btn">重新开始</button>
      <button class="menu-btn">返回菜单</button>
    </div>` :
    `<p>按空格键重新开始</p>
     <p>按ESC键返回模式选择</p>`

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

  return gameOverPanel
}

// 更新分数显示
export function updateScoreBoard(score, highScore, GAME_CONFIG) {
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
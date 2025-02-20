// 布局管理模块

// 根据屏幕方向和尺寸调整画布大小
export function adjustCanvasSize(GAME_CONFIG) {
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
  
  // 创建计分板
  const scoreBoard = document.createElement('div')
  scoreBoard.className = 'score-board'
  
  // 清空并添加游戏元素
  document.querySelector('#app').innerHTML = ''
  document.querySelector('#app').appendChild(title)
  document.querySelector('#app').appendChild(canvas)
  document.querySelector('#app').appendChild(scoreBoard)

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
// 布局管理模块 - 负责游戏界面的布局和响应式调整

/**
 * 根据屏幕方向和尺寸调整画布大小
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * 该函数仅在移动设备上生效，用于实现响应式布局
 * 主要功能：
 * 1. 根据屏幕方向（横屏/竖屏）计算最佳画布尺寸
 * 2. 确保画布尺寸在合理范围内
 * 3. 调整网格大小以适应画布
 * 4. 保证画布尺寸为网格大小的整数倍
 */
export function adjustCanvasSize(GAME_CONFIG) {
  if (!GAME_CONFIG.isMobile) return;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isPortrait = screenHeight > screenWidth;
  const padding = 20;
  
  // 计算基础尺寸 - 根据屏幕方向选择合适的尺寸计算方式
  const maxWidth = isPortrait ? screenWidth - padding * 2 : screenHeight * 1.5;
  const maxHeight = isPortrait ? maxWidth * 1.5 : screenHeight - padding * 2;
  
  // 确保尺寸在合理范围内 - 设置最大限制以避免画布过大
  const baseWidth = Math.min(maxWidth, isPortrait ? 400 : screenWidth * 0.7);
  const baseHeight = Math.min(maxHeight, isPortrait ? screenHeight * 0.6 : 400);
  
  // 调整为偶数尺寸 - 确保像素对齐
  GAME_CONFIG.canvasWidth = Math.floor(baseWidth / 2) * 2;
  GAME_CONFIG.canvasHeight = Math.floor(baseHeight / 2) * 2;
  
  // 计算合适的网格大小 - 在15到25之间动态调整，保证游戏元素大小合适
  const idealGridCount = 20;
  const gridSize = Math.min(
    Math.max(
      Math.min(
        Math.floor(GAME_CONFIG.canvasWidth / idealGridCount),
        Math.floor(GAME_CONFIG.canvasHeight / idealGridCount)
      ),
      15 // minGridSize - 最小网格大小，确保游戏元素不会太小
    ),
    25 // maxGridSize - 最大网格大小，确保游戏元素不会太大
  );
  
  GAME_CONFIG.gridSize = gridSize;
  
  // 调整画布尺寸以适应网格 - 确保画布能被网格大小整除
  GAME_CONFIG.canvasWidth = Math.floor(GAME_CONFIG.canvasWidth / gridSize) * gridSize;
  GAME_CONFIG.canvasHeight = Math.floor(GAME_CONFIG.canvasHeight / gridSize) * gridSize;
}

/**
 * 创建游戏界面布局
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @returns {Object} 返回包含画布、上下文和计分板的对象
 * 主要功能：
 * 1. 创建并配置游戏标题
 * 2. 创建并设置画布
 * 3. 创建并定位计分板
 * 4. 配置主容器布局
 */
export function createGameLayout(GAME_CONFIG) {
  // 创建游戏标题 - 根据游戏模式显示不同标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.innerHTML = GAME_CONFIG.gameMode === 'levels' ? 
    `贪吃蛇<br>第${GAME_CONFIG.currentLevel}关` : 
    '贪吃蛇'
  
  // 创建游戏画布 - 设置尺寸和渲染属性
  const canvas = document.createElement('canvas')
  canvas.width = GAME_CONFIG.canvasWidth
  canvas.height = GAME_CONFIG.canvasHeight
  
  // 获取2D上下文 - 配置渲染质量
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // 创建计分板 - 根据屏幕方向自适应位置
  const scoreBoard = document.createElement('div')
  scoreBoard.className = 'score-board'
  
  // 根据屏幕方向调整计分板位置和样式
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
  
  // 配置主容器 - 设置flex布局实现居中对齐
  const app = document.querySelector('#app')
  app.innerHTML = ''
  app.style.position = 'relative'
  app.style.width = '100%'
  app.style.height = '100vh'
  app.style.display = 'flex'
  app.style.flexDirection = 'column'
  app.style.justifyContent = 'center'
  app.style.alignItems = 'center'
  
  // 添加界面元素
  app.appendChild(title)
  app.appendChild(canvas)
  app.appendChild(scoreBoard)

  return { canvas, ctx, scoreBoard }
}

/**
 * 创建模式选择界面
 * @returns {HTMLElement} 返回模式选择容器元素
 * 主要功能：
 * 1. 创建游戏标题
 * 2. 创建模式选择按钮
 * 3. 添加装饰性背景动画
 */
export function createModeSelection() {
  const app = document.querySelector('#app')
  app.innerHTML = ''

  // 创建游戏标题
  const title = document.createElement('h1')
  title.className = 'game-title'
  title.textContent = '贪吃蛇'
  app.appendChild(title)

  // 创建模式选择容器 - 包含默认模式和闯关模式按钮
  const modeContainer = document.createElement('div')
  modeContainer.className = 'mode-selection'
  modeContainer.innerHTML = `
    <button class="mode-btn" data-mode="default">默认模式</button>
    <button class="mode-btn" data-mode="levels">闯关模式</button>
  `

  // 创建动态背景 - 添加多个动画蛇头增加视觉效果
  const backgroundSnake = document.createElement('div')
  backgroundSnake.className = 'background-snake'
  
  // 添加多个蛇头 - 设置不同的动画延迟和随机位置
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

/**
 * 创建继续游戏模态框
 * @param {number} savedLevel - 已保存的关卡进度
 * @returns {HTMLElement} 返回模态框元素
 * 主要功能：
 * 1. 创建模态框容器
 * 2. 添加重新开始按钮
 * 3. 根据存档显示继续游戏按钮
 */
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
  return modal
}

/**
 * 创建游戏结束面板
 * @param {number} score - 当前得分
 * @param {number} highScore - 最高分
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {boolean} isComplete - 是否完成所有关卡
 * @returns {HTMLElement} 返回游戏结束面板元素
 * 主要功能：
 * 1. 创建结束面板容器
 * 2. 根据游戏模式显示不同内容
 * 3. 根据设备类型显示不同控制提示
 */
export function createGameOverPanel(score, highScore, GAME_CONFIG, isComplete = false) {
  const gameOverPanel = document.createElement('div')
  gameOverPanel.className = 'game-over'
  
  // 根据设备类型生成不同的控制提示
  const controlsHtml = GAME_CONFIG.isMobile ?
    `<div class="game-over-controls">
      <button class="restart-btn">重新开始</button>
      <button class="menu-btn">返回菜单</button>
    </div>` :
    `<p>按空格键重新开始</p>
     <p>按ESC键返回模式选择</p>`

  // 根据游戏模式和状态生成不同的结束面板内容
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

/**
 * 更新分数显示
 * @param {number} score - 当前得分
 * @param {number} highScore - 最高分
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * 主要功能：
 * 1. 更新计分板显示内容
 * 2. 根据游戏模式显示不同信息
 * 3. 在闯关模式下显示目标分数
 */
export function updateScoreBoard(score, highScore, GAME_CONFIG) {
  const scoreBoard = document.querySelector('.score-board')
  let content = `
    分数: ${score}<br>
    最高分: ${highScore}
  `
  
  // 闯关模式下显示额外信息
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
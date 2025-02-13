// 游戏渲染器模块

// 渲染游戏画面
export function render(ctx, snake, food, obstacles, GAME_CONFIG, foodIcons, obstacleIcons) {
  // 清空画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 绘制食物
  renderFood(ctx, food, foodIcons, GAME_CONFIG)

  // 绘制障碍物
  renderObstacles(ctx, obstacles, obstacleIcons, GAME_CONFIG)

  // 绘制蛇
  renderSnake(ctx, snake, GAME_CONFIG)
}

// 渲染食物
function renderFood(ctx, food, foodIcons, GAME_CONFIG) {
  const foodIcon = foodIcons[food.type]
  ctx.shadowColor = food.glow
  ctx.shadowBlur = 15
  ctx.font = `${foodIcon.size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(foodIcon.emoji, food.x + GAME_CONFIG.gridSize/2, food.y + GAME_CONFIG.gridSize/2)
  ctx.shadowBlur = 0
}

// 渲染障碍物
function renderObstacles(ctx, obstacles, obstacleIcons, GAME_CONFIG) {
  ctx.font = `${obstacleIcons.rock.size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  obstacles.forEach(obstacle => {
    ctx.fillText(obstacleIcons.rock.emoji, obstacle.x + GAME_CONFIG.gridSize/2, obstacle.y + GAME_CONFIG.gridSize/2)
  })
}

// 渲染蛇
function renderSnake(ctx, snake, GAME_CONFIG) {
  snake.forEach((segment, index) => {
    const colorIndex = index % GAME_CONFIG.snakeColors.length
    const { color, glow } = GAME_CONFIG.snakeColors[colorIndex]
    
    // 添加发光效果
    ctx.shadowColor = glow
    ctx.shadowBlur = 15
    ctx.fillStyle = color
    
    // 绘制圆形作为蛇身
    ctx.beginPath()
    const centerX = segment.x + GAME_CONFIG.gridSize / 2
    const centerY = segment.y + GAME_CONFIG.gridSize / 2
    const radius = (GAME_CONFIG.gridSize - 4) / 2
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // 如果是蛇头，添加眼睛和表情
    if (index === 0) {
      renderSnakeHead(ctx, centerX, centerY, GAME_CONFIG.gridSize)
    }
    
    // 重置阴影效果
    ctx.shadowBlur = 0
  })
}

// 渲染蛇头的细节（眼睛和腮红）
function renderSnakeHead(ctx, centerX, centerY, gridSize) {
  // 确定眼睛位置
  const eyeRadius = gridSize / 10  // 将眼睛尺寸调整得更小一些
  const eyeOffset = gridSize / 4
  
  // 绘制眼睛
  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeRadius * 1.5, 0, Math.PI * 2)
  ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeRadius * 1.5, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制眼珠
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeRadius * 0.8, 0, Math.PI * 2)
  ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeRadius * 0.8, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制可爱的腮红
  ctx.fillStyle = '#FFB6C1'
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(centerX - eyeOffset * 1.5, centerY, eyeRadius * 1.5, 0, Math.PI * 2)
  ctx.arc(centerX + eyeOffset * 1.5, centerY, eyeRadius * 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1.0
}

// 显示得分动画
export function showScoreAnimation(x, y, points, appElement) {
  const scoreElement = document.createElement('div')
  scoreElement.className = 'score-animation'
  scoreElement.textContent = `+${points}`
  scoreElement.style.left = `${x}px`
  scoreElement.style.top = `${y}px`
  appElement.appendChild(scoreElement)

  // 移除动画元素
  setTimeout(() => {
    scoreElement.remove()
  }, 1000)
}
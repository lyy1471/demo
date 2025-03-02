// 游戏渲染器模块 - 负责游戏画面的绘制和视觉效果

/**
 * 渲染游戏画面的主函数
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
 * @param {Array} snake - 蛇身体段数组，每个元素包含x,y坐标
 * @param {Object} food - 食物对象，包含位置和类型信息
 * @param {Array} obstacles - 障碍物数组
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {Object} foodIcons - 食物图标配置
 * @param {Object} obstacleIcons - 障碍物图标配置
 * 主要功能：
 * 1. 清空画布准备新一帧渲染
 * 2. 按顺序渲染食物、障碍物和蛇
 * 3. 确保渲染顺序正确，避免图层覆盖问题
 */
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

/**
 * 渲染食物
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
 * @param {Object} food - 食物对象
 * @param {Object} foodIcons - 食物图标配置
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * 实现细节：
 * 1. 根据食物类型选择对应的emoji图标
 * 2. 添加发光效果增强视觉表现
 * 3. 居中对齐确保显示位置准确
 */
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

/**
 * 渲染障碍物
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
 * @param {Array} obstacles - 障碍物数组
 * @param {Object} obstacleIcons - 障碍物图标配置
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * 实现细节：
 * 1. 使用emoji作为障碍物图标
 * 2. 确保障碍物位置准确对齐网格
 */
function renderObstacles(ctx, obstacles, obstacleIcons, GAME_CONFIG) {
  ctx.font = `${obstacleIcons.rock.size}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  obstacles.forEach(obstacle => {
    ctx.fillText(obstacleIcons.rock.emoji, obstacle.x + GAME_CONFIG.gridSize/2, obstacle.y + GAME_CONFIG.gridSize/2)
  })
}

/**
 * 渲染蛇身
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
 * @param {Array} snake - 蛇身体段数组
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * 实现细节：
 * 1. 使用渐变色彩渲染蛇身
 * 2. 为每个蛇身段添加发光效果
 * 3. 特殊处理蛇头，添加眼睛和表情
 */
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

/**
 * 渲染蛇头的细节装饰
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D渲染上下文
 * @param {number} centerX - 蛇头中心X坐标
 * @param {number} centerY - 蛇头中心Y坐标
 * @param {number} gridSize - 网格大小
 * 实现细节：
 * 1. 绘制白色眼睛底色
 * 2. 添加黑色眼珠
 * 3. 绘制半透明腮红增加可爱效果
 */
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

/**
 * 显示得分动画
 * @param {number} x - 动画显示的X坐标
 * @param {number} y - 动画显示的Y坐标
 * @param {number} points - 得分点数
 * @param {HTMLElement} appElement - 游戏容器元素
 * 实现细节：
 * 1. 创建浮动的得分显示元素
 * 2. 添加CSS动画效果
 * 3. 一秒后自动移除动画元素
 */
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
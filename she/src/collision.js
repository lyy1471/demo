// 碰撞检测模块

/**
 * 检查是否发生边界碰撞
 * @param {Object} head - 蛇头位置
 * @param {Object} GAME_CONFIG - 游戏配置
 * @returns {Object} 处理后的蛇头位置和碰撞状态
 */
export function checkBoundaryCollision(head, GAME_CONFIG) {
  let nextHeadX = head.x
  let nextHeadY = head.y
  let isCollided = false

  const maxX = GAME_CONFIG.canvasWidth - GAME_CONFIG.gridSize
  const maxY = GAME_CONFIG.canvasHeight - GAME_CONFIG.gridSize

  if (GAME_CONFIG.wallPassEnabled) {
    // 穿墙模式：从一边穿过到另一边
    if (nextHeadX < 0) nextHeadX = maxX
    if (nextHeadX > maxX) nextHeadX = 0
    if (nextHeadY < 0) nextHeadY = maxY
    if (nextHeadY > maxY) nextHeadY = 0
  } else {
    // 非穿墙模式：检查是否碰到边界
    isCollided = (
      nextHeadX < 0 ||
      nextHeadX > maxX ||
      nextHeadY < 0 ||
      nextHeadY > maxY
    )
  }

  return {
    nextHeadX,
    nextHeadY,
    isCollided
  }
}

/**
 * 检查是否发生自身碰撞
 * @param {Object} head - 蛇头位置
 * @param {Array} snake - 蛇身体数组
 * @returns {boolean} 是否发生碰撞
 */
export function checkSelfCollision(head, snake) {
  // 从第二个身体段开始检查，避免与头部自身碰撞
  return snake.slice(1).some(segment => {
    return head.x === segment.x && head.y === segment.y
  })
}

/**
 * 检查是否发生障碍物碰撞
 * @param {Object} head - 蛇头位置
 * @param {Array} obstacles - 障碍物数组
 * @returns {boolean} 是否发生碰撞
 */
export function checkObstacleCollision(head, obstacles) {
  return obstacles.some(obstacle => {
    return head.x === obstacle.x && head.y === obstacle.y
  })
}

/**
 * 检查是否吃到食物
 * @param {Object} head - 蛇头位置
 * @param {Object} food - 食物对象
 * @returns {boolean} 是否吃到食物
 */
export function checkFoodCollision(head, food) {
  return head.x === food.x && head.y === food.y
}

/**
 * 检查新生成的食物位置是否合法
 * @param {Object} food - 食物对象
 * @param {Array} snake - 蛇身体数组
 * @param {Array} obstacles - 障碍物数组
 * @returns {boolean} 位置是否合法
 */
export function isValidFoodPosition(food, snake, obstacles) {
  // 检查是否与蛇身重叠
  const collidesWithSnake = snake.some(segment => 
    segment.x === food.x && segment.y === food.y
  )
  
  // 检查是否与障碍物重叠
  const collidesWithObstacle = obstacles.some(obstacle => 
    obstacle.x === food.x && obstacle.y === food.y
  )

  // 如果都没有重叠，则位置合法
  return !collidesWithSnake && !collidesWithObstacle
}
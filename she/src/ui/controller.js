// 游戏控制器模块 - 负责处理用户输入和游戏控制

/**
 * 改变蛇的移动方向
 * @param {string} newDirection - 新的移动方向
 * @param {string} currentDirection - 当前移动方向
 * @returns {string} 最终的移动方向
 * 实现细节：
 * 1. 防止蛇反向移动（例如向右移动时不能直接向左转向）
 * 2. 验证新方向的有效性
 * 3. 确保平滑的方向转换
 */
export function changeDirection(newDirection, currentDirection) {
  // 防止蛇反向移动（例如向右移动时不能直接向左转向）
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' }
  if (newDirection && opposites[newDirection] !== currentDirection) {
    return newDirection
  }
  return currentDirection
}

/**
 * 处理键盘按键事件
 * @param {KeyboardEvent} event - 键盘事件对象
 * @param {string} currentDirection - 当前移动方向
 * @returns {string} 根据按键确定的新方向
 * 实现细节：
 * 1. 支持方向键和WASD按键
 * 2. 将按键映射到移动方向
 * 3. 确保方向改变的有效性
 */
export function handleKeyPress(event, currentDirection) {
  // 键盘按键映射到移动方向
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

  // 如果是有效的方向键，则改变方向
  return changeDirection(newDirection, currentDirection)
}

/**
 * 初始化触摸控制
 * @param {number} gameLoop - 游戏循环计时器ID
 * @param {number} currentGameSpeed - 当前游戏速度
 * @param {Object} GAME_CONFIG - 游戏配置对象
 * @param {Function} gameStep - 游戏步进函数
 * 实现细节：
 * 1. 处理触摸开始、移动和结束事件
 * 2. 支持滑动控制方向
 * 3. 实现长按加速功能
 * 4. 确保触摸控制的响应性和准确性
 */
export function initTouchControls(gameLoop, currentGameSpeed, GAME_CONFIG, gameStep) {
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let isLongPress = false
  let longPressTimer = null
  const minSwipeDistance = 30

  document.addEventListener('touchstart', (e) => {
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
          // 保存当前速度
          GAME_CONFIG.normalSpeed = currentGameSpeed
          // 设置加速速度
          currentGameSpeed = GAME_CONFIG.touchSpeedBoost.boostSpeed
          clearInterval(gameLoop)
          gameLoop = setInterval(gameStep, GAME_CONFIG.touchSpeedBoost.boostSpeed)
        }
      }
    }, GAME_CONFIG.touchSpeedBoost.minTouchDuration)
  })

  document.addEventListener('touchmove', (e) => {
    e.preventDefault()
    // 如果是长按状态，取消滑动方向改变
    if (isLongPress) return
  }, { passive: false })

  document.addEventListener('touchend', (e) => {
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
      // 恢复到保存的正常速度
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
      return changeDirection(newDirection, direction)
    }
    return direction
  })
}

/**
 * 创建虚拟方向按钮
 * @param {Function} onDirectionChange - 方向改变时的回调函数
 * @returns {HTMLElement} 虚拟控制按钮容器
 * 实现细节：
 * 1. 创建虚拟方向按钮UI
 * 2. 添加触摸事件处理
 * 3. 确保按钮布局合理且易于操作
 */
export function createVirtualControls(onDirectionChange) {
  const controls = document.createElement('div')
  controls.className = 'virtual-controls'
  controls.innerHTML = `
    <button class="control-btn up-btn" data-direction="up">↑</button>
    <div class="horizontal-controls">
      <button class="control-btn left-btn" data-direction="left">←</button>
      <button class="control-btn right-btn" data-direction="right">→</button>
    </div>
    <button class="control-btn down-btn" data-direction="down">↓</button>
  `

  // 添加触摸事件监听
  controls.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('control-btn')) {
      e.preventDefault()
      const newDirection = e.target.dataset.direction
      onDirectionChange(changeDirection(newDirection, direction))
    }
  })

  return controls
}
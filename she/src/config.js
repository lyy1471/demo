// 游戏配置对象，包含所有游戏相关的参数设置
export const GAME_CONFIG = {
  // 检测是否为移动设备，用于适配移动端控制
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // 画布尺寸设置 - 定义游戏画面的大小
  canvasWidth: 600,    // 画布宽度（像素）
  canvasHeight: 400,   // 画布高度（像素）
  
  // 游戏网格大小 - 决定蛇身、食物和障碍物的大小
  // 较大的值会使游戏元素更大，较小的值会使游戏更精细
  gridSize: 20,
  
  // 蛇的初始长度 - 游戏开始时蛇的身体段数
  initialSnakeLength: 3,
  
  // 游戏速度相关设置
  initialGameSpeed: 200,       // 初始移动间隔(毫秒)，数值越小移动越快
  speedIncreaseInterval: 200,  // 每得多少分增加一次速度
  speedIncreaseAmount: 2,      // 每次提速减少的毫秒数
  minGameSpeed: 120,          // 最快速度限制，防止游戏难度过高
  
  // 游戏模式设置
  wallPassEnabled: false,      // 是否启用穿墙模式 - true允许穿墙，false撞墙死亡
  gameMode: 'default',        // 游戏模式：'default'(默认模式) 或 'levels'(闯关模式)
  totalLevels: 50,           // 闯关模式的总关卡数
  currentLevel: 1,           // 当前关卡编号
  
  // 移动端长按加速配置 - 针对触屏设备的特殊控制
  touchSpeedBoost: {
    enabled: true,            // 是否启用长按加速功能
    boostSpeed: 100,         // 加速时的移动间隔(毫秒)
    minTouchDuration: 200    // 触发加速的最小按住时间（毫秒）
  },
  
  // 闯关模式配置 - 定义每个关卡的难度递增规则
  levelConfig: {
    obstacleIncrease: 1,     // 每关增加的障碍物数量
    baseObstacles: 3,        // 第一关的基础障碍物数量
    maxObstacles: 15,        // 最大障碍物数量上限
    speedDecrease: 2,        // 每关减少的速度值(ms)，增加难度
    targetScore: 100,        // 每关通关所需基础分数
    scoreIncrease: 50        // 每关增加的目标分数
  },
  
  // 蛇身颜色配置 - 定义蛇身的渐变色彩和发光效果
  snakeColors: [
    { color: '#FF69B4', glow: '#FFB6C1' },  // 粉色主体（蛇头）
    { color: '#FF1493', glow: '#FF69B4' },  // 深粉过渡（蛇身）
    { color: '#FFB6C1', glow: '#FFC0CB' }   // 浅粉尾部（蛇尾）
  ],
  
  // 食物类型配置 - 定义不同食物的属性和出现概率
  foodTypes: [
    { type: 'normal', color: '#FF5252', glow: '#FF867F', points: 10, probability: 0.5 },   // 普通食物
    { type: 'speed', color: '#2196F3', glow: '#64B5F6', points: 20, probability: 0.15 },     // 加速食物
    { type: 'bonus', color: '#FFC107', glow: '#FFD54F', points: 30, probability: 0.15 },     // 奖励食物
    { type: 'slow', color: '#9C27B0', glow: '#BA68C8', points: 15, probability: 0.1, speedModifier: 1.5 },   // 减速食物
    { type: 'double', color: '#E91E63', glow: '#F06292', points: 25, probability: 0.1 }      // 双倍分数食物
  ],
  
  // 加速模式配置
  boostSpeed: 50,            // 加速时的移动间隔（毫秒）
  normalSpeed: null          // 用于临时存储正常速度
}
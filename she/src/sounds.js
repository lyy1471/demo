// 音效管理器
class SoundManager {
  constructor() {
    // 预留音效配置，后续可以添加实际的音频文件
    this.sounds = {}
  }

  // 加载音效
  loadSound(name, url) {
    if (!name || !url) {
      console.warn('加载音效失败：无效的音效名称或URL')
      return
    }
    try {
      this.sounds[name] = new Audio(url)
    } catch (error) {
      console.warn(`加载音效 ${name} 失败：`, error.message)
    }
  }

  // 播放音效
  playSound(name) {
    if (!this.sounds[name]) {
      return
    }
    
    try {
      this.sounds[name].currentTime = 0
      this.sounds[name].play()
    } catch (error) {
      // 只在开发环境下输出详细错误信息
      if (process.env.NODE_ENV === 'development') {
        console.warn(`播放音效 ${name} 失败：`, error.message)
      }
    }
  }
}

// 导出音效管理器实例
export const soundManager = new SoundManager()
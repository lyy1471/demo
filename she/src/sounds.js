// 音效管理器
class SoundManager {
  constructor() {
    // 预留音效配置，后续可以添加实际的音频文件
    this.sounds = {}
  }

  // 加载音效
  loadSound(name, url) {
    this.sounds[name] = new Audio(url)
  }

  // 播放音效
  playSound(name) {
    // 暂时不播放音效，等待后续添加实际的音频文件
    if (this.sounds[name]) {
      this.sounds[name].currentTime = 0
      this.sounds[name].play().catch(error => {
        console.log(`播放音效 ${name} 失败:`, error)
      })
    }
  }
}

// 导出音效管理器实例
export const soundManager = new SoundManager()
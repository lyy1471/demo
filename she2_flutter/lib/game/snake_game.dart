import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

enum GameMode {
  normal,
  challenge
}

enum Direction {
  up,
  down,
  left,
  right
}

class SnakeGame extends ChangeNotifier {
  late List<Point<int>> snake;
  late Point<int> food;
  late Direction direction;
  late bool isGameOver;
  Timer? timer = null;
  late int score;
  late GameMode gameMode;
  late int currentLevel;
  late List<Point<int>> obstacles;
  bool isAccelerating = false;
  
  // 游戏配置
  final int gridSize = 20;
  final int initialSpeed = 300; // 毫秒
  final int acceleratedSpeed = 100; // 加速时的速度（毫秒）
  
  SnakeGame() {
    initGame(GameMode.normal);
  }

  void initGame(GameMode mode) {
    gameMode = mode;
    snake = [
      Point(gridSize ~/ 2, gridSize ~/ 2),
      Point(gridSize ~/ 2 - 1, gridSize ~/ 2),
      Point(gridSize ~/ 2 - 2, gridSize ~/ 2),
    ];
    direction = Direction.right;
    isGameOver = false;
    score = 0;
    currentLevel = 1;
    obstacles = [];
    
    if (mode == GameMode.challenge) {
      generateObstacles();
    }
    
    generateFood();
    startGame();
  }

  void startGame() {
    if (!isGameOver) {
      timer?.cancel();
      timer = Timer.periodic(
        Duration(milliseconds: getSpeed()),
        (timer) => move(),
      );
    }
  }

  int getSpeed() {
    if (isAccelerating) {
      return acceleratedSpeed;
    }
    if (gameMode == GameMode.normal) {
      return max(initialSpeed - (score ~/ 5) * 10, 100);
    } else {
      return max(initialSpeed - (currentLevel - 1) * 5, 80);
    }
  }

  void setAccelerating(bool accelerating) {
    if (isAccelerating != accelerating) {
      isAccelerating = accelerating;
      startGame(); // 重新开始计时器以更新速度
    }
  }

  void generateFood() {
    final random = Random();
    Point<int> newFood;
    do {
      newFood = Point(
        random.nextInt(gridSize),
        random.nextInt(gridSize),
      );
    } while (snake.contains(newFood) || obstacles.contains(newFood));
    food = newFood;
  }

  void generateObstacles() {
    obstacles.clear();
    final random = Random();
    final obstacleCount = min(currentLevel * 2, 20);
    
    for (var i = 0; i < obstacleCount; i++) {
      Point<int> obstacle;
      do {
        obstacle = Point(
          random.nextInt(gridSize),
          random.nextInt(gridSize),
        );
      } while (
        snake.contains(obstacle) ||
        food == obstacle ||
        obstacles.contains(obstacle)
      );
      obstacles.add(obstacle);
    }
  }

  void move() {
    if (isGameOver) return;

    final head = snake.first;
    Point<int> newHead;

    switch (direction) {
      case Direction.up:
        newHead = Point(head.x, (head.y - 1) % gridSize);
        break;
      case Direction.down:
        newHead = Point(head.x, (head.y + 1) % gridSize);
        break;
      case Direction.left:
        newHead = Point((head.x - 1) % gridSize, head.y);
        break;
      case Direction.right:
        newHead = Point((head.x + 1) % gridSize, head.y);
        break;
    }

    if (newHead.x < 0) newHead = Point(gridSize - 1, newHead.y);
    if (newHead.y < 0) newHead = Point(newHead.x, gridSize - 1);

    if (snake.contains(newHead) || obstacles.contains(newHead)) {
      gameOver();
      return;
    }

    snake.insert(0, newHead);

    if (newHead == food) {
      score += 10;
      if (gameMode == GameMode.challenge && score >= currentLevel * 50) {
        nextLevel();
      } else {
        generateFood();
      }
    } else {
      snake.removeLast();
    }

    notifyListeners();
  }

  void nextLevel() {
    if (currentLevel < 50) {
      currentLevel++;
      generateObstacles();
      generateFood();
      startGame();
    } else {
      gameOver();
    }
  }

  void changeDirection(Direction newDirection) {
    if ((direction == Direction.up && newDirection == Direction.down) ||
        (direction == Direction.down && newDirection == Direction.up) ||
        (direction == Direction.left && newDirection == Direction.right) ||
        (direction == Direction.right && newDirection == Direction.left)) {
      return;
    }
    direction = newDirection;
  }

  void gameOver() {
    isGameOver = true;
    timer?.cancel();
    notifyListeners();
  }

  void pauseGame() {
    timer?.cancel();
    timer = null;
    notifyListeners();
  }

  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  bool get isInitialized => snake != null && food != null;
}
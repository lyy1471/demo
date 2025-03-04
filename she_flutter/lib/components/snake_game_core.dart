import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

enum Direction { up, down, left, right }

class SnakeGameCore extends StatefulWidget {
  final bool hasWalls;
  final int level;
  final Function(int)? onScoreUpdate;
  
  const SnakeGameCore({
    super.key,
    this.hasWalls = true,
    this.level = 1,
    this.onScoreUpdate,
  });

  @override
  State<SnakeGameCore> createState() => _SnakeGameCoreState();
}

class _SnakeGameCoreState extends State<SnakeGameCore> {
  static const squareSize = 20.0;
  static const gridSize = 20;
  
  late List<Offset> snake;
  late Offset food;
  late Direction direction;
  late Timer gameTimer;
  int score = 0;
  bool isGameOver = false;

  @override
  void initState() {
    super.initState();
    initGame();
  }

  void initGame() {
    snake = [
      Offset(gridSize / 2, gridSize / 2),
    ];
    direction = Direction.right;
    generateFood();
    startGame();
  }

  void startGame() {
    const duration = Duration(milliseconds: 200);
    gameTimer = Timer.periodic(duration, (Timer timer) {
      moveSnake();
    });
  }

  void generateFood() {
    final random = Random();
    double x, y;
    do {
      x = random.nextInt(gridSize).toDouble();
      y = random.nextInt(gridSize).toDouble();
    } while (snake.contains(Offset(x, y)));
    food = Offset(x, y);
  }

  void moveSnake() {
    setState(() {
      // 计算新的头部位置
      final head = snake.first;
      Offset newHead;
      
      switch (direction) {
        case Direction.up:
          newHead = Offset(head.dx, head.dy - 1);
          break;
        case Direction.down:
          newHead = Offset(head.dx, head.dy + 1);
          break;
        case Direction.left:
          newHead = Offset(head.dx - 1, head.dy);
          break;
        case Direction.right:
          newHead = Offset(head.dx + 1, head.dy);
          break;
      }

      // 检查是否撞墙
      if (widget.hasWalls) {
        if (newHead.dx < 0 || newHead.dx >= gridSize ||
            newHead.dy < 0 || newHead.dy >= gridSize) {
          gameOver();
          return;
        }
      } else {
        // 无墙模式：从另一边出现
        newHead = Offset(
          (newHead.dx + gridSize) % gridSize,
          (newHead.dy + gridSize) % gridSize,
        );
      }

      // 检查是否吃到食物
      if (newHead == food) {
        snake.insert(0, newHead);
        generateFood();
        score += 10;
        widget.onScoreUpdate?.call(score);
      } else {
        snake.insert(0, newHead);
        snake.removeLast();
      }

      // 检查是否撞到自己
      if (snake.sublist(1).contains(snake.first)) {
        gameOver();
      }
    });
  }

  void gameOver() {
    gameTimer.cancel();
    isGameOver = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('游戏结束'),
        content: Text('得分: $score'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                isGameOver = false;
                score = 0;
                initGame();
              });
            },
            child: const Text('重新开始'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragUpdate: (details) {
        if (direction != Direction.up && details.delta.dy > 0) {
          direction = Direction.down;
        } else if (direction != Direction.down && details.delta.dy < 0) {
          direction = Direction.up;
        }
      },
      onHorizontalDragUpdate: (details) {
        if (direction != Direction.left && details.delta.dx > 0) {
          direction = Direction.right;
        } else if (direction != Direction.right && details.delta.dx < 0) {
          direction = Direction.left;
        }
      },
      child: CustomPaint(
        painter: SnakeGamePainter(
          snake: snake,
          food: food,
          squareSize: squareSize,
          gridSize: gridSize,
          hasWalls: widget.hasWalls,
        ),
        size: Size(
          gridSize * squareSize,
          gridSize * squareSize,
        ),
      ),
    );
  }

  @override
  void dispose() {
    gameTimer.cancel();
    super.dispose();
  }
}

class SnakeGamePainter extends CustomPainter {
  final List<Offset> snake;
  final Offset food;
  final double squareSize;
  final int gridSize;
  final bool hasWalls;

  SnakeGamePainter({
    required this.snake,
    required this.food,
    required this.squareSize,
    required this.gridSize,
    required this.hasWalls,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 绘制背景
    final bgPaint = Paint()
      ..color = Colors.green[100]!;
    canvas.drawRect(Offset.zero & size, bgPaint);

    // 绘制网格
    final gridPaint = Paint()
      ..color = Colors.green[200]!
      ..style = PaintingStyle.stroke;

    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        canvas.drawRect(
          Rect.fromLTWH(
            i * squareSize,
            j * squareSize,
            squareSize,
            squareSize,
          ),
          gridPaint,
        );
      }
    }

    // 绘制墙壁
    if (hasWalls) {
      final wallPaint = Paint()
        ..color = Colors.brown
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4.0;

      canvas.drawRect(Offset.zero & size, wallPaint);
    }

    // 绘制食物
    final foodPaint = Paint()
      ..color = Colors.red;
    canvas.drawCircle(
      Offset(
        food.dx * squareSize + squareSize / 2,
        food.dy * squareSize + squareSize / 2,
      ),
      squareSize / 2,
      foodPaint,
    );

    // 绘制蛇
    for (var i = 0; i < snake.length; i++) {
      final snakePart = snake[i];
      final snakePaint = Paint()
        ..color = i == 0 ? Colors.green[800]! : Colors.green[600]!;

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            snakePart.dx * squareSize,
            snakePart.dy * squareSize,
            squareSize,
            squareSize,
          ),
          const Radius.circular(5),
        ),
        snakePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
} 
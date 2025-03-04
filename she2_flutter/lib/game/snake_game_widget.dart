import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'snake_game.dart';
import 'menu_snake.dart';

class SnakeGameWidget extends StatefulWidget {
  const SnakeGameWidget({super.key});

  @override
  State<SnakeGameWidget> createState() => _SnakeGameWidgetState();
}

class _SnakeGameWidgetState extends State<SnakeGameWidget> {
  late SnakeGame game;
  bool showMenu = true;

  @override
  void initState() {
    super.initState();
    game = SnakeGame();
    game.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    game.dispose();
    super.dispose();
  }

  void onKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      switch (event.logicalKey) {
        case LogicalKeyboardKey.arrowUp:
          game.changeDirection(Direction.up);
          break;
        case LogicalKeyboardKey.arrowDown:
          game.changeDirection(Direction.down);
          break;
        case LogicalKeyboardKey.arrowLeft:
          game.changeDirection(Direction.left);
          break;
        case LogicalKeyboardKey.arrowRight:
          game.changeDirection(Direction.right);
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragUpdate: (details) {
        if (details.delta.dy < -10) {
          game.changeDirection(Direction.up);
        } else if (details.delta.dy > 10) {
          game.changeDirection(Direction.down);
        }
      },
      onHorizontalDragUpdate: (details) {
        if (details.delta.dx < -10) {
          game.changeDirection(Direction.left);
        } else if (details.delta.dx > 10) {
          game.changeDirection(Direction.right);
        }
      },
      onLongPressStart: (_) => game.setAccelerating(true),
      onLongPressEnd: (_) => game.setAccelerating(false),
      child: KeyboardListener(
        focusNode: FocusNode(),
        autofocus: true,
        onKeyEvent: onKeyEvent,
        child: Scaffold(
        backgroundColor: Colors.grey[200],
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (showMenu) ...[_buildMenu()] else ...[_buildGame()],
            ],
          ),
        ),
      ),
    ),
    );
  }

  Widget _buildMenu() {
    return Stack(
      children: [
        const MenuSnake(),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '贪吃蛇',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.deepPurple,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 30),
          _buildMenuButton(
            '普通模式',
            () {
              game.initGame(GameMode.normal);
              setState(() => showMenu = false);
            },
          ),
          const SizedBox(height: 15),
          _buildMenuButton(
            '闯关模式',
            () {
              game.initGame(GameMode.challenge);
              setState(() => showMenu = false);
            },
          ),
        ],
      ),
    ),
      ],
    );
  }

  Widget _buildMenuButton(String text, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.deepPurple,
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 18, color: Colors.white),
      ),
    );
  }

  Widget _buildGame() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildGameInfo(),
        const SizedBox(height: 20),
        _buildGameBoard(),
        const SizedBox(height: 20),
        _buildControls(),
      ],
    );
  }

  Widget _buildGameInfo() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '分数: ${game.score}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          if (game.gameMode == GameMode.challenge) ...[
            const SizedBox(width: 20),
            Text(
              '关卡: ${game.currentLevel}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGameBoard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: AspectRatio(
        aspectRatio: 1,
        child: CustomPaint(
          painter: SnakeGamePainter(
            game: game,
            gridSize: game.gridSize,
          ),
        ),
      ),
    );
  }

  Widget _buildControls() {
    if (game.isGameOver) {
      return Column(
        children: [
          Text(
            '游戏结束',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildControlButton(
                '重新开始',
                () => game.initGame(game.gameMode),
              ),
              const SizedBox(width: 20),
              _buildControlButton(
                '返回菜单',
                () => setState(() => showMenu = true),
              ),
            ],
          ),
        ],
      );
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (game.timer != null) ...[
          _buildControlButton(
            '暂停',
            () {
              game.pauseGame();
              setState(() {});
            },
          ),
        ] else ...[
          _buildControlButton(
            '继续',
            () {
              if (!game.isGameOver) {
                game.startGame();
                setState(() {});
              }
            },
          ),
        ],
        const SizedBox(width: 20),
        _buildControlButton(
          '返回菜单',
          () {
            game.timer?.cancel();
            setState(() => showMenu = true);
          },
        ),
      ],
    );
  }

  Widget _buildControlButton(String text, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 3,
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }
}

class SnakeGamePainter extends CustomPainter {
  final SnakeGame game;
  final int gridSize;
  final double cellPadding = 1.0;

  SnakeGamePainter({required this.game, required this.gridSize});

  @override
  void paint(Canvas canvas, Size size) {
    final cellSize = size.width / gridSize;

    // 绘制网格背景
    final bgPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Colors.grey[50]!,
          Colors.grey[100]!,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Offset.zero & size, bgPaint);

    // 绘制障碍物
    final obstaclePaint = Paint()
      ..color = Colors.pink[100]!
      ..style = PaintingStyle.fill
      ..strokeWidth = 2.0;
    for (var obstacle in game.obstacles) {
      // 绘制可爱的心形障碍物
      final path = Path();
      final centerX = obstacle.x * cellSize + cellSize / 2;
      final centerY = obstacle.y * cellSize + cellSize / 2;
      final size = cellSize * 0.4;

      path.moveTo(centerX, centerY + size * 0.25);
      path.cubicTo(
        centerX - size, centerY - size * 0.5,
        centerX - size, centerY - size * 1.5,
        centerX, centerY - size * 0.5
      );
      path.cubicTo(
        centerX + size, centerY - size * 1.5,
        centerX + size, centerY - size * 0.5,
        centerX, centerY + size * 0.25
      );

      canvas.drawPath(path, obstaclePaint);
    }

    // 绘制食物
    final foodPaint = Paint()
      ..color = Colors.pink[300]!
      ..style = PaintingStyle.fill;

    // 绘制可爱的星形食物
    final foodCenter = Offset(
      game.food.x * cellSize + cellSize / 2,
      game.food.y * cellSize + cellSize / 2,
    );
    final foodSize = cellSize * 0.4;
    final foodPath = Path();
    for (var i = 0; i < 5; i++) {
      final angle = -pi / 2 + 2 * pi * i / 5;
      final point = Offset(
        foodCenter.dx + cos(angle) * foodSize,
        foodCenter.dy + sin(angle) * foodSize,
      );
      if (i == 0) {
        foodPath.moveTo(point.dx, point.dy);
      } else {
        foodPath.lineTo(point.dx, point.dy);
      }
      final innerAngle = angle + pi / 5;
      final innerPoint = Offset(
        foodCenter.dx + cos(innerAngle) * (foodSize * 0.4),
        foodCenter.dy + sin(innerAngle) * (foodSize * 0.4),
      );
      foodPath.lineTo(innerPoint.dx, innerPoint.dy);
    }
    foodPath.close();
    canvas.drawPath(foodPath, foodPaint);

    // 绘制蛇身
    for (var i = 1; i < game.snake.length; i++) {
      final point = game.snake[i];
      final colorIntensity = (i / game.snake.length) * 100;
      final snakeGradient = LinearGradient(
        colors: [
          Colors.pink[max(100, 300 - (i * 20))]!,
          Colors.pink[max(50, 200 - (i * 15))]!,
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      
      final snakeBodyPaint = Paint()
        ..shader = snakeGradient.createShader(
          Rect.fromLTWH(
            point.x * cellSize,
            point.y * cellSize,
            cellSize,
            cellSize,
          ),
        )
        ..style = PaintingStyle.fill;

      // 绘制身体主体
      canvas.drawCircle(
        Offset(
          point.x * cellSize + cellSize / 2,
          point.y * cellSize + cellSize / 2,
        ),
        cellSize / 2 - cellPadding,
        snakeBodyPaint,
      );

      // 添加高光效果
      final highlightPaint = Paint()
        ..color = Colors.white.withOpacity(0.3)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(
        Offset(
          point.x * cellSize + cellSize * 0.35,
          point.y * cellSize + cellSize * 0.35,
        ),
        cellSize / 6,
        highlightPaint,
      );
    }

    // 绘制蛇头
    final head = game.snake.first;
    final headGradient = LinearGradient(
      colors: [
        Colors.pink[300]!,
        Colors.pink[200]!,
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    final snakeHeadPaint = Paint()
      ..shader = headGradient.createShader(
        Rect.fromLTWH(
          head.x * cellSize,
          head.y * cellSize,
          cellSize,
          cellSize,
        ),
      )
      ..style = PaintingStyle.fill;

    // 绘制头部主体
    canvas.drawCircle(
      Offset(
        head.x * cellSize + cellSize / 2,
        head.y * cellSize + cellSize / 2,
      ),
      cellSize / 2 - cellPadding,
      snakeHeadPaint,
    );

    // 添加头部高光
    final headHighlightPaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(
        head.x * cellSize + cellSize * 0.35,
        head.y * cellSize + cellSize * 0.35,
      ),
      cellSize / 5,
      headHighlightPaint,
    );

    // 绘制蛇眼睛
    final eyePaint = Paint()
      ..color = Colors.white;
    final eyeInnerPaint = Paint()
      ..color = Colors.black;
    final eyeSize = cellSize / 5;
    final eyeInnerSize = eyeSize / 2;
    final eyeOffset = cellSize / 3;

    void drawEyes(double x1, double y1, double x2, double y2) {
      canvas.drawCircle(
        Offset(head.x * cellSize + x1, head.y * cellSize + y1),
        eyeSize,
        eyePaint,
      );
      canvas.drawCircle(
        Offset(head.x * cellSize + x2, head.y * cellSize + y2),
        eyeSize,
        eyePaint,
      );
    }

    switch (game.direction) {
      case Direction.right:
        drawEyes(cellSize - eyeOffset, eyeOffset, cellSize - eyeOffset, cellSize - eyeOffset);
        break;
      case Direction.left:
        drawEyes(eyeOffset, eyeOffset, eyeOffset, cellSize - eyeOffset);
        break;
      case Direction.up:
        drawEyes(eyeOffset, eyeOffset, cellSize - eyeOffset, eyeOffset);
        break;
      case Direction.down:
        drawEyes(eyeOffset, cellSize - eyeOffset, cellSize - eyeOffset, cellSize - eyeOffset);
        break;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
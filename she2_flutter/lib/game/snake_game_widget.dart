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
          backgroundColor: const Color(0xFF1A1A2E),
          body: Stack(
            children: [
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFF1A1A2E),
                        Colors.indigo[900]!,
                      ],
                    ),
                  ),
                ),
              ),
              const MenuSnake(),
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (showMenu) ...[
                      _buildMenu(),
                    ] else ...[
                      _buildGame(),
                    ],
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenu() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.indigo[400]!,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo[700]!.withOpacity(0.3),
            blurRadius: 15,
            spreadRadius: 5,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildAnimatedSnakeFace(),
                const SizedBox(width: 20),
                _buildAnimatedSnakeFace(),
                const SizedBox(width: 20),
                _buildAnimatedSnakeFace(),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            '贪吃蛇',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: Colors.indigo[100],
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(
                  color: Colors.indigo[400]!,
                  blurRadius: 10,
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          _buildMenuButton('普通模式', () {
            game.initGame(GameMode.normal);
            setState(() => showMenu = false);
          }),
          const SizedBox(height: 15),
          _buildMenuButton('闯关模式', () {
            game.initGame(GameMode.challenge);
            setState(() => showMenu = false);
          }),
        ],
      ),
    );
  }

  Widget _buildAnimatedSnakeFace() {
    return AnimatedBuilder(
      animation: const AlwaysStoppedAnimation(0),
      builder: (context, child) {
        return CustomPaint(
          size: const Size(80, 80),
          painter: SnakeFacePainter(
            currentTime: DateTime.now(),
          ),
        );
      },
    );
  }

  Widget _buildMenuButton(String text, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.indigo[700],
        foregroundColor: Colors.indigo[100],
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: BorderSide(
            color: Colors.indigo[400]!,
            width: 2,
          ),
        ),
        elevation: 8,
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 18,
          color: Colors.indigo[100],
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(
              color: Colors.indigo[900]!,
              blurRadius: 5,
            ),
          ],
        ),
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
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: Colors.indigo[400]!,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo[700]!.withOpacity(0.3),
            blurRadius: 5,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildInfoItem(
            icon: Icons.star,
            label: '分数',
            value: '${game.score}',
            textColor: Colors.indigo[100]!,
          ),
          if (game.gameMode == GameMode.challenge) ...[
            const SizedBox(width: 20),
            _buildInfoItem(
              icon: Icons.flag,
              label: '关卡',
              value: '${game.currentLevel}',
            ),
            const SizedBox(width: 20),
            _buildInfoItem(
              icon: Icons.arrow_circle_up,
              label: '过关分数',
              value: '${game.currentLevel * 50}',
              valueColor: game.score >= game.currentLevel * 50 ? Colors.green : null,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
    Color? textColor,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.deepPurple,
        ),
        const SizedBox(width: 8),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: valueColor,
              ),
            ),
          ],
        ),
      ],
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
        child: AnimatedBuilder(
          animation: const AlwaysStoppedAnimation(0),
          builder: (context, child) {
            return CustomPaint(
              painter: SnakeGamePainter(
                game: game,
                gridSize: game.gridSize,
                currentTime: DateTime.now(),
              ),
            );
          },
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
              color: Colors.red[300],
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(
                  color: Colors.red[700]!,
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
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
        backgroundColor: Colors.indigo[700],
        foregroundColor: Colors.indigo[100],
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: Colors.indigo[400]!,
            width: 2,
          ),
        ),
        elevation: 8,
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
          color: Colors.indigo[100],
          shadows: [
            Shadow(
              color: Colors.black,
              blurRadius: 3,
            ),
          ],
        ),
      ),
    );
  }
}

class SnakeGamePainter extends CustomPainter {
  final SnakeGame game;
  final int gridSize;
  final double cellPadding = 1.0;
  final double animationValue;

  SnakeGamePainter({
    required this.game, 
    required this.gridSize,
    DateTime? currentTime,
  }) : animationValue = sin((currentTime ?? DateTime.now()).millisecondsSinceEpoch / 500) * 0.05;

  @override
  void paint(Canvas canvas, Size size) {
    final cellSize = size.width / gridSize;

    // 修改网格背景为深色
    final bgPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFF1A1A2E).withOpacity(0.7),
          Colors.indigo[900]!.withOpacity(0.7),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Offset.zero & size, bgPaint);

    // 添加网格线
    final gridPaint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    for (var i = 0; i <= gridSize; i++) {
      canvas.drawLine(
        Offset(i * cellSize, 0),
        Offset(i * cellSize, size.height),
        gridPaint,
      );
      canvas.drawLine(
        Offset(0, i * cellSize),
        Offset(size.width, i * cellSize),
        gridPaint,
      );
    }

    // 检查游戏状态
    if (!game.isInitialized) return;

    // 绘制食物 (苹果样式)
    if (game.food != null) {
      final foodCenter = Offset(
        game.food!.x * cellSize + cellSize / 2,
        game.food!.y * cellSize + cellSize / 2 + animationValue * cellSize,
      );

      // 绘制苹果主体
      final applePaint = Paint()
        ..color = Colors.red
        ..style = PaintingStyle.fill;

      final appleSize = cellSize * 0.7;

      // 绘制苹果身体
      final applePath = Path()
        ..moveTo(foodCenter.dx, foodCenter.dy - appleSize / 2)
        ..quadraticBezierTo(foodCenter.dx + appleSize / 2, foodCenter.dy - appleSize / 2, foodCenter.dx + appleSize / 2, foodCenter.dy)
        ..quadraticBezierTo(foodCenter.dx + appleSize / 2, foodCenter.dy + appleSize / 2, foodCenter.dx, foodCenter.dy + appleSize / 2)
        ..quadraticBezierTo(foodCenter.dx - appleSize / 2, foodCenter.dy + appleSize / 2, foodCenter.dx - appleSize / 2, foodCenter.dy)
        ..quadraticBezierTo(
            foodCenter.dx - appleSize / 2, foodCenter.dy - appleSize / 2, foodCenter.dx, foodCenter.dy - appleSize / 2);

      canvas.drawPath(applePath, applePaint);

      // 添加食物发光效果
      final glowPaint = Paint()
        ..maskFilter = const MaskFilter.blur(BlurStyle.outer, 3)
        ..color = Colors.red[300]!.withOpacity(0.5);
      
      canvas.drawCircle(
        foodCenter,
        appleSize * 0.6,
        glowPaint,
      );

      // 绘制苹果茎
      final stemPaint = Paint()
        ..color = Colors.brown
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke;

      canvas.drawLine(
          Offset(foodCenter.dx, foodCenter.dy - appleSize / 2), Offset(foodCenter.dx, foodCenter.dy - appleSize / 2 - 5), stemPaint);
    }

    // 绘制障碍物 (岩石样式)
    for (var obstacle in game.obstacles) {
      if (obstacle != null) {
        final centerX = obstacle.x * cellSize + cellSize / 2;
        final centerY = obstacle.y * cellSize + cellSize / 2;
        
        final rockPaint = Paint()
          ..shader = RadialGradient(
            colors: [
              Colors.grey[400]!,
              Colors.grey[600]!,
            ],
          ).createShader(Rect.fromCircle(
            center: Offset(centerX, centerY),
            radius: cellSize / 2,
          ));
        
        // 使用固定形状而不是随机形状
        final rockPath = Path();
        final radius = cellSize * 0.4;
        final points = 8;
        
        // 使用固定的variance值而不是随机值
        for (var i = 0; i < points; i++) {
          final angle = (i * 2 * pi / points) - pi / 2;
          // 为每个顶点使用固定的不规则值
          final variance = 0.9 + (i % 3) * 0.1;
          final x = centerX + cos(angle) * radius * variance;
          final y = centerY + sin(angle) * radius * variance;
          
          if (i == 0) {
            rockPath.moveTo(x, y);
          } else {
            rockPath.lineTo(x, y);
          }
        }
        rockPath.close();
        canvas.drawPath(rockPath, rockPaint);
      }
    }
    

    // 绘制蛇身
    if (game.snake != null && game.snake.isNotEmpty) {
      for (var i = 1; i < game.snake.length; i++) {
        final point = game.snake[i];
        if (point != null) {
          final snakeBodyPaint = Paint()
            ..shader = RadialGradient(
              colors: [
                Colors.lightGreenAccent[400]!,
                Colors.green[600]!,
              ],
              center: Alignment.topLeft,
            ).createShader(Rect.fromCircle(
              center: Offset(
                point.x * cellSize + cellSize / 2,
                point.y * cellSize + cellSize / 2,
              ),
              radius: cellSize / 2,
            ));

          // 绘制圆形身体段
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
              point.x * cellSize + cellSize * 0.3,
              point.y * cellSize + cellSize * 0.3,
            ),
            cellSize / 6,
            highlightPaint,
          );
        }
      }

      // 绘制蛇头
      final head = game.snake.first;
      if (head != null) {
        final headCenter = Offset(
          head.x * cellSize + cellSize / 2,
          head.y * cellSize + cellSize / 2,
        );

        // 绘制头部主体
        final headPaint = Paint()
          ..shader = RadialGradient(
            colors: [
              Colors.lightGreenAccent[400]!,
              Colors.green[700]!,
            ],
          ).createShader(Rect.fromCircle(
            center: headCenter,
            radius: cellSize / 2,
          ));

        canvas.drawCircle(
          headCenter,
          cellSize / 2 - cellPadding,
          headPaint,
        );

        // 绘制眼睛
        final eyePaint = Paint()..color = Colors.white;
        final eyeInnerPaint = Paint()..color = Colors.black;

        void drawEyes(double x1, double y1, double x2, double y2) {
          // 外圈白色
          canvas.drawCircle(
            Offset(headCenter.dx + x1, headCenter.dy + y1),
            cellSize * 0.15,
            eyePaint,
          );
          canvas.drawCircle(
            Offset(headCenter.dx + x2, headCenter.dy + y2),
            cellSize * 0.15,
            eyePaint,
          );

          // 内圈黑色
          canvas.drawCircle(
            Offset(headCenter.dx + x1, headCenter.dy + y1),
            cellSize * 0.08,
            eyeInnerPaint,
          );
          canvas.drawCircle(
            Offset(headCenter.dx + x2, headCenter.dy + y2),
            cellSize * 0.08,
            eyeInnerPaint,
          );
        }

        // 根据方向调整眼睛位置
        final eyeOffset = cellSize * 0.2;
        switch (game.direction) {
          case Direction.right:
            drawEyes(eyeOffset, -eyeOffset, eyeOffset, eyeOffset);
            break;
          case Direction.left:
            drawEyes(-eyeOffset, -eyeOffset, -eyeOffset, eyeOffset);
            break;
          case Direction.up:
            drawEyes(-eyeOffset, -eyeOffset, eyeOffset, -eyeOffset);
            break;
          case Direction.down:
            drawEyes(-eyeOffset, eyeOffset, eyeOffset, eyeOffset);
            break;
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class SnakeFacePainter extends CustomPainter {
  final DateTime currentTime;
  final double blinkValue;
  final double tongueValue;

  SnakeFacePainter({
    required this.currentTime,
  }) : blinkValue = sin(currentTime.millisecondsSinceEpoch / 2000) * 0.5 + 0.5,
       tongueValue = sin(currentTime.millisecondsSinceEpoch / 1000) * 0.5 + 0.5;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    
    // 绘制蛇头
    final headPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.green[400]!,
          Colors.green[700]!,
        ],
      ).createShader(Rect.fromCircle(
        center: center,
        radius: size.width / 2,
      ));
    
    canvas.drawCircle(center, size.width / 2, headPaint);
    
    // 绘制眼睛
    final eyeSize = size.width * 0.2;
    final eyeOffset = size.width * 0.15;
    
    // 眼白
    final eyePaint = Paint()..color = Colors.white;
    canvas.drawCircle(
      Offset(center.dx - eyeOffset, center.dy - eyeOffset),
      eyeSize * (1 - blinkValue * 0.8),
      eyePaint,
    );
    canvas.drawCircle(
      Offset(center.dx + eyeOffset, center.dy - eyeOffset),
      eyeSize * (1 - blinkValue * 0.8),
      eyePaint,
    );
    
    // 瞳孔
    final pupilPaint = Paint()..color = Colors.black;
    canvas.drawCircle(
      Offset(center.dx - eyeOffset, center.dy - eyeOffset),
      eyeSize * 0.5 * (1 - blinkValue * 0.8),
      pupilPaint,
    );
    canvas.drawCircle(
      Offset(center.dx + eyeOffset, center.dy - eyeOffset),
      eyeSize * 0.5 * (1 - blinkValue * 0.8),
      pupilPaint,
    );
    
    // 绘制舌头
    if (tongueValue > 0.5) {
      final tonguePaint = Paint()..color = Colors.red[400]!;
      final tongueLength = size.width * 0.3 * (tongueValue - 0.5) * 2;
      
      final tonguePath = Path()
        ..moveTo(center.dx, center.dy + size.height * 0.2)
        ..lineTo(center.dx - size.width * 0.1, center.dy + size.height * 0.2 + tongueLength)
        ..lineTo(center.dx, center.dy + size.height * 0.2 + tongueLength * 0.8)
        ..lineTo(center.dx + size.width * 0.1, center.dy + size.height * 0.2 + tongueLength)
        ..close();
      
      canvas.drawPath(tonguePath, tonguePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

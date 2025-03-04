import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class MenuSnake extends StatefulWidget {
  const MenuSnake({super.key});

  @override
  State<MenuSnake> createState() => _MenuSnakeState();
}

class _MenuSnakeState extends State<MenuSnake> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final random = Random();
  Offset targetPosition = Offset.zero;
  Offset currentPosition = Offset.zero;
  bool isFollowingTouch = false;
  Timer? randomMoveTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    currentPosition = Offset(
      random.nextDouble() * 300,
      random.nextDouble() * 300,
    );
    targetPosition = currentPosition;
    _startRandomMovement();
  }

  @override
  void dispose() {
    _controller.dispose();
    randomMoveTimer?.cancel();
    super.dispose();
  }

  void _startRandomMovement() {
    randomMoveTimer?.cancel();
    randomMoveTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!isFollowingTouch) {
        setState(() {
          targetPosition = Offset(
            random.nextDouble() * 300,
            random.nextDouble() * 300,
          );
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: (details) {
        isFollowingTouch = true;
        setState(() {
          targetPosition = details.localPosition;
        });
      },
      onPanUpdate: (details) {
        setState(() {
          targetPosition = details.localPosition;
        });
      },
      onPanEnd: (_) {
        isFollowingTouch = false;
      },
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          // 平滑移动蛇头
          currentPosition = Offset.lerp(
            currentPosition,
            targetPosition,
            0.05,
          )!;

          return CustomPaint(
            painter: MenuSnakePainter(
              position: currentPosition,
              progress: _controller.value,
            ),
            size: const Size(300, 300),
          );
        },
      ),
    );
  }
}

class MenuSnakePainter extends CustomPainter {
  final Offset position;
  final double progress;

  MenuSnakePainter({required this.position, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    // 绘制Q版蛇头
    final headSize = 30.0;
    
    // 头部主体
    final headPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.pink[300]!,
          Colors.pink[200]!,
        ],
        center: Alignment.topLeft,
        radius: 1.2,
      ).createShader(Rect.fromCircle(
        center: position,
        radius: headSize,
      ));
    canvas.drawCircle(position, headSize, headPaint);

    // 眼睛
    final eyeOffset = headSize * 0.3;
    final eyeSize = headSize * 0.25;
    final eyePaint = Paint()..color = Colors.white;
    final eyeInnerPaint = Paint()..color = Colors.black;
    
    // 左眼
    canvas.drawCircle(
      position + Offset(-eyeOffset, -eyeOffset),
      eyeSize,
      eyePaint,
    );
    canvas.drawCircle(
      position + Offset(-eyeOffset, -eyeOffset),
      eyeSize * 0.5,
      eyeInnerPaint,
    );

    // 右眼
    canvas.drawCircle(
      position + Offset(eyeOffset, -eyeOffset),
      eyeSize,
      eyePaint,
    );
    canvas.drawCircle(
      position + Offset(eyeOffset, -eyeOffset),
      eyeSize * 0.5,
      eyeInnerPaint,
    );

    // 舌头
    final tonguePaint = Paint()
      ..color = Colors.pink[100]!
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    final tongueLength = headSize * 0.4;
    final tongueWave = sin(progress * 2 * pi) * 5;
    
    final tongueStart = position + Offset(0, headSize * 0.3);
    final tongueEnd = tongueStart + Offset(tongueWave, tongueLength);
    final tongueControl = Offset(
      (tongueStart.dx + tongueEnd.dx) / 2,
      tongueStart.dy + tongueLength * 0.6,
    );

    final tonguePath = Path()
      ..moveTo(tongueStart.dx, tongueStart.dy)
      ..quadraticBezierTo(
        tongueControl.dx,
        tongueControl.dy,
        tongueEnd.dx,
        tongueEnd.dy,
      );

    canvas.drawPath(tonguePath, tonguePaint);
    }

  @override
  bool shouldRepaint(covariant MenuSnakePainter oldDelegate) =>
      progress != oldDelegate.progress;
}
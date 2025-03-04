import 'package:flutter/material.dart';
import '../components/snake_game_core.dart';

class ClassicMode extends StatelessWidget {
  const ClassicMode({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('普通模式'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SnakeGameCore(hasWalls: true),
          ],
        ),
      ),
    );
  }
} 
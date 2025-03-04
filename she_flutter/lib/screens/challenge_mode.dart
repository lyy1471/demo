import 'package:flutter/material.dart';
import '../components/snake_game_core.dart';

class ChallengeMode extends StatefulWidget {
  const ChallengeMode({super.key});

  @override
  State<ChallengeMode> createState() => _ChallengeModeState();
}

class _ChallengeModeState extends State<ChallengeMode> {
  int currentLevel = 1;
  int score = 0;

  void onScoreUpdate(int newScore) {
    setState(() {
      score = newScore;
      if (score >= currentLevel * 100 && currentLevel < 50) {
        currentLevel++;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('闯关模式 - 第$currentLevel关'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              '得分: $score',
              style: const TextStyle(fontSize: 24),
            ),
          ),
          Center(
            child: SnakeGameCore(
              hasWalls: false,
              level: currentLevel,
              onScoreUpdate: onScoreUpdate,
            ),
          ),
        ],
      ),
    );
  }
} 
import 'package:flutter/material.dart';

void main() {
  runApp(const GaboLiveApp());
}

class GaboLiveApp extends StatelessWidget {
  const GaboLiveApp({super.key});

  @override
  Widget build(BuildContext context) {
    const gold = Color(0xFFD6B15E);
    const purple = Color(0xFF8054C7);
    const background = Color(0xFF09080D);

    return MaterialApp(
      title: 'GABO LIVE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: background,
        colorScheme: ColorScheme.fromSeed(
          seedColor: gold,
          brightness: Brightness.dark,
          surface: const Color(0xFF15121C),
        ),
        fontFamily: 'Arial',
      ),
      home: const Directionality(
        textDirection: TextDirection.rtl,
        child: HomePage(),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0xFF21132D), Color(0xFF09080D), Color(0xFF09080D)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 900;
              return Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1200),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: wide ? 40 : 20,
                      vertical: 20,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(15),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFE8C978), Color(0xFF8A5BD0)],
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x558A5BD0),
                                    blurRadius: 24,
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Text(
                                  'G',
                                  style: TextStyle(
                                    color: Color(0xFF17101F),
                                    fontSize: 29,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Text(
                              'GABO LIVE',
                              style: TextStyle(
                                letterSpacing: 2,
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const Spacer(),
                            if (wide) ...[
                              _NavLabel(label: 'الرئيسية', selected: true),
                              _NavLabel(label: 'الغرف الصوتية'),
                              _NavLabel(label: 'الهدايا'),
                              _NavLabel(label: 'VIP'),
                            ],
                            const SizedBox(width: 12),
                            OutlinedButton(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFE8C978),
                                side: const BorderSide(color: Color(0xFF8B6B37)),
                              ),
                              child: const Text('تسجيل الدخول'),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 760),
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0x228A5BD0),
                                    borderRadius: BorderRadius.circular(30),
                                    border: Border.all(
                                      color: const Color(0x668A5BD0),
                                    ),
                                  ),
                                  child: const Text(
                                    'عالمك الصوتي يبدأ هنا',
                                    style: TextStyle(color: Color(0xFFE0C8FF)),
                                  ),
                                ),
                                const SizedBox(height: 25),
                                const Text(
                                  'اكتشف عالم GABO LIVE',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 42,
                                    height: 1.25,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 15),
                                const Text(
                                  'تواصل، شارك لحظاتك، وانضم إلى غرف صوتية تجمعك بأشخاص من كل مكان.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Color(0xFFB9B2C4),
                                    fontSize: 17,
                                    height: 1.8,
                                  ),
                                ),
                                const SizedBox(height: 30),
                                Wrap(
                                  alignment: WrapAlignment.center,
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: [
                                    FilledButton(
                                      onPressed: () {},
                                      style: FilledButton.styleFrom(
                                        backgroundColor: const Color(0xFFD6B15E),
                                        foregroundColor: const Color(0xFF1B1420),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 30,
                                          vertical: 17,
                                        ),
                                      ),
                                      child: const Text(
                                        'ابدأ الآن',
                                        style: TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    OutlinedButton(
                                      onPressed: () {},
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: Colors.white,
                                        side: const BorderSide(color: Color(0xFF665477)),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 26,
                                          vertical: 17,
                                        ),
                                      ),
                                      child: const Text('استكشف المنصة'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Spacer(),
                        const Center(
                          child: Text(
                            'GABO LIVE  •  تجربة اجتماعية بصوتك',
                            style: TextStyle(color: Color(0xFF777080), fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavLabel extends StatelessWidget {
  const _NavLabel({required this.label, this.selected = false});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 13),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? const Color(0xFFE8C978) : const Color(0xFFD0CAD8),
          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
}

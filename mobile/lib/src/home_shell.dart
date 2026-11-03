import 'package:flutter/material.dart';

class GaboHomeShell extends StatefulWidget {
  const GaboHomeShell({super.key});

  @override
  State<GaboHomeShell> createState() => _GaboHomeShellState();
}

class _GaboHomeShellState extends State<GaboHomeShell> {
  int selectedIndex = 0;

  static const _items = [
    _NavItem('الرئيسية', Icons.home_rounded),
    _NavItem('المنشورات', Icons.grid_view_rounded),
    _NavItem('الألعاب', Icons.sports_esports_rounded),
    _NavItem('الرسائل', Icons.chat_bubble_rounded),
    _NavItem('حسابي', Icons.person_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: selectedIndex,
            children: const [
              _MigrationPage(
                title: 'GABO LIVE',
                subtitle: 'عالمك الصوتي',
                icon: Icons.auto_awesome_rounded,
              ),
              _MigrationPage(
                title: 'المنشورات',
                subtitle: 'سيُنقل نظام المنشورات الحالي مع بياناته.',
                icon: Icons.grid_view_rounded,
              ),
              _MigrationPage(
                title: 'الألعاب',
                subtitle: 'سيُنقل نظام الألعاب بعد اكتمال ربط خدماته.',
                icon: Icons.sports_esports_rounded,
              ),
              _MigrationPage(
                title: 'الرسائل',
                subtitle: 'سيُنقل نظام المحادثات والرسائل الخاصة.',
                icon: Icons.chat_bubble_rounded,
              ),
              _MigrationPage(
                title: 'حسابي',
                subtitle: 'سيُنقل الملف الشخصي وإعداداته ومزاياه.',
                icon: Icons.person_rounded,
              ),
            ],
          ),
        ),
        bottomNavigationBar: DecoratedBox(
          decoration: const BoxDecoration(
            color: Color(0xFF11101B),
            border: Border(top: BorderSide(color: Color(0x332A2840))),
          ),
          child: NavigationBar(
            height: 68,
            backgroundColor: const Color(0xFF11101B),
            indicatorColor: const Color(0x332A2840),
            selectedIndex: selectedIndex,
            onDestinationSelected: (index) =>
                setState(() => selectedIndex = index),
            destinations: [
              for (final item in _items)
                NavigationDestination(
                  icon: Icon(item.icon, size: 21),
                  label: item.label,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem(this.label, this.icon);
  final String label;
  final IconData icon;
}

class _MigrationPage extends StatelessWidget {
  const _MigrationPage({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0, -0.45),
          radius: 1.15,
          colors: [Color(0xFF211735), Color(0xFF080810)],
        ),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 82,
                height: 82,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0x66D9B66C),
                    width: 1.4,
                  ),
                  color: const Color(0x33161626),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x337C3AED),
                      blurRadius: 32,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Icon(icon, color: const Color(0xFFD9B66C), size: 36),
              ),
              const SizedBox(height: 22),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFEAD39F),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.6,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 22),
              const Text(
                'نسخة Flutter قيد نقل المميزات',
                style: TextStyle(fontSize: 12, color: Colors.white38),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

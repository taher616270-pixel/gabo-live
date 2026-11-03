import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';

import 'src/app_bootstrap.dart';
import 'src/home_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bootstrapError = await initializeGaboFirebase();
  runApp(GaboLiveApp(bootstrapError: bootstrapError));
}

class GaboLiveApp extends StatelessWidget {
  const GaboLiveApp({super.key, this.bootstrapError});

  final Object? bootstrapError;

  @override
  Widget build(BuildContext context) {
    final base = ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF080810),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFFD9B66C),
        secondary: Color(0xFFA77BFF),
        surface: Color(0xFF161426),
      ),
      textTheme: GoogleFonts.tajawalTextTheme(ThemeData.dark().textTheme),
      useMaterial3: true,
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GABO LIVE',
      theme: base,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: bootstrapError == null
          ? const GaboHomeShell()
          : FirebaseSetupScreen(error: bootstrapError!),
    );
  }
}

class FirebaseSetupScreen extends StatelessWidget {
  const FirebaseSetupScreen({super.key, required this.error});
  final Object error;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('GABO LIVE',
                      style: TextStyle(
                          color: Color(0xFFD9B66C),
                          fontSize: 30,
                          fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  const Text('يلزم إكمال إعداد Firebase لهذا النظام الأساسي',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 17)),
                  const SizedBox(height: 12),
                  Text(error.toString(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.white54, fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
      );
}

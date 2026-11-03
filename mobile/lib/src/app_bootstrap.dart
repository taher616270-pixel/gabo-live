import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future<Object?> initializeGaboFirebase() async {
  try {
    if (Firebase.apps.isNotEmpty) return null;

    // FlutterFire CLI configuration is required for native builds.
    // Web can use the existing public Firebase web configuration via --dart-define.
    if (kIsWeb) {
      const apiKey = String.fromEnvironment('FIREBASE_API_KEY');
      const appId = String.fromEnvironment('FIREBASE_APP_ID');
      const messagingSenderId =
          String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
      const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
      const authDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN');
      const storageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');

      if (apiKey.isEmpty ||
          appId.isEmpty ||
          messagingSenderId.isEmpty ||
          projectId.isEmpty) {
        throw StateError(
          'Missing Firebase dart-defines. See mobile/README.md.',
        );
      }

      await Firebase.initializeApp(
        options: FirebaseOptions(
          apiKey: apiKey,
          appId: appId,
          messagingSenderId: messagingSenderId,
          projectId: projectId,
          authDomain: authDomain.isEmpty ? null : authDomain,
          storageBucket: storageBucket.isEmpty ? null : storageBucket,
        ),
      );
      return null;
    }

    // Native Android/iOS/macOS builds must be generated with FlutterFire CLI.
    await Firebase.initializeApp();
    return null;
  } catch (error) {
    return error;
  }
}

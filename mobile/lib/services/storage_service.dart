import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class StorageService {
  static const String _keyAccessToken = 'sw_access_token';
  static const String _keyRefreshToken = 'sw_refresh_token';
  static const String _keyUserJson = 'sw_user_profile';
  static const String _keyApiBaseUrl = 'sw_api_base_url';

  static String? _envApiBaseUrl;

  /// Loads `API_BASE_URL` from `mobile/.env` asset on app startup.
  static Future<void> loadEnv() async {
    try {
      final raw = await rootBundle.loadString('.env');
      for (final line in const LineSplitter().convert(raw)) {
        final trimmed = line.trim();
        if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
        final idx = trimmed.indexOf('=');
        if (idx <= 0) continue;
        final key = trimmed.substring(0, idx).trim();
        var value = trimmed.substring(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        if (key == 'API_BASE_URL' && value.isNotEmpty) {
          _envApiBaseUrl = value;
        }
      }
    } catch (_) {
      // Fallback to default if .env is not present
    }
  }

  static String get defaultApiBaseUrl {
    const dartDefineUrl = String.fromEnvironment('API_BASE_URL');
    final configured =
        dartDefineUrl.isNotEmpty ? dartDefineUrl : (_envApiBaseUrl ?? '');

    if (configured.isNotEmpty) {
      if (!kIsWeb &&
          defaultTargetPlatform == TargetPlatform.android &&
          configured.contains('localhost')) {
        return configured.replaceAll('localhost', '10.0.2.2');
      }
      return configured;
    }

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      // Standard Android Emulator loopback to host machine port 5001
      return 'http://10.0.2.2:5001/api';
    }
    return 'http://localhost:5001/api';
  }

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required UserModel user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAccessToken, accessToken);
    await prefs.setString(_keyRefreshToken, refreshToken);
    await prefs.setString(_keyUserJson, jsonEncode(user.toJson()));
  }

  Future<void> updateTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAccessToken, accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString(_keyRefreshToken, refreshToken);
    }
  }

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyRefreshToken);
  }

  Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyUserJson);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return UserModel.fromJson(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyAccessToken);
    await prefs.remove(_keyRefreshToken);
    await prefs.remove(_keyUserJson);
  }

  Future<String> getApiBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyApiBaseUrl) ?? defaultApiBaseUrl;
  }

  Future<void> setApiBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyApiBaseUrl, url.trim());
  }
}

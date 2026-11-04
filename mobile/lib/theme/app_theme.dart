import 'package:flutter/material.dart';

/// Municipal Public Works / Architectural Ledger Design Tokens
/// Matches the Web Frontend (`web/app/globals.css`) visual identity.
class CivicColors {
  static const Color canvas = Color(0xFFF4F4F0);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceSubtle = Color(0xFFEBEBE4);
  static const Color border = Color(0xFFDCDCD4);
  static const Color borderStrong = Color(0xFF111315);

  static const Color inkPrimary = Color(0xFF111315);
  static const Color inkSecondary = Color(0xFF4A4F55);
  static const Color inkMuted = Color(0xFF767C82);

  static const Color forestGreen = Color(0xFF1E4D2B);
  static const Color forestTint = Color(0xFFE8F0EA);

  // Status Semantic Tokens
  static const Color pendingText = Color(0xFF92400E);
  static const Color pendingBg = Color(0xFFFEF3C7);
  static const Color pendingBorder = Color(0xFFF59E0B);

  static const Color inProgressText = Color(0xFF1E40AF);
  static const Color inProgressBg = Color(0xFFDBEAFE);
  static const Color inProgressBorder = Color(0xFF3B82F6);

  static const Color completedText = Color(0xFF166534);
  static const Color completedBg = Color(0xFFDCFCE7);
  static const Color completedBorder = Color(0xFF22C55E);

  static const Color rejectedText = Color(0xFF991B1B);
  static const Color rejectedBg = Color(0xFFFEE2E2);
  static const Color rejectedBorder = Color(0xFFEF4444);

  // Waste Category Semantic Tokens
  static const Color organicText = Color(0xFF1E4D2B);
  static const Color organicBg = Color(0xFFE8F0EA);

  static const Color plasticText = Color(0xFF0C4A6E);
  static const Color plasticBg = Color(0xFFE0F2FE);

  static const Color paperText = Color(0xFF78350F);
  static const Color paperBg = Color(0xFFFEF3C7);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: CivicColors.canvas,
      primaryColor: CivicColors.forestGreen,
      colorScheme: const ColorScheme.light(
        primary: CivicColors.forestGreen,
        secondary: CivicColors.inkPrimary,
        surface: CivicColors.surface,
        error: CivicColors.rejectedText,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: CivicColors.inkPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CivicColors.surface,
        foregroundColor: CivicColors.inkPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: CivicColors.inkPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
        shape: Border(
          bottom: BorderSide(color: CivicColors.border, width: 1),
        ),
      ),
      cardTheme: CardThemeData(
        color: CivicColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(2),
          side: const BorderSide(color: CivicColors.border, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CivicColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        labelStyle: const TextStyle(
          color: CivicColors.inkSecondary,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        hintStyle: const TextStyle(
          color: CivicColors.inkMuted,
          fontSize: 13,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(color: CivicColors.border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(color: CivicColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(color: CivicColors.inkPrimary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(color: CivicColors.rejectedBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CivicColors.forestGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: CivicColors.inkPrimary,
          backgroundColor: CivicColors.surface,
          side: const BorderSide(color: CivicColors.border, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2),
          ),
          textStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: CivicColors.border,
        thickness: 1,
        space: 1,
      ),
    );
  }
}

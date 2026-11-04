import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    String label;
    Color bg;
    Color fg;
    Color border;

    switch (status) {
      case 'in_progress':
        label = 'DIPROSES';
        bg = CivicColors.inProgressBg;
        fg = CivicColors.inProgressText;
        border = CivicColors.inProgressBorder;
        break;
      case 'completed':
        label = 'SELESAI';
        bg = CivicColors.completedBg;
        fg = CivicColors.completedText;
        border = CivicColors.completedBorder;
        break;
      case 'rejected':
        label = 'DITOLAK';
        bg = CivicColors.rejectedBg;
        fg = CivicColors.rejectedText;
        border = CivicColors.rejectedBorder;
        break;
      case 'pending':
      default:
        label = 'MENUNGGU';
        bg = CivicColors.pendingBg;
        fg = CivicColors.pendingText;
        border = CivicColors.pendingBorder;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: border.withOpacity(0.45), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}

class WasteTypeBadge extends StatelessWidget {
  final String wasteType;
  final double? confidence;

  const WasteTypeBadge({
    super.key,
    required this.wasteType,
    this.confidence,
  });

  @override
  Widget build(BuildContext context) {
    String label;
    Color bg;
    Color fg;

    switch (wasteType.toLowerCase()) {
      case 'organic':
        label = 'ORGANIK';
        bg = CivicColors.organicBg;
        fg = CivicColors.organicText;
        break;
      case 'plastic':
        label = 'PLASTIK';
        bg = CivicColors.plasticBg;
        fg = CivicColors.plasticText;
        break;
      case 'paper':
        label = 'KERTAS';
        bg = CivicColors.paperBg;
        fg = CivicColors.paperText;
        break;
      default:
        label = 'BELUM DIKLASIFIKASI';
        bg = CivicColors.surfaceSubtle;
        fg = CivicColors.inkSecondary;
        break;
    }

    final confText = confidence != null
        ? ' · ${(confidence! * 100).toStringAsFixed(0)}%'
        : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: fg.withOpacity(0.28), width: 1),
      ),
      child: Text(
        '$label$confText',
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../models/report_model.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

class AiTelemetryCard extends StatelessWidget {
  final MlPredictionResult prediction;
  final String selectedCategory;
  final ValueChanged<String>? onOverrideCategory;

  const AiTelemetryCard({
    super.key,
    required this.prediction,
    required this.selectedCategory,
    this.onOverrideCategory,
  });

  @override
  Widget build(BuildContext context) {
    final entries = [
      MapEntry('organic', 'Organik (Biological)'),
      MapEntry('plastic', 'Plastik (PET / Kemasan)'),
      MapEntry('paper', 'Kertas & Kardus'),
    ];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: CivicColors.surface,
        borderRadius: BorderRadius.circular(2),
        border: Border.all(color: CivicColors.inkPrimary, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TELEMETRI KLASIFIKASI CNN (224x224)',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  color: CivicColors.inkPrimary,
                  letterSpacing: 0.4,
                ),
              ),
              WasteTypeBadge(
                wasteType: prediction.prediction,
                confidence: prediction.confidence,
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 10),

          // Probability distribution bars
          ...entries.map((entry) {
            final score = prediction.allPredictions[entry.key] ?? 0.0;
            final pct = (score * 100).clamp(0.0, 100.0);
            final isTop = prediction.prediction == entry.key;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        entry.value,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isTop ? FontWeight.w700 : FontWeight.w500,
                          color: isTop
                              ? CivicColors.inkPrimary
                              : CivicColors.inkSecondary,
                        ),
                      ),
                      Text(
                        '${pct.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                          fontWeight: isTop ? FontWeight.w700 : FontWeight.w500,
                          color: isTop
                              ? CivicColors.forestGreen
                              : CivicColors.inkMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(1),
                    child: LinearProgressIndicator(
                      value: score.clamp(0.0, 1.0),
                      minHeight: 6,
                      backgroundColor: CivicColors.surfaceSubtle,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isTop ? CivicColors.forestGreen : CivicColors.inkMuted,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),

          if (onOverrideCategory != null) ...[
            const SizedBox(height: 6),
            const Text(
              'Koreksi manual kategori (opsional jika diperlukan):',
              style: TextStyle(
                fontSize: 11,
                color: CivicColors.inkSecondary,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: ['organic', 'plastic', 'paper'].map((cat) {
                final isSelected = selectedCategory == cat;
                final label = cat == 'organic'
                    ? 'Organik'
                    : (cat == 'plastic' ? 'Plastik' : 'Kertas');
                return ChoiceChip(
                  label: Text(label),
                  selected: isSelected,
                  onSelected: (_) => onOverrideCategory!(cat),
                  selectedColor: CivicColors.forestTint,
                  backgroundColor: CivicColors.surface,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isSelected
                        ? CivicColors.forestGreen
                        : CivicColors.inkSecondary,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(2),
                    side: BorderSide(
                      color: isSelected
                          ? CivicColors.forestGreen
                          : CivicColors.border,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

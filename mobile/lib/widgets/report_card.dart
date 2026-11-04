import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/report_model.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

class ReportCard extends StatelessWidget {
  final ReportModel report;
  final String resolvedImageUrl;
  final VoidCallback onTap;

  const ReportCard({
    super.key,
    required this.report,
    required this.resolvedImageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('dd MMM yyyy · HH:mm').format(
      report.createdAt.toLocal(),
    );
    final shortCode = report.id.length >= 8
        ? report.id.substring(0, 8).toUpperCase()
        : report.id.toUpperCase();

    return InkWell(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: CivicColors.surface,
          borderRadius: BorderRadius.circular(2),
          border: Border.all(color: CivicColors.border, width: 1),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail Image
            Container(
              width: 78,
              height: 78,
              decoration: BoxDecoration(
                color: CivicColors.surfaceSubtle,
                borderRadius: BorderRadius.circular(2),
                border: Border.all(color: CivicColors.border, width: 1),
              ),
              clipBehavior: Clip.antiAlias,
              child: resolvedImageUrl.isNotEmpty
                  ? (resolvedImageUrl.startsWith('data:')
                      ? Image.memory(
                          UriData.parse(resolvedImageUrl).contentAsBytes(),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.image_not_supported_outlined,
                            color: CivicColors.inkMuted,
                            size: 24,
                          ),
                        )
                      : Image.network(
                          resolvedImageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.image_not_supported_outlined,
                            color: CivicColors.inkMuted,
                            size: 24,
                          ),
                        ))
                  : const Icon(
                      Icons.photo_camera_back_outlined,
                      color: CivicColors.inkMuted,
                      size: 24,
                    ),
            ),
            const SizedBox(width: 12),

            // Metadata & Badges
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '#$shortCode',
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                          color: CivicColors.inkMuted,
                        ),
                      ),
                      StatusBadge(status: report.status),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    report.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: CivicColors.inkPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    report.address ??
                        '${report.latitude.toStringAsFixed(4)}, ${report.longitude.toStringAsFixed(4)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: CivicColors.inkSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      WasteTypeBadge(
                        wasteType: report.wasteType,
                        confidence: report.aiConfidence,
                      ),
                      Text(
                        formattedDate,
                        style: const TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: CivicColors.inkMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

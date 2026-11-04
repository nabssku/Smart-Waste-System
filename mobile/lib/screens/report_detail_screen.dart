import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/report_model.dart';
import '../providers/report_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/status_badge.dart';

class ReportDetailScreen extends StatefulWidget {
  final String reportId;

  const ReportDetailScreen({super.key, required this.reportId});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportProvider>().fetchReportDetail(widget.reportId);
    });
  }

  Future<void> _openInGoogleMaps(double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _showEditDialog(ReportModel report) async {
    final titleCtrl = TextEditingController(text: report.title);
    final descCtrl = TextEditingController(text: report.description);
    final addrCtrl = TextEditingController(text: report.address ?? '');
    String wasteType = report.wasteType;

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: const Text(
            'Edit Laporan (Status Menunggu)',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Judul Laporan'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Deskripsi'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: addrCtrl,
                  decoration: const InputDecoration(labelText: 'Alamat'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: ['organic', 'plastic', 'paper'].contains(wasteType)
                      ? wasteType
                      : 'organic',
                  decoration:
                      const InputDecoration(labelText: 'Kategori Sampah'),
                  items: const [
                    DropdownMenuItem(value: 'organic', child: Text('Organik')),
                    DropdownMenuItem(value: 'plastic', child: Text('Plastik')),
                    DropdownMenuItem(value: 'paper', child: Text('Kertas')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setModalState(() => wasteType = val);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () async {
                final ok =
                    await context.read<ReportProvider>().updatePendingReport(
                          id: report.id,
                          title: titleCtrl.text,
                          description: descCtrl.text,
                          address: addrCtrl.text,
                          wasteType: wasteType,
                        );
                if (ctx.mounted) Navigator.pop(ctx, ok);
              },
              child: const Text('Simpan Perubahan'),
            ),
          ],
        ),
      ),
    );

    if (saved == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Laporan berhasil diperbarui.')),
      );
    }
  }

  Future<void> _confirmDelete(ReportModel report) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Hapus Laporan?',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'Laporan yang masih berstatus Menunggu dapat dibatalkan dan dihapus permanen.',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: CivicColors.rejectedText,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus Permanen'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final ok = await context
          .read<ReportProvider>()
          .deletePendingReport(report.id);
      if (ok && mounted) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();
    final report = provider.selectedReport;

    return Scaffold(
      appBar: AppBar(
        title: const Text('RINCIAN & PELACAKAN LAPORAN'),
        actions: [
          if (report != null && report.status == 'pending') ...[
            IconButton(
              onPressed: () => _showEditDialog(report),
              tooltip: 'Edit Laporan',
              icon: const Icon(Icons.edit_outlined, size: 20),
            ),
            IconButton(
              onPressed: () => _confirmDelete(report),
              tooltip: 'Hapus Laporan',
              icon: const Icon(
                Icons.delete_outline,
                size: 20,
                color: CivicColors.rejectedText,
              ),
            ),
          ],
        ],
      ),
      body: provider.isLoadingDetail || report == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => provider.fetchReportDetail(widget.reportId),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 1. Photo & Primary Header Ledger
                  Container(
                    decoration: BoxDecoration(
                      color: CivicColors.surface,
                      border: Border.all(color: CivicColors.border, width: 1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(
                          height: 220,
                          child: Builder(
                            builder: (_) {
                              final imgUrl = provider.apiService
                                  .resolveImageUrl(report.imageUrl);
                              if (imgUrl.startsWith('data:')) {
                                return Image.memory(
                                  UriData.parse(imgUrl).contentAsBytes(),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    color: CivicColors.surfaceSubtle,
                                    child: const Icon(
                                      Icons.broken_image_outlined,
                                      size: 42,
                                      color: CivicColors.inkMuted,
                                    ),
                                  ),
                                );
                              }
                              return Image.network(
                                imgUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: CivicColors.surfaceSubtle,
                                  child: const Icon(
                                    Icons.broken_image_outlined,
                                    size: 42,
                                    color: CivicColors.inkMuted,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'ID #${report.id.substring(0, 8).toUpperCase()}',
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
                              const SizedBox(height: 8),
                              Text(
                                report.title,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: CivicColors.inkPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  WasteTypeBadge(
                                    wasteType: report.wasteType,
                                    confidence: report.aiConfidence,
                                  ),
                                  Text(
                                    DateFormat('dd MMM yyyy · HH:mm')
                                        .format(report.createdAt.toLocal()),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                      color: CivicColors.inkMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Divider(),
                              const SizedBox(height: 12),
                              Text(
                                report.description,
                                style: const TextStyle(
                                  fontSize: 13,
                                  height: 1.5,
                                  color: CivicColors.inkPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 2. Admin Notes (if available)
                  if (report.adminNotes != null &&
                      report.adminNotes!.trim().isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: CivicColors.forestTint,
                        border: Border.all(
                          color: CivicColors.forestGreen.withOpacity(0.4),
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'CATATAN PETUGAS DINAS LINGKUNGAN HIDUP',
                            style: TextStyle(
                              fontSize: 10,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w700,
                              color: CivicColors.forestGreen,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            report.adminNotes!,
                            style: const TextStyle(
                              fontSize: 13,
                              color: CivicColors.inkPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // 3. Location & Embedded Map + Google Maps Launcher
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: CivicColors.surface,
                      border: Border.all(color: CivicColors.border, width: 1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'TITIK LOKASI GEOSPASIAL',
                              style: TextStyle(
                                fontSize: 11,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w700,
                                color: CivicColors.inkSecondary,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => _openInGoogleMaps(
                                report.latitude,
                                report.longitude,
                              ),
                              icon: const Icon(Icons.open_in_new, size: 15),
                              label: const Text(
                                'Buka Google Maps',
                                style: TextStyle(fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          report.address ?? 'Alamat tidak tersedia',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: CivicColors.inkPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'KOORDINAT: ${report.latitude.toStringAsFixed(6)}, ${report.longitude.toStringAsFixed(6)}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: CivicColors.inkMuted,
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 170,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: FlutterMap(
                              options: MapOptions(
                                initialCenter:
                                    LatLng(report.latitude, report.longitude),
                                initialZoom: 15,
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate:
                                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName: 'id.smartwaste.mobile',
                                ),
                                MarkerLayer(
                                  markers: [
                                    Marker(
                                      point: LatLng(
                                        report.latitude,
                                        report.longitude,
                                      ),
                                      width: 40,
                                      height: 40,
                                      child: const Icon(
                                        Icons.location_on,
                                        size: 36,
                                        color: CivicColors.forestGreen,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 4. Status Audit Timeline (`report_logs`)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: CivicColors.surface,
                      border: Border.all(color: CivicColors.border, width: 1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'LINIMASA RIWAYAT STATUS (AUDIT LOG)',
                          style: TextStyle(
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w700,
                            color: CivicColors.inkSecondary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (report.logs.isEmpty)
                          const Text(
                            'Laporan telah tercatat di sistem dan menunggu verifikasi petugas.',
                            style: TextStyle(
                              fontSize: 12,
                              color: CivicColors.inkSecondary,
                            ),
                          )
                        else
                          ...report.logs.map((log) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 4),
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: CivicColors.forestGreen,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            StatusBadge(status: log.newStatus),
                                            Text(
                                              DateFormat('dd MMM · HH:mm')
                                                  .format(
                                                      log.createdAt.toLocal()),
                                              style: const TextStyle(
                                                fontSize: 10,
                                                fontFamily: 'monospace',
                                                color: CivicColors.inkMuted,
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (log.notes != null &&
                                            log.notes!.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            log.notes!,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: CivicColors.inkPrimary,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

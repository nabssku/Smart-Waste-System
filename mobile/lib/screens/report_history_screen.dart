import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/report_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/report_card.dart';
import 'report_detail_screen.dart';

class ReportHistoryScreen extends StatefulWidget {
  const ReportHistoryScreen({super.key});

  @override
  State<ReportHistoryScreen> createState() => _ReportHistoryScreenState();
}

class _ReportHistoryScreenState extends State<ReportHistoryScreen> {
  final _searchController = TextEditingController();

  final List<MapEntry<String, String>> _statusOptions = const [
    MapEntry('all', 'Semua'),
    MapEntry('pending', 'Menunggu'),
    MapEntry('in_progress', 'Diproses'),
    MapEntry('completed', 'Selesai'),
    MapEntry('rejected', 'Ditolak'),
  ];

  final List<MapEntry<String, String>> _wasteOptions = const [
    MapEntry('all', 'Semua Kategori'),
    MapEntry('organic', 'Organik'),
    MapEntry('plastic', 'Plastik'),
    MapEntry('paper', 'Kertas'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportProvider>().fetchMyReports();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Filter & Search Control Bar
        Container(
          color: CivicColors.surface,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onSubmitted: (val) =>
                          provider.fetchMyReports(search: val),
                      decoration: InputDecoration(
                        hintText: 'Cari judul atau lokasi laporan...',
                        prefixIcon: const Icon(Icons.search, size: 18),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16),
                                onPressed: () {
                                  _searchController.clear();
                                  provider.fetchMyReports(search: '');
                                },
                              )
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  DropdownButtonHideUnderline(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: CivicColors.border),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: DropdownButton<String>(
                        value: provider.wasteTypeFilter,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: CivicColors.inkPrimary,
                        ),
                        items: _wasteOptions
                            .map(
                              (e) => DropdownMenuItem(
                                value: e.key,
                                child: Text(e.value),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          if (val != null) {
                            provider.fetchMyReports(wasteType: val);
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _statusOptions.map((item) {
                    final selected = provider.statusFilter == item.key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(item.value),
                        selected: selected,
                        onSelected: (_) =>
                            provider.fetchMyReports(status: item.key),
                        selectedColor: CivicColors.inkPrimary,
                        backgroundColor: CivicColors.canvas,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color:
                              selected ? Colors.white : CivicColors.inkSecondary,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(2),
                          side: BorderSide(
                            color: selected
                                ? CivicColors.inkPrimary
                                : CivicColors.border,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
        const Divider(),

        // Report List with Pull-to-Refresh
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => provider.fetchMyReports(),
            child: provider.isLoadingReports
                ? const Center(child: CircularProgressIndicator())
                : provider.reports.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(32),
                        children: const [
                          Icon(
                            Icons.inbox_outlined,
                            size: 42,
                            color: CivicColors.inkMuted,
                          ),
                          SizedBox(height: 10),
                          Text(
                            'Belum ada laporan yang sesuai dengan filter.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: CivicColors.inkSecondary,
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: provider.reports.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, index) {
                          final report = provider.reports[index];
                          final imgUrl = provider.apiService
                              .resolveImageUrl(report.imageUrl);
                          return ReportCard(
                            report: report,
                            resolvedImageUrl: imgUrl,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      ReportDetailScreen(reportId: report.id),
                                ),
                              );
                            },
                          );
                        },
                      ),
          ),
        ),
      ],
    );
  }
}

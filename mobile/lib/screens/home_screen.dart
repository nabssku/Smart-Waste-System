import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/report_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/report_card.dart';
import 'create_report_screen.dart';
import 'report_detail_screen.dart';
import 'report_history_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshAll();
    });
  }

  Future<void> _refreshAll() async {
    final reportProv = context.read<ReportProvider>();
    await Future.wait([
      reportProv.fetchDashboardStats(),
      reportProv.fetchMyReports(),
    ]);
  }

  Future<void> _openCreateReport() async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const CreateReportScreen()),
    );
    if (created == true && mounted) {
      _refreshAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final reportProv = context.watch<ReportProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _currentTab == 0
              ? 'BERANDA PELAPORAN WARGA'
              : (_currentTab == 1 ? 'RIWAYAT & STATUS LAPORAN' : 'PROFIL AKUN'),
        ),
        actions: [
          IconButton(
            onPressed: _refreshAll,
            tooltip: 'Muat Ulang Data',
            icon: const Icon(Icons.refresh, size: 20),
          ),
        ],
      ),
      body: Column(
        children: [
          // Offline Indicator Banner (PRD Section 5B Requirement)
          if (reportProv.isOffline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: CivicColors.pendingBg,
              child: const Row(
                children: [
                  Icon(
                    Icons.wifi_off_outlined,
                    size: 16,
                    color: CivicColors.pendingText,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Koneksi ke server terputus. Tarik ke bawah untuk mencoba lagi.',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: CivicColors.pendingText,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Expanded(
            child: IndexedStack(
              index: _currentTab,
              children: [
                _buildDashboardTab(auth, reportProv),
                const ReportHistoryScreen(),
                _buildProfileTab(auth, reportProv),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _currentTab == 0
          ? FloatingActionButton.extended(
              onPressed: _openCreateReport,
              backgroundColor: CivicColors.forestGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(2),
              ),
              icon: const Icon(Icons.add_a_photo_outlined, size: 18),
              label: const Text(
                'Buat Laporan',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: CivicColors.border, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTab,
          onTap: (idx) => setState(() => _currentTab = idx),
          backgroundColor: CivicColors.surface,
          selectedItemColor: CivicColors.forestGreen,
          unselectedItemColor: CivicColors.inkMuted,
          selectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              label: 'Beranda',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined),
              label: 'Riwayat',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardTab(AuthProvider auth, ReportProvider reportProv) {
    final stats = reportProv.stats;

    return RefreshIndicator(
      onRefresh: _refreshAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
        children: [
          // Welcome Ledger Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: CivicColors.surface,
              border: Border.all(color: CivicColors.border, width: 1),
              borderRadius: BorderRadius.circular(2),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PELAPOR TERDAFTAR',
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                          color: CivicColors.forestGreen,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        auth.user?.name ?? 'Warga Pelapor',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: CivicColors.inkPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        auth.user?.email ?? '',
                        style: const TextStyle(
                          fontSize: 12,
                          color: CivicColors.inkSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _openCreateReport,
                  icon: const Icon(Icons.camera_alt_outlined, size: 16),
                  label: const Text('Lapor'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // KPI Metrics Grid (2x2)
          Row(
            children: [
              Expanded(
                child: _buildKpiTile(
                  label: 'TOTAL LAPORAN',
                  value: stats.totalReports.toString(),
                  accent: CivicColors.inkPrimary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiTile(
                  label: 'MENUNGGU',
                  value: stats.pending.toString(),
                  accent: CivicColors.pendingText,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildKpiTile(
                  label: 'DIPROSES',
                  value: stats.inProgress.toString(),
                  accent: CivicColors.inProgressText,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiTile(
                  label: 'SELESAI',
                  value: stats.completed.toString(),
                  accent: CivicColors.completedText,
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Waste Composition Ledger
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
                  'KOMPOSISI KATEGORI SAMPAH (DETEKSI AI CNN)',
                  style: TextStyle(
                    fontSize: 10,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    color: CivicColors.inkSecondary,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildCategoryCount(
                        'Organik',
                        stats.organicCount,
                        CivicColors.organicText,
                        CivicColors.organicBg,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildCategoryCount(
                        'Plastik',
                        stats.plasticCount,
                        CivicColors.plasticText,
                        CivicColors.plasticBg,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildCategoryCount(
                        'Kertas',
                        stats.paperCount,
                        CivicColors.paperText,
                        CivicColors.paperBg,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Recent Reports Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'LAPORAN TERBARU SAYA',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  color: CivicColors.inkSecondary,
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _currentTab = 1),
                child: const Text(
                  'Lihat Semua →',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          if (reportProv.isLoadingStats && stats.recentReports.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (stats.recentReports.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: CivicColors.surface,
                border: Border.all(color: CivicColors.border),
                borderRadius: BorderRadius.circular(2),
              ),
              child: const Text(
                'Belum ada laporan. Ketuk tombol "Buat Laporan" untuk mengirim laporan pertama Anda.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: CivicColors.inkSecondary),
              ),
            )
          else
            ...stats.recentReports.map((report) {
              final imgUrl =
                  reportProv.apiService.resolveImageUrl(report.imageUrl);
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ReportCard(
                  report: report,
                  resolvedImageUrl: imgUrl,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ReportDetailScreen(reportId: report.id),
                      ),
                    );
                  },
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildKpiTile({
    required String label,
    required String value,
    required Color accent,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: CivicColors.surface,
        border: Border.all(color: CivicColors.border, width: 1),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: FontWeight.w700,
              color: CivicColors.inkMuted,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontFamily: 'monospace',
              fontWeight: FontWeight.w700,
              color: accent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCount(
    String label,
    int count,
    Color textColor,
    Color bgColor,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(2),
      ),
      child: Column(
        children: [
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 18,
              fontFamily: 'monospace',
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileTab(AuthProvider auth, ReportProvider reportProv) {
    final user = auth.user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: CivicColors.surface,
            border: Border.all(color: CivicColors.border),
            borderRadius: BorderRadius.circular(2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'IDENTITAS PENGGUNA',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  color: CivicColors.inkMuted,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                user?.name ?? '-',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: CivicColors.inkPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Email: ${user?.email ?? '-'}',
                style: const TextStyle(
                  fontSize: 13,
                  color: CivicColors.inkSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Telepon: ${user?.phone ?? 'Belum diatur'}',
                style: const TextStyle(
                  fontSize: 13,
                  color: CivicColors.inkSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Peran Sistem: ${(user?.role ?? 'user').toUpperCase()}',
                style: const TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  color: CivicColors.forestGreen,
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => auth.logout(),
                  icon: const Icon(
                    Icons.logout,
                    size: 18,
                    color: CivicColors.rejectedText,
                  ),
                  label: const Text(
                    'Keluar dari Sesi Akun',
                    style: TextStyle(color: CivicColors.rejectedText),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

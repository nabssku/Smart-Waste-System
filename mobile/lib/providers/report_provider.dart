import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/report_model.dart';
import '../services/api_service.dart';

class ReportProvider extends ChangeNotifier {
  final ApiService _apiService;

  UserDashboardStats _stats = const UserDashboardStats();
  List<ReportModel> _reports = [];
  ReportModel? _selectedReport;
  MlPredictionResult? _livePrediction;

  bool _isLoadingStats = false;
  bool _isLoadingReports = false;
  bool _isLoadingDetail = false;
  bool _isPredicting = false;
  bool _isSubmitting = false;
  bool _isOffline = false;
  String? _errorMessage;

  String _statusFilter = 'all';
  String _wasteTypeFilter = 'all';
  String _searchQuery = '';

  ReportProvider(this._apiService);

  ApiService get apiService => _apiService;
  UserDashboardStats get stats => _stats;
  List<ReportModel> get reports => _reports;
  ReportModel? get selectedReport => _selectedReport;
  MlPredictionResult? get livePrediction => _livePrediction;

  bool get isLoadingStats => _isLoadingStats;
  bool get isLoadingReports => _isLoadingReports;
  bool get isLoadingDetail => _isLoadingDetail;
  bool get isPredicting => _isPredicting;
  bool get isSubmitting => _isSubmitting;
  bool get isOffline => _isOffline;
  String? get errorMessage => _errorMessage;

  String get statusFilter => _statusFilter;
  String get wasteTypeFilter => _wasteTypeFilter;
  String get searchQuery => _searchQuery;

  Future<void> fetchDashboardStats() async {
    _isLoadingStats = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _stats = await _apiService.getMyStats();
      _isOffline = false;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal memuat ringkasan statistik.');
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingStats = false;
      notifyListeners();
    }
  }

  Future<void> fetchMyReports({
    String? status,
    String? wasteType,
    String? search,
  }) async {
    if (status != null) _statusFilter = status;
    if (wasteType != null) _wasteTypeFilter = wasteType;
    if (search != null) _searchQuery = search;

    _isLoadingReports = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _reports = await _apiService.getMyReports(
        status: _statusFilter,
        wasteType: _wasteTypeFilter,
        search: _searchQuery,
      );
      _isOffline = false;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal memuat daftar riwayat laporan.');
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingReports = false;
      notifyListeners();
    }
  }

  Future<ReportModel?> fetchReportDetail(String id) async {
    _isLoadingDetail = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedReport = await _apiService.getReportById(id);
      _isOffline = false;
      return _selectedReport;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal memuat detail laporan.');
      return null;
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
  }

  /// Sends captured/selected image to `POST /api/ml/predict` for live AI waste detection.
  Future<MlPredictionResult?> classifyWastePhoto({
    required Uint8List imageBytes,
    required String filename,
  }) async {
    _isPredicting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _livePrediction = await _apiService.predictWasteImage(
        imageBytes: imageBytes,
        filename: filename,
      );
      _isOffline = false;
      return _livePrediction;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal menjalankan deteksi AI pada foto.');
      return null;
    } finally {
      _isPredicting = false;
      notifyListeners();
    }
  }

  void clearPrediction() {
    _livePrediction = null;
    notifyListeners();
  }

  Future<ReportModel?> submitNewReport({
    required String title,
    required String description,
    required double latitude,
    required double longitude,
    String? address,
    String? wasteType,
    double? aiConfidence,
    required Uint8List imageBytes,
    required String filename,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _apiService.createReport(
        title: title,
        description: description,
        latitude: latitude,
        longitude: longitude,
        address: address,
        wasteType: wasteType,
        aiConfidence: aiConfidence,
        imageBytes: imageBytes,
        filename: filename,
      );
      _isOffline = false;
      await Future.wait([fetchDashboardStats(), fetchMyReports()]);
      return created;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal mengirim laporan sampah ke server.');
      return null;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> updatePendingReport({
    required String id,
    required String title,
    required String description,
    String? address,
    String? wasteType,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updated = await _apiService.updateReport(
        id: id,
        title: title,
        description: description,
        address: address,
        wasteType: wasteType,
      );
      _selectedReport = updated;
      await Future.wait([fetchDashboardStats(), fetchMyReports()]);
      return true;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal memperbarui laporan.');
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> deletePendingReport(String id) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _apiService.deleteReport(id);
      _reports.removeWhere((r) => r.id == id);
      await fetchDashboardStats();
      return true;
    } on DioException catch (e) {
      _handleDioError(e, 'Gagal menghapus laporan.');
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  void _handleDioError(DioException e, String fallback) {
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      _isOffline = true;
      _errorMessage =
          'Mode Offline / Server tidak terjangkau (${e.requestOptions.baseUrl}).';
      return;
    }
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      _errorMessage = (data['message'] ?? data['error'] ?? fallback).toString();
    } else {
      _errorMessage = fallback;
    }
  }
}

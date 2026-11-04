import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import '../models/report_model.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

class ApiService {
  final StorageService _storage = StorageService();
  late final Dio _dio;
  bool _isRefreshing = false;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: StorageService.defaultApiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final customBase = await _storage.getApiBaseUrl();
          options.baseUrl = customBase;

          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Automatic JWT Token Refresh on 401 Unauthorized
          if (error.response?.statusCode == 401 &&
              !_isRefreshing &&
              !error.requestOptions.path.contains('/auth/login') &&
              !error.requestOptions.path.contains('/auth/refresh')) {
            _isRefreshing = true;
            try {
              final refreshToken = await _storage.getRefreshToken();
              if (refreshToken != null && refreshToken.isNotEmpty) {
                final baseUrl = await _storage.getApiBaseUrl();
                final refreshDio = Dio(BaseOptions(baseUrl: baseUrl));
                final resp = await refreshDio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                final data = resp.data['data'] ?? resp.data;
                final newAccess = (data['accessToken'] ?? '').toString();
                final newRefresh = data['refreshToken']?.toString();

                if (newAccess.isNotEmpty) {
                  await _storage.updateTokens(
                    accessToken: newAccess,
                    refreshToken: newRefresh,
                  );
                  error.requestOptions.headers['Authorization'] =
                      'Bearer $newAccess';
                  _isRefreshing = false;
                  final retryResp = await _dio.fetch(error.requestOptions);
                  return handler.resolve(retryResp);
                }
              }
            } catch (_) {
              await _storage.clearSession();
            } finally {
              _isRefreshing = false;
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  /// Resolves relative `/uploads/...` image paths or `data:image/...` URIs.
  String resolveImageUrl(String rawUrl, {String? baseOverride}) {
    if (rawUrl.isEmpty) return '';
    if (rawUrl.startsWith('http://') ||
        rawUrl.startsWith('https://') ||
        rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    final apiBase = baseOverride ?? _dio.options.baseUrl;
    final serverOrigin = apiBase.replaceAll(RegExp(r'/api/?$'), '');
    final normalizedPath = rawUrl.startsWith('/') ? rawUrl : '/$rawUrl';
    return '$serverOrigin$normalizedPath';
  }

  // ===========================================================================
  // AUTH ENDPOINTS
  // ===========================================================================

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email.trim(), 'password': password},
    );
    final payload = response.data['data'] ?? response.data;
    final user = UserModel.fromJson(payload['user'] as Map<String, dynamic>);
    final accessToken = (payload['accessToken'] ?? '').toString();
    final refreshToken = (payload['refreshToken'] ?? '').toString();

    await _storage.saveSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: user,
    );

    return {'user': user, 'accessToken': accessToken};
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _dio.post(
      '/auth/register',
      data: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      },
    );
    final payload = response.data['data'] ?? response.data;
    final user = UserModel.fromJson(payload['user'] as Map<String, dynamic>);
    final accessToken = (payload['accessToken'] ?? '').toString();
    final refreshToken = (payload['refreshToken'] ?? '').toString();

    await _storage.saveSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: user,
    );

    return {'user': user, 'accessToken': accessToken};
  }

  Future<UserModel> getMe() async {
    final response = await _dio.get('/auth/me');
    final payload = response.data['data'] ?? response.data;
    final userMap = payload['user'] is Map<String, dynamic>
        ? payload['user'] as Map<String, dynamic>
        : payload as Map<String, dynamic>;
    return UserModel.fromJson(userMap);
  }

  // ===========================================================================
  // DASHBOARD & STATISTICS ENDPOINTS
  // ===========================================================================

  Future<UserDashboardStats> getMyStats() async {
    final response = await _dio.get('/stats/my');
    final payload = response.data['data'] ?? response.data;
    return UserDashboardStats.fromJson(payload as Map<String, dynamic>);
  }

  // ===========================================================================
  // MACHINE LEARNING INFERENCE ENDPOINT (`POST /api/ml/predict`)
  // ===========================================================================

  Future<MlPredictionResult> predictWasteImage({
    required Uint8List imageBytes,
    required String filename,
  }) async {
    final safeName = filename.isNotEmpty ? filename : 'waste_capture.jpg';
    final ext = safeName.split('.').last.toLowerCase();
    final subtype = ext == 'png' ? 'png' : (ext == 'webp' ? 'webp' : 'jpeg');

    final formData = FormData.fromMap({
      'image': MultipartFile.fromBytes(
        imageBytes,
        filename: safeName,
        contentType: MediaType('image', subtype),
      ),
    });

    final response = await _dio.post('/ml/predict', data: formData);
    return MlPredictionResult.fromJson(response.data as Map<String, dynamic>);
  }

  // ===========================================================================
  // WASTE REPORTS CRUD ENDPOINTS
  // ===========================================================================

  Future<List<ReportModel>> getMyReports({
    String? status,
    String? wasteType,
    String? search,
    int page = 1,
    int limit = 30,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null && status.isNotEmpty && status != 'all')
        'status': status,
      if (wasteType != null && wasteType.isNotEmpty && wasteType != 'all')
        'waste_type': wasteType,
      if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
    };

    final response = await _dio.get('/reports/my', queryParameters: query);
    final payload = response.data['data'];
    final rawList = payload is List
        ? payload
        : (payload is Map<String, dynamic> && payload['reports'] is List
            ? payload['reports'] as List
            : <dynamic>[]);

    return rawList
        .whereType<Map<String, dynamic>>()
        .map(ReportModel.fromJson)
        .toList();
  }

  Future<ReportModel> getReportById(String id) async {
    final response = await _dio.get('/reports/$id');
    final payload = response.data['data'] ?? response.data;
    final reportMap = payload['report'] is Map<String, dynamic>
        ? payload['report'] as Map<String, dynamic>
        : payload as Map<String, dynamic>;
    return ReportModel.fromJson(reportMap);
  }

  Future<ReportModel> createReport({
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
    final safeName = filename.isNotEmpty ? filename : 'waste_report.jpg';
    final ext = safeName.split('.').last.toLowerCase();
    final subtype = ext == 'png' ? 'png' : (ext == 'webp' ? 'webp' : 'jpeg');

    final formData = FormData.fromMap({
      'title': title.trim(),
      'description': description.trim(),
      'latitude': latitude.toString(),
      'longitude': longitude.toString(),
      if (address != null && address.trim().isNotEmpty)
        'address': address.trim(),
      if (wasteType != null && wasteType.isNotEmpty) 'waste_type': wasteType,
      if (aiConfidence != null) 'ai_confidence': aiConfidence.toString(),
      'image': MultipartFile.fromBytes(
        imageBytes,
        filename: safeName,
        contentType: MediaType('image', subtype),
      ),
    });

    final response = await _dio.post('/reports', data: formData);
    final payload = response.data['data'] ?? response.data;
    return ReportModel.fromJson(payload as Map<String, dynamic>);
  }

  Future<ReportModel> updateReport({
    required String id,
    required String title,
    required String description,
    String? address,
    String? wasteType,
  }) async {
    final response = await _dio.put(
      '/reports/$id',
      data: {
        'title': title.trim(),
        'description': description.trim(),
        if (address != null) 'address': address.trim(),
        if (wasteType != null) 'waste_type': wasteType,
      },
    );
    final payload = response.data['data'] ?? response.data;
    return ReportModel.fromJson(payload as Map<String, dynamic>);
  }

  Future<void> deleteReport(String id) async {
    await _dio.delete('/reports/$id');
  }
}

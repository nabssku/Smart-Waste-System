import 'user_model.dart';

class ReportLogModel {
  final String id;
  final String reportId;
  final String changedBy;
  final String oldStatus;
  final String newStatus;
  final String? notes;
  final DateTime createdAt;
  final UserModel? changer;

  const ReportLogModel({
    required this.id,
    required this.reportId,
    required this.changedBy,
    required this.oldStatus,
    required this.newStatus,
    this.notes,
    required this.createdAt,
    this.changer,
  });

  factory ReportLogModel.fromJson(Map<String, dynamic> json) {
    return ReportLogModel(
      id: (json['id'] ?? '').toString(),
      reportId: (json['reportId'] ?? json['report_id'] ?? '').toString(),
      changedBy: (json['changedBy'] ?? json['changed_by'] ?? '').toString(),
      oldStatus: (json['oldStatus'] ?? json['old_status'] ?? 'pending').toString(),
      newStatus: (json['newStatus'] ?? json['new_status'] ?? 'pending').toString(),
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(
            (json['createdAt'] ?? json['created_at'] ?? '').toString(),
          ) ??
          DateTime.now(),
      changer: json['changer'] is Map<String, dynamic>
          ? UserModel.fromJson(json['changer'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ReportModel {
  final String id;
  final String userId;
  final String title;
  final String description;
  final String imageUrl;
  final double latitude;
  final double longitude;
  final String? address;
  final String wasteType; // 'organic' | 'plastic' | 'paper' | 'unknown'
  final double? aiConfidence;
  final String status; // 'pending' | 'in_progress' | 'completed' | 'rejected'
  final String? adminNotes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final UserModel? user;
  final List<ReportLogModel> logs;

  const ReportModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.latitude,
    required this.longitude,
    this.address,
    required this.wasteType,
    this.aiConfidence,
    required this.status,
    this.adminNotes,
    required this.createdAt,
    required this.updatedAt,
    this.user,
    this.logs = const [],
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    final rawLogs = json['logs'] ?? json['reportLogs'] ?? json['report_logs'];
    final parsedLogs = <ReportLogModel>[];
    if (rawLogs is List) {
      for (final item in rawLogs) {
        if (item is Map<String, dynamic>) {
          parsedLogs.add(ReportLogModel.fromJson(item));
        }
      }
    }

    return ReportModel(
      id: (json['id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? json['image_url'] ?? '').toString(),
      latitude: double.tryParse((json['latitude'] ?? -6.2088).toString()) ?? -6.2088,
      longitude: double.tryParse((json['longitude'] ?? 106.8456).toString()) ?? 106.8456,
      address: json['address']?.toString(),
      wasteType: (json['wasteType'] ?? json['waste_type'] ?? 'unknown').toString(),
      aiConfidence: json['aiConfidence'] != null || json['ai_confidence'] != null
          ? double.tryParse((json['aiConfidence'] ?? json['ai_confidence']).toString())
          : null,
      status: (json['status'] ?? 'pending').toString(),
      adminNotes: (json['adminNotes'] ?? json['admin_notes'])?.toString(),
      createdAt: DateTime.tryParse(
            (json['createdAt'] ?? json['created_at'] ?? '').toString(),
          ) ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(
            (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
          ) ??
          DateTime.now(),
      user: json['user'] is Map<String, dynamic>
          ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      logs: parsedLogs,
    );
  }
}

class MlPredictionResult {
  final String prediction; // 'organic' | 'plastic' | 'paper'
  final double confidence;
  final Map<String, double> allPredictions;
  final String engine;

  const MlPredictionResult({
    required this.prediction,
    required this.confidence,
    required this.allPredictions,
    required this.engine,
  });

  factory MlPredictionResult.fromJson(Map<String, dynamic> json) {
    final payload = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;
    final rawAll = payload['all_predictions'] is Map<String, dynamic>
        ? payload['all_predictions'] as Map<String, dynamic>
        : <String, dynamic>{};

    return MlPredictionResult(
      prediction: (payload['prediction'] ?? 'unknown').toString(),
      confidence: double.tryParse((payload['confidence'] ?? 0.0).toString()) ?? 0.0,
      allPredictions: {
        'organic': double.tryParse((rawAll['organic'] ?? 0.0).toString()) ?? 0.0,
        'plastic': double.tryParse((rawAll['plastic'] ?? 0.0).toString()) ?? 0.0,
        'paper': double.tryParse((rawAll['paper'] ?? 0.0).toString()) ?? 0.0,
      },
      engine: (payload['engine'] ?? 'tensorflow-js-mobilenetv2').toString(),
    );
  }
}

class UserDashboardStats {
  final int totalReports;
  final int pending;
  final int inProgress;
  final int completed;
  final int rejected;
  final int organicCount;
  final int plasticCount;
  final int paperCount;
  final List<ReportModel> recentReports;

  const UserDashboardStats({
    this.totalReports = 0,
    this.pending = 0,
    this.inProgress = 0,
    this.completed = 0,
    this.rejected = 0,
    this.organicCount = 0,
    this.plasticCount = 0,
    this.paperCount = 0,
    this.recentReports = const [],
  });

  factory UserDashboardStats.fromJson(Map<String, dynamic> json) {
    final byStatus = json['byStatus'] is Map<String, dynamic>
        ? json['byStatus'] as Map<String, dynamic>
        : (json['by_status'] is Map<String, dynamic>
            ? json['by_status'] as Map<String, dynamic>
            : <String, dynamic>{});

    final byWaste = json['byWasteType'] is Map<String, dynamic>
        ? json['byWasteType'] as Map<String, dynamic>
        : (json['by_waste_type'] is Map<String, dynamic>
            ? json['by_waste_type'] as Map<String, dynamic>
            : <String, dynamic>{});

    final rawRecent = json['recentReports'] ?? json['recent_reports'];
    final parsedRecent = <ReportModel>[];
    if (rawRecent is List) {
      for (final r in rawRecent) {
        if (r is Map<String, dynamic>) {
          parsedRecent.add(ReportModel.fromJson(r));
        }
      }
    }

    return UserDashboardStats(
      totalReports: int.tryParse(
            (json['totalReports'] ?? json['total_reports'] ?? 0).toString(),
          ) ??
          0,
      pending: int.tryParse((byStatus['pending'] ?? 0).toString()) ?? 0,
      inProgress: int.tryParse((byStatus['in_progress'] ?? 0).toString()) ?? 0,
      completed: int.tryParse((byStatus['completed'] ?? 0).toString()) ?? 0,
      rejected: int.tryParse((byStatus['rejected'] ?? 0).toString()) ?? 0,
      organicCount: int.tryParse((byWaste['organic'] ?? 0).toString()) ?? 0,
      plasticCount: int.tryParse((byWaste['plastic'] ?? 0).toString()) ?? 0,
      paperCount: int.tryParse((byWaste['paper'] ?? 0).toString()) ?? 0,
      recentReports: parsedRecent,
    );
  }
}

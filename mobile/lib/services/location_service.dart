import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationResult {
  final double latitude;
  final double longitude;
  final String address;

  const LocationResult({
    required this.latitude,
    required this.longitude,
    required this.address,
  });
}

class LocationService {
  final Dio _geoDio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 8),
      headers: kIsWeb
          ? const <String, dynamic>{}
          : const <String, dynamic>{
              'User-Agent': 'SmartWasteMunicipalApp/1.0 (smartwaste.id)',
            },
    ),
  );

  /// Acquires current device GPS coordinates via Geolocator and performs
  /// reverse geocoding via OpenStreetMap Nominatim.
  Future<LocationResult> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Layanan GPS / Lokasi tidak aktif pada perangkat ini.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Izin akses lokasi ditolak oleh pengguna.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Izin lokasi ditolak permanen. Aktifkan izin lokasi di Pengaturan perangkat.',
      );
    }

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    final address = await reverseGeocode(
      position.latitude,
      position.longitude,
    );

    return LocationResult(
      latitude: position.latitude,
      longitude: position.longitude,
      address: address,
    );
  }

  /// Resolves a human-readable street address from (latitude, longitude).
  Future<String> reverseGeocode(double lat, double lng) async {
    try {
      final response = await _geoDio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'jsonv2',
          'lat': lat,
          'lon': lng,
          'accept-language': 'id',
        },
      );
      if (response.data is Map<String, dynamic>) {
        final displayName = response.data['display_name']?.toString();
        if (displayName != null && displayName.isNotEmpty) {
          return displayName;
        }
      }
    } catch (_) {
      // Fallback to formatted coordinate string if offline
    }
    return 'Koordinat Lapangan (${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)})';
  }
}

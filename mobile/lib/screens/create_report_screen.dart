import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/report_provider.dart';
import '../services/location_service.dart';
import '../theme/app_theme.dart';
import '../widgets/ai_telemetry_card.dart';
import '../widgets/status_badge.dart';

class CreateReportScreen extends StatefulWidget {
  const CreateReportScreen({super.key});

  @override
  State<CreateReportScreen> createState() => _CreateReportScreenState();
}

class _CreateReportScreenState extends State<CreateReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  final _imagePicker = ImagePicker();
  final _locationService = LocationService();
  final _mapController = MapController();

  Uint8List? _selectedImageBytes;
  String _selectedImageName = 'waste_capture.jpg';
  String _selectedWasteType = 'organic';
  double? _aiConfidence;
  double _latitude = -6.2088;
  double _longitude = 106.8456;
  bool _isFetchingLocation = false;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportProvider>().clearPrediction();
      _detectGpsLocation();
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1280,
        maxHeight: 1280,
        imageQuality: 88,
      );
      if (picked == null) return;

      final bytes = await picked.readAsBytes();
      final name = picked.name.isNotEmpty ? picked.name : 'waste_capture.jpg';
      setState(() {
        _selectedImageBytes = bytes;
        _selectedImageName = name;
      });

      if (!mounted) return;
      final provider = context.read<ReportProvider>();
      final prediction = await provider.classifyWastePhoto(
        imageBytes: bytes,
        filename: name,
      );
      if (prediction != null && mounted) {
        setState(() {
          _selectedWasteType = prediction.prediction;
          _aiConfidence = prediction.confidence;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e')),
      );
    }
  }

  Future<void> _detectGpsLocation() async {
    setState(() {
      _isFetchingLocation = true;
      _locationError = null;
    });

    try {
      final loc = await _locationService.getCurrentLocation();
      if (!mounted) return;
      setState(() {
        _latitude = loc.latitude;
        _longitude = loc.longitude;
        _addressController.text = loc.address;
      });
      _mapController.move(LatLng(_latitude, _longitude), 15);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locationError = e.toString().replaceFirst('Exception: ', '');
        if (_addressController.text.isEmpty) {
          _addressController.text =
              'Jl. Jend. Sudirman, Jakarta Pusat (Titik Default)';
        }
      });
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingLocation = false;
        });
      }
    }
  }

  Future<void> _onMapTap(TapPosition tapPosition, LatLng point) async {
    setState(() {
      _latitude = point.latitude;
      _longitude = point.longitude;
    });
    final addr = await _locationService.reverseGeocode(
      point.latitude,
      point.longitude,
    );
    if (mounted) {
      setState(() {
        _addressController.text = addr;
      });
    }
  }

  void _openPreviewSheet() {
    if (_selectedImageBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Silakan ambil atau pilih foto sampah terlebih dahulu.'),
        ),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: CivicColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'PRATINJAU LAPORAN SEBELUM DIKIRIM',
              style: TextStyle(
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: FontWeight.w700,
                color: CivicColors.forestGreen,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _titleController.text.trim(),
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: CivicColors.inkPrimary,
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: Image.memory(
                _selectedImageBytes!,
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text(
                  'Kategori Terdeteksi: ',
                  style: TextStyle(fontSize: 12, color: CivicColors.inkSecondary),
                ),
                WasteTypeBadge(
                  wasteType: _selectedWasteType,
                  confidence: _aiConfidence,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Lokasi: ${_addressController.text.trim()} (${_latitude.toStringAsFixed(5)}, ${_longitude.toStringAsFixed(5)})',
              style: const TextStyle(
                fontSize: 12,
                color: CivicColors.inkSecondary,
                fontFamily: 'monospace',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _descriptionController.text.trim(),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: CivicColors.inkPrimary),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Kembali Edit'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _submitReport();
                    },
                    child: const Text('Konfirmasi & Kirim'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitReport() async {
    if (_selectedImageBytes == null) return;
    final provider = context.read<ReportProvider>();

    final created = await provider.submitNewReport(
      title: _titleController.text,
      description: _descriptionController.text,
      latitude: _latitude,
      longitude: _longitude,
      address: _addressController.text,
      wasteType: _selectedWasteType,
      aiConfidence: _aiConfidence,
      imageBytes: _selectedImageBytes!,
      filename: _selectedImageName,
    );

    if (!mounted) return;
    if (created != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Laporan sampah berhasil dikirim!'),
          backgroundColor: CivicColors.forestGreen,
        ),
      );
      Navigator.pop(context, true);
    } else if (provider.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage!),
          backgroundColor: CivicColors.rejectedText,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('FORMULIR LAPORAN BARU'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Camera / Gallery Image Capture Section
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
                      const Text(
                        '1. DOKUMENTASI FOTO & DETEKSI AI CNN',
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                          color: CivicColors.inkSecondary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (_selectedImageBytes != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: Image.memory(
                            _selectedImageBytes!,
                            height: 210,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        )
                      else
                        Container(
                          height: 160,
                          decoration: BoxDecoration(
                            color: CivicColors.canvas,
                            border: Border.all(color: CivicColors.border),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.camera_alt_outlined,
                                size: 34,
                                color: CivicColors.inkMuted,
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Ambil foto dari Kamera atau pilih dari Galeri',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: CivicColors.inkSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _pickImage(ImageSource.camera),
                              icon: const Icon(Icons.photo_camera_outlined, size: 18),
                              label: const Text('Kamera'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _pickImage(ImageSource.gallery),
                              icon: const Icon(Icons.photo_library_outlined, size: 18),
                              label: const Text('Galeri'),
                            ),
                          ),
                        ],
                      ),
                      if (provider.isPredicting) ...[
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Menganalisis citra dengan model CNN 224x224...',
                              style: TextStyle(
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: CivicColors.inkSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (provider.livePrediction != null) ...[
                        const SizedBox(height: 12),
                        AiTelemetryCard(
                          prediction: provider.livePrediction!,
                          selectedCategory: _selectedWasteType,
                          onOverrideCategory: (cat) {
                            setState(() {
                              _selectedWasteType = cat;
                            });
                          },
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // 2. GPS & Interactive Map Pin Picker
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
                            '2. TITIK KOORDINAT GPS LAPANGAN',
                            style: TextStyle(
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w700,
                              color: CivicColors.inkSecondary,
                            ),
                          ),
                          TextButton.icon(
                            onPressed:
                                _isFetchingLocation ? null : _detectGpsLocation,
                            icon: const Icon(Icons.my_location, size: 16),
                            label: Text(
                              _isFetchingLocation ? 'Mencari GPS...' : 'Deteksi GPS',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      if (_locationError != null) ...[
                        Text(
                          _locationError!,
                          style: const TextStyle(
                            fontSize: 11,
                            color: CivicColors.pendingText,
                          ),
                        ),
                        const SizedBox(height: 6),
                      ],
                      SizedBox(
                        height: 180,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter: LatLng(_latitude, _longitude),
                              initialZoom: 14.5,
                              onTap: _onMapTap,
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
                                    point: LatLng(_latitude, _longitude),
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
                      const SizedBox(height: 8),
                      Text(
                        'LAT: ${_latitude.toStringAsFixed(6)} · LNG: ${_longitude.toStringAsFixed(6)} (Ketuk peta untuk geser pin)',
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: CivicColors.inkMuted,
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: _addressController,
                        decoration: const InputDecoration(
                          labelText: 'Alamat Lengkap / Patokan Lokasi',
                          hintText: 'Contoh: Depan Halte TransJakarta Dukuh Atas',
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // 3. Report Title & Description
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
                      const Text(
                        '3. RINCIAN LAPORAN TIMBULAN SAMPAH',
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w700,
                          color: CivicColors.inkSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          labelText: 'Judul Laporan',
                          hintText: 'Contoh: Tumpukan Botol Plastik di Trotoar',
                        ),
                        validator: (val) {
                          if (val == null || val.trim().length < 5) {
                            return 'Judul laporan minimal 5 karakter';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _descriptionController,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          labelText: 'Deskripsi Kondisi Lapangan',
                          hintText:
                              'Jelaskan perkiraan volume sampah, kondisi sekitar, atau akses kendaraan pengangkut...',
                        ),
                        validator: (val) {
                          if (val == null || val.trim().length < 10) {
                            return 'Deskripsi minimal 10 karakter';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                ElevatedButton.icon(
                  onPressed: provider.isSubmitting ? null : _openPreviewSheet,
                  icon: provider.isSubmitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.fact_check_outlined, size: 18),
                  label: Text(
                    provider.isSubmitting
                        ? 'Mengirim Laporan...'
                        : 'Pratinjau & Kirim Laporan',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Navigation,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import WasteMap from '@/components/WasteMap';
import { mlApi, reportsApi } from '@/lib/api';
import { MlPredictionResult, WasteType } from '@/lib/types';
import { WASTE_TYPE_CONFIG } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

const CITY_PRESETS = [
  { label: 'Jakarta Pusat', lat: -6.1754, lng: 106.8272, address: 'Gambir, Jakarta Pusat' },
  { label: 'Jakarta Selatan', lat: -6.2261, lng: 106.8583, address: 'Tebet, Jakarta Selatan' },
  { label: 'Bandung', lat: -6.9025, lng: 107.6188, address: 'Coblong, Kota Bandung' },
  { label: 'Surabaya', lat: -7.2575, lng: 112.7521, address: 'Genteng, Kota Surabaya' },
];

export default function CreateReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [aiResult, setAiResult] = useState<MlPredictionResult | null>(null);
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType>('plastic');

  const [latitude, setLatitude] = useState<number>(-6.2088);
  const [longitude, setLongitude] = useState<number>(106.8456);
  const [address, setAddress] = useState<string>('Jl. Jend. Sudirman, Jakarta Pusat');
  const [locatingGps, setLocatingGps] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const runAiClassification = async (file: File) => {
    try {
      setPredicting(true);
      const res = await mlApi.predictImage(file);
      setAiResult(res);
      if (res.prediction && res.prediction !== 'unknown') {
        setSelectedWasteType(res.prediction);
      }
      showToast(
        `Terdeteksi: ${WASTE_TYPE_CONFIG[res.prediction]?.label || res.prediction} (${Math.round(
          (res.confidence || 0.85) * 100
        )}%)`,
        'success'
      );
    } catch (err: any) {
      showToast(
        err.message || 'Klasifikasi citra akan dijalankan saat laporan dikirim.',
        'info'
      );
    } finally {
      setPredicting(false);
    }
  };

  const handleFileChange = (file?: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Format foto harus berupa JPG, PNG, atau WEBP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 5 MB.', 'error');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    runAiClassification(file);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch {
      // ignore offline reverse geocode failure
    }
  };

  const handleLocationPicked = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
    reverseGeocode(lat, lng);
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Browser tidak mendukung Geolocation GPS.', 'error');
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        reverseGeocode(lat, lng);
        setLocatingGps(false);
        showToast('Koordinat GPS diperbarui.', 'success');
      },
      () => {
        setLocatingGps(false);
        showToast('Gagal mengakses GPS. Klik langsung pada peta untuk memilih titik.', 'info');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      showToast('Unggah foto bukti sampah terlebih dahulu.', 'error');
      return;
    }

    if (title.trim().length < 3) {
      showToast('Judul laporan minimal 3 karakter.', 'error');
      return;
    }

    if (description.trim().length < 5) {
      showToast('Deskripsi minimal 5 karakter.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address', address.trim());
      formData.append('waste_type', selectedWasteType);
      if (aiResult?.confidence) {
        formData.append('ai_confidence', String(aiResult.confidence));
      }

      const created = await reportsApi.create(formData);
      showToast('Laporan sampah berhasil dikirim.', 'success');
      router.push(`/dashboard/reports/${created.id}`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim laporan sampah.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      role="user"
      title="Formulir Laporan Sampah"
      subtitle="Unggah dokumentasi foto untuk klasifikasi otomatis dan tentukan koordinat lokasi."
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Photo Upload, AI Classification Readout, Description */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCDCD4] pb-3">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Dokumentasi Foto & Klasifikasi Material
              </h2>
              {imageFile && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-[#111315] hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Ganti Foto
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange(e.dataTransfer.files?.[0]);
                }}
                className="border border-dashed border-[#8E8E86] hover:border-[#111315] bg-[#FAF9F6] p-10 text-center cursor-pointer transition-colors space-y-2.5"
              >
                <Camera className="w-6 h-6 text-[#111315] mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-[#111315]">
                    Pilih file foto atau seret gambar ke bidang ini
                  </p>
                  <p className="text-xs text-[#525860] mt-0.5">
                    Format JPG, PNG, atau WEBP (Maks. 5 MB). Citra akan dianalisis otomatis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-[#111315] h-64 sm:h-80 border border-[#DCDCD4] overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Pratinjau Sampah"
                    className="w-full h-full object-cover"
                  />
                  {predicting && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p className="text-xs font-mono">MENJALANKAN INFERENSI CITRA 224×224...</p>
                    </div>
                  )}
                </div>

                {/* Classification Result Ledger */}
                {aiResult && (
                  <div className="border border-[#DCDCD4] bg-[#FAF9F6]">
                    <div className="px-4 py-2.5 border-b border-[#DCDCD4] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#525860]">HASIL KLASIFIKASI MODEL</span>
                      <span className="font-semibold text-[#111315] tabular-nums">
                        KEYAKINAN: {Math.round((aiResult.confidence || 0.85) * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-[#DCDCD4]">
                      {(
                        [
                          { key: 'organic', label: 'Organik' },
                          { key: 'plastic', label: 'Plastik' },
                          { key: 'paper', label: 'Kertas' },
                        ] as const
                      ).map((cls) => {
                        const prob = aiResult.all_predictions?.[cls.key] ?? 0;
                        const pct = Math.round(prob * 100);
                        return (
                          <div key={cls.key} className="p-3">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#525860]">{cls.label}</span>
                              <span className="font-semibold text-[#111315] tabular-nums">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1 bg-[#DCDCD4] mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-[#111315]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category Selection */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-[#111315] mb-1.5">
                Kategori Material Sampah (Dapat dikoreksi manual bila perlu)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { type: 'organic' as WasteType, label: 'Organik' },
                    { type: 'plastic' as WasteType, label: 'Plastik' },
                    { type: 'paper' as WasteType, label: 'Kertas / Kardus' },
                  ] as const
                ).map((item) => {
                  const active = selectedWasteType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedWasteType(item.type)}
                      className={`p-2.5 rounded border text-left transition-colors ${
                        active
                          ? 'border-[#111315] bg-[#111315] text-white'
                          : 'border-[#DCDCD4] bg-white hover:bg-[#FAF9F6] text-[#111315]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{item.label}</div>
                      {aiResult?.prediction === item.type && (
                        <span
                          className={`text-[10px] font-mono block mt-0.5 ${
                            active ? 'text-[#A0A6AD]' : 'text-[#525860]'
                          }`}
                        >
                          Terdeteksi Model
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[#111315] border-b border-[#DCDCD4] pb-3">
              Rincian Laporan
            </h2>

            <div>
              <label className="block text-xs font-medium text-[#111315] mb-1">
                Judul Laporan
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Timbunan Sampah Plastik di Pinggir Jalan"
                className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#111315]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111315] mb-1">
                Deskripsi Kondisi & Patokan Lokasi
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan perkiraan volume sampah dan patokan lokasi agar petugas mudah menemukan titik..."
                className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-sm focus:outline-none focus:border-[#111315]"
              />
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Map & Coordinates */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCDCD4] pb-3">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Titik Koordinat Lokasi
              </h2>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={locatingGps}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DCDCD4] bg-[#FAF9F6] hover:bg-[#F4F4F0] text-xs font-medium text-[#111315]"
              >
                {locatingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Deteksi GPS
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setLatitude(preset.lat);
                    setLongitude(preset.lng);
                    setAddress(preset.address);
                  }}
                  className="px-2 py-1 rounded border border-[#DCDCD4] bg-[#FAF9F6] hover:bg-[#F4F4F0] text-[11px] text-[#525860]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <WasteMap
              latitude={latitude}
              longitude={longitude}
              zoom={15}
              interactive
              onLocationChange={handleLocationPicked}
              heightClass="h-64"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#525860] mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded border border-[#DCDCD4] bg-[#FAF9F6] font-mono text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#525860] mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded border border-[#DCDCD4] bg-[#FAF9F6] font-mono text-xs tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111315] mb-1">
                Alamat Lokasi
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nama jalan, kelurahan, atau patokan..."
                className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || predicting}
              className="w-full py-3 px-4 rounded bg-[#111315] hover:bg-[#272B30] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Mengirim Laporan...' : 'Kirim Laporan Sampah'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

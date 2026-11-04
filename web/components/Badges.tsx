import React from 'react';
import { ReportStatus, WasteType } from '@/lib/types';
import { STATUS_CONFIG, WASTE_TYPE_CONFIG, cn } from '@/lib/utils';

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: ReportStatus;
  size?: 'sm' | 'md';
}) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        cfg.badgeClass
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
}

export function WasteTypeBadge({
  type,
  confidence,
  showConfidence = false,
  size = 'md',
}: {
  type: WasteType;
  confidence?: number | null;
  showConfidence?: boolean;
  size?: 'sm' | 'md';
}) {
  const cfg = WASTE_TYPE_CONFIG[type] || WASTE_TYPE_CONFIG.unknown;

  const pct =
    confidence !== undefined && confidence !== null
      ? Math.round(confidence * 100)
      : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        cfg.badgeClass
      )}
    >
      <span>{cfg.shortLabel}</span>
      {showConfidence && pct !== null && (
        <span className="font-mono text-[10px] tabular-nums opacity-75 pl-1 border-l border-current/25">
          {pct}%
        </span>
      )}
    </span>
  );
}

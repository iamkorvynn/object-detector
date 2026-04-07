'use client';

import React from 'react';
import type { Stats } from './DetectorApp';

interface Props {
    stats: Stats;
}

const COUNT_LABELS: Record<string, string> = {
    coco: 'Objects', pose: 'Poses', hands: 'Hands', face: 'Faces',
};

export default function StatsBar({ stats }: Props) {
    const statusColor: Record<string, string> = {
        IDLE: 'var(--text-muted)',
        LOADING: 'var(--accent-amber)',
        READY: 'var(--accent-blue)',
        RUNNING: 'var(--accent-green)',
        STOPPED: 'var(--accent-amber)',
        ERROR: 'var(--accent-red)',
    };

    const fpsColor = stats.fps >= 20 ? 'var(--accent-green)' : stats.fps >= 10 ? 'var(--accent-amber)' : stats.fps > 0 ? 'var(--accent-red)' : 'var(--text-muted)';
    const countLabel = COUNT_LABELS[stats.mode] ?? 'Objects';

    return (
        <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <StatItem value={stats.fps > 0 ? String(stats.fps) : '—'} label="FPS" color={fpsColor} />
            <StatItem value={String(stats.count)} label={countLabel} color={stats.count > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <StatItem value={stats.inferenceMs > 0 ? `${stats.inferenceMs}ms` : '—'} label="Inference" color="var(--accent-purple)" />
            <div className="stat-item" style={{ flex: 1, borderRight: 'none' }}>
                <span className="stat-value" style={{ color: statusColor[stats.status] ?? 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                    {stats.status}
                </span>
                <span className="stat-label">Status</span>
            </div>
        </div>
    );
}

function StatItem({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <div className="stat-item">
            <span className="stat-value" style={{ color, fontFamily: 'var(--font-head)', fontSize: 20 }}>{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}
'use client';

import React from 'react';
import type { Detection } from './DetectorApp';

interface Props {
    detections: Detection[];
    getColor: (cls: string) => string;
}

export default function DetectedObjects({ detections, getColor }: Props) {
    const grouped = detections.reduce<Record<string, { count: number; maxScore: number }>>((acc, d) => {
        const key = d.class;
        if (!acc[key]) acc[key] = { count: 0, maxScore: 0 };
        acc[key].count++;
        if (d.score > acc[key].maxScore) acc[key].maxScore = d.score;
        return acc;
    }, {});

    const entries = Object.entries(grouped).sort((a, b) => b[1].maxScore - a[1].maxScore);

    return (
        <div className="panel" style={{ minHeight: 120 }}>
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-dot" style={{ background: 'var(--accent-green)' }} />
                    Detected Objects
                </div>
                <span
                    style={{
                        fontSize: 11,
                        color: entries.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        fontWeight: 500,
                    }}
                >
                    {entries.length > 0 ? `${detections.length} found` : 'none'}
                </span>
            </div>

            <div
                className="panel-body"
                style={{ minHeight: 64, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}
            >
                {entries.length === 0 ? (
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px 0',
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            letterSpacing: '0.5px',
                        }}
                    >
                        — no detections —
                    </div>
                ) : (
                    entries.map(([cls, { count, maxScore }]) => {
                        const color = getColor(cls);
                        return (
                            <span
                                key={cls}
                                className="obj-pill"
                                style={{
                                    color,
                                    borderColor: `${color}44`,
                                    background: `${color}11`,
                                }}
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: color,
                                        flexShrink: 0,
                                    }}
                                />
                                {cls}
                                {count > 1 && (
                                    <span
                                        style={{
                                            background: `${color}33`,
                                            borderRadius: 999,
                                            padding: '0 4px',
                                            fontSize: 10,
                                        }}
                                    >
                                        ×{count}
                                    </span>
                                )}
                                <span style={{ fontSize: 10, opacity: 0.7 }}>
                                    {Math.round(maxScore * 100)}%
                                </span>
                            </span>
                        );
                    })
                )}
            </div>
        </div>
    );
}
'use client';

import React from 'react';
import type { AppState, DetectorMode } from './DetectorApp';

interface Props {
    appState: AppState;
    mode: DetectorMode;
    facing: 'user' | 'environment';
    threshold: number;
    maxDets: number;
    onStart: () => void;
    onStop: () => void;
    onFlip: () => void;
    onSnapshot: () => void;
    onThreshold: (v: number) => void;
    onMaxDets: (v: number) => void;
    onModeChange: (m: DetectorMode) => void;
}

const MODE_OPTIONS: { value: DetectorMode; label: string; icon: string }[] = [
    { value: 'coco', label: 'Object Detect', icon: '🔍' },
    { value: 'pose', label: 'Pose Detect', icon: '🏃' },
    { value: 'hands', label: 'Hand Gesture', icon: '✋' },
    { value: 'face', label: 'Face Analyze', icon: '😐' },
];

export default function ControlsCard({
    appState, mode, facing, threshold, maxDets,
    onStart, onStop, onFlip, onSnapshot, onThreshold, onMaxDets, onModeChange,
}: Props) {
    const isRunning = appState === 'RUNNING';
    const isLoading = appState === 'LOADING';
    const canSnap = isRunning;
    const canFlip = appState !== 'LOADING';
    const showThreshold = mode === 'coco' || mode === 'pose';
    const showMaxDets = mode === 'coco' || mode === 'pose';

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-dot" style={{ background: 'var(--accent-cyan)' }} />
                    Controls
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    {mode === 'coco' ? 'COCO-SSD · lite_mobilenet_v2' : mode === 'pose' ? 'PoseNet · MobileNetV1' : mode === 'hands' ? 'MediaPipe Hands' : 'MediaPipe Face Mesh'}
                </span>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Model Dropdown */}
                <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.3px' }}>Detection Mode</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {MODE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => onModeChange(opt.value)}
                                disabled={isLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 10px', borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${mode === opt.value ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                                    background: mode === opt.value ? 'rgba(0,212,255,0.1)' : 'var(--bg-elevated)',
                                    color: mode === opt.value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                                    fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start/Stop + Flip + Snapshot */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {isRunning ? (
                        <button className="ctrl-btn ctrl-btn-danger" onClick={onStop} style={{ flex: 1 }}>
                            <StopIcon size={14} /> Stop Detection
                        </button>
                    ) : (
                        <button className="ctrl-btn ctrl-btn-primary" onClick={onStart} disabled={isLoading} style={{ flex: 1 }}>
                            {isLoading ? (
                                <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(8,11,16,0.4)', borderTopColor: 'var(--text-inverse)', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Loading…</>
                            ) : (
                                <><CameraIcon size={14} /> Start Detection</>
                            )}
                        </button>
                    )}
                    <button className="ctrl-btn" onClick={onFlip} disabled={!canFlip} title={`Switch to ${facing === 'user' ? 'rear' : 'front'} camera`} style={{ minWidth: 44, padding: '10px 12px' }}>
                        <FlipIcon size={15} />
                        <span style={{ fontSize: 10 }}>{facing === 'user' ? 'FRONT' : 'REAR'}</span>
                    </button>
                    <button className="ctrl-btn" onClick={onSnapshot} disabled={!canSnap} title="Save snapshot as PNG" style={{ minWidth: 44, padding: '10px 12px' }}>
                        <SnapshotIcon size={15} />
                    </button>
                </div>

                {/* Confidence Threshold (COCO + Pose only) */}
                {showThreshold && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>Confidence Threshold</span>
                            <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 500, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4, padding: '1px 7px' }}>
                                {Math.round(threshold * 100)}%
                            </span>
                        </div>
                        <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={e => onThreshold(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                            <span>10% (sensitive)</span><span>90% (strict)</span>
                        </div>
                    </div>
                )}

                {/* Max Detections (COCO + Pose only) */}
                {showMaxDets && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>Max Detections</span>
                            <span style={{ fontSize: 12, color: 'var(--accent-purple)', fontWeight: 500, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 4, padding: '1px 7px' }}>
                                {maxDets}
                            </span>
                        </div>
                        <input type="range" min={1} max={10} step={1} value={maxDets} onChange={e => onMaxDets(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                            <span>1</span><span>10</span>
                        </div>
                    </div>
                )}

                {/* Info tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Client-side', 'No upload', 'requestAnimationFrame'].map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
                            {tag}
                        </span>
                    ))}
                    {mode === 'coco' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>80 classes</span>}
                    {mode === 'pose' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>17 keypoints</span>}
                    {mode === 'hands' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>21 landmarks</span>}
                    {mode === 'face' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>468 points</span>}
                </div>
            </div>
        </div>
    );
}

function CameraIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;
}
function StopIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="currentColor" stroke="none" opacity="0.3" /><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>;
}
function FlipIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;
}
function SnapshotIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

'use client';

import React, { useEffect, useRef } from 'react';
import type { Detection, TrackedObject, PoseData, GestureData, FaceData, DetectorMode } from './DetectorApp';
import { OBJECT_INFO, GESTURE_INFO } from './DetectorApp';

interface Props {
    mode: DetectorMode;
    detections: Detection[];
    classCounts: Record<string, number>;
    selectedObj: (TrackedObject & { zone: string; sizeLabel: string }) | null;
    poseData: PoseData | null;
    gestureData: GestureData | null;
    faceData: FaceData | null;
    humanFact: string;
    faceFact: string;
    onCloseSelected: () => void;
    getColor: (cls: string) => string;
}

export default function InfoPanel({
    mode, detections, classCounts, selectedObj, poseData, gestureData, faceData,
    humanFact, faceFact, onCloseSelected, getColor,
}: Props) {
    return (
        <>
            {/* COCO mode panels */}
            {mode === 'coco' && (
                <>
                    {/* Class Tally */}
                    <ClassTallyPanel classCounts={classCounts} getColor={getColor} />
                    {/* Person info (auto, no click needed) */}
                    {detections.some(d => d.class === 'person') && (
                        <PersonPanel detections={detections} humanFact={humanFact} getColor={getColor} />
                    )}
                    {/* Selected object slide-in */}
                    {selectedObj && (
                        <SelectedObjectPanel obj={selectedObj} onClose={onCloseSelected} getColor={getColor} />
                    )}
                    {/* Fallback: detected objects pills */}
                    {!selectedObj && <DetectedObjectsPills detections={detections} getColor={getColor} />}
                </>
            )}

            {/* Pose mode */}
            {mode === 'pose' && <PosePanel poseData={poseData} />}

            {/* Hands mode */}
            {mode === 'hands' && <GesturePanel gestureData={gestureData} />}

            {/* Face mode */}
            {mode === 'face' && <FacePanel faceData={faceData} faceFact={faceFact} />}
        </>
    );
}

/* ─── CLASS TALLY ────────────────────────────────────────────── */
function ClassTallyPanel({ classCounts, getColor }: { classCounts: Record<string, number>; getColor: (c: string) => string }) {
    const entries = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, c]) => s + c, 0);
    const prevCounts = useRef<Record<string, number>>({});
    const [pulsingKeys, setPulsingKeys] = React.useState<Set<string>>(new Set());

    useEffect(() => {
        const newPulsing = new Set<string>();
        entries.forEach(([cls, count]) => {
            if (prevCounts.current[cls] !== count) newPulsing.add(cls);
        });
        if (newPulsing.size > 0) {
            setPulsingKeys(newPulsing);
            setTimeout(() => setPulsingKeys(new Set()), 400);
        }
        prevCounts.current = Object.fromEntries(entries);
    }, [classCounts]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-dot" style={{ background: 'var(--accent-green)' }} />
                    Class Tally
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>{entries.length} classes</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>{total} total</span>
                </div>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 48 }}>
                {entries.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>— no detections —</div>
                ) : (
                    entries.map(([cls, count]) => {
                        const color = getColor(cls);
                        const isPulsing = pulsingKeys.has(cls);
                        return (
                            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{cls}</span>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                                    background: color, color: '#080b10',
                                    animation: isPulsing ? 'countPulse 0.4s ease' : 'none',
                                }}>
                                    {count}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

/* ─── PERSON PANEL ───────────────────────────────────────────── */
function PersonPanel({ detections, humanFact, getColor }: { detections: Detection[]; humanFact: string; getColor: (c: string) => string }) {
    const persons = detections.filter(d => d.class === 'person').sort((a, b) => b.score - a.score);
    const best = persons[0];
    if (!best) return null;
    const [, , bw, bh] = best.bbox;
    const ratio = bh / (bw + 0.001);
    const visibility = ratio > 2 ? 'Full body' : ratio > 1 ? 'Upper + mid body' : 'Partial / Seated';
    const color = getColor('person');
    const tracked = best as TrackedObject;

    return (
        <div className="panel" style={{ borderColor: `${color}33` }}>
            <div className="panel-header">
                <div className="panel-title">
                    <span style={{ fontSize: 14 }}>👤</span>
                    Person Detected
                    {tracked.trackId && <span style={{ color: 'var(--accent-cyan)', fontSize: 10 }}>#{tracked.trackId}</span>}
                </div>
                <span style={{ fontSize: 11, color, fontWeight: 600 }}>{Math.round(best.score * 100)}%</span>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Confidence" value={`${Math.round(best.score * 100)}%`} />
                <InfoRow label="People in frame" value={String(persons.length)} />
                {persons.length > 1 && <InfoRow label="Others" value={`+${persons.length - 1} more`} />}
                <Divider />
                <SectionLabel>Body Analysis</SectionLabel>
                <InfoRow label="Visibility" value={visibility} />
                <Divider />
                <SectionLabel>Fun Fact</SectionLabel>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>{humanFact}</p>
            </div>
        </div>
    );
}

/* ─── SELECTED OBJECT PANEL ──────────────────────────────────── */
function SelectedObjectPanel({ obj, onClose, getColor }: { obj: TrackedObject & { zone: string; sizeLabel: string }; onClose: () => void; getColor: (c: string) => string }) {
    const color = getColor(obj.class);
    const info = OBJECT_INFO[obj.class.toLowerCase()];
    const elapsed = Math.round((Date.now() - (obj.firstSeen ?? Date.now())) / 1000);
    const elapsedStr = elapsed < 60 ? `${elapsed}s ago` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s ago`;

    return (
        <div className="panel" style={{ borderColor: `${color}44`, animation: 'slideIn 0.3s ease' }}>
            <div className="panel-header">
                <div className="panel-title">
                    <span style={{ fontSize: 14 }}>🔍</span>
                    <span style={{ color, textTransform: 'uppercase' }}>{obj.class}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>#{obj.trackId}</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Confidence" value={`${Math.round(obj.score * 100)}%`} valueColor={color} />
                <Divider />
                {info && (
                    <>
                        <SectionLabel>What is this?</SectionLabel>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{info.desc}</p>
                        <Divider />
                        <SectionLabel>Did you know?</SectionLabel>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>{info.fact}</p>
                        <Divider />
                    </>
                )}
                <InfoRow label="Position" value={obj.zone} />
                <InfoRow label="Size" value={obj.sizeLabel} />
                <InfoRow label="Tracking ID" value={`#${obj.trackId}`} />
                <InfoRow label="First seen" value={elapsedStr} />
                <button onClick={onClose} className="ctrl-btn" style={{ marginTop: 4, fontSize: 11 }}>Close ×</button>
            </div>
        </div>
    );
}

/* ─── DETECTED OBJECTS PILLS ─────────────────────────────────── */
function DetectedObjectsPills({ detections, getColor }: { detections: Detection[]; getColor: (c: string) => string }) {
    const grouped = detections.reduce<Record<string, { count: number; maxScore: number }>>((acc, d) => {
        if (!acc[d.class]) acc[d.class] = { count: 0, maxScore: 0 };
        acc[d.class].count++;
        if (d.score > acc[d.class].maxScore) acc[d.class].maxScore = d.score;
        return acc;
    }, {});
    const entries = Object.entries(grouped).sort((a, b) => b[1].maxScore - a[1].maxScore);

    return (
        <div className="panel" style={{ minHeight: 80 }}>
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-dot" style={{ background: 'var(--accent-green)' }} />
                    Detected Objects
                </div>
                <span style={{ fontSize: 11, color: entries.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {entries.length > 0 ? `${detections.length} found` : 'none'}
                </span>
            </div>
            <div className="panel-body" style={{ minHeight: 48, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
                {entries.length === 0 ? (
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 11 }}>
                        — no detections — click a bounding box for info
                    </div>
                ) : (
                    entries.map(([cls, { count, maxScore }]) => {
                        const color = getColor(cls);
                        return (
                            <span key={cls} className="obj-pill" style={{ color, borderColor: `${color}44`, background: `${color}11` }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                {cls}
                                {count > 1 && <span style={{ background: `${color}33`, borderRadius: 999, padding: '0 4px', fontSize: 10 }}>×{count}</span>}
                                <span style={{ fontSize: 10, opacity: 0.7 }}>{Math.round(maxScore * 100)}%</span>
                            </span>
                        );
                    })
                )}
            </div>
        </div>
    );
}

/* ─── POSE PANEL ─────────────────────────────────────────────── */
function PosePanel({ poseData }: { poseData: PoseData | null }) {
    const POSE_FACTS: Record<string, string> = {
        'Standing': 'Standing burns 50 more calories per hour than sitting.',
        'Sitting': 'Prolonged sitting is linked to increased health risks.',
        'Arms Raised': 'Raising arms above the head is a universal sign of victory.',
        'T-Pose': 'The T-pose is used in 3D animation as a neutral reference.',
        'Leaning': 'Leaning towards someone signals interest and engagement.',
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span style={{ fontSize: 14 }}>🏃</span>
                    Pose Detected
                </div>
                {poseData && <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>{Math.round((poseData.score ?? 0) * 100)}%</span>}
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!poseData ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>— no pose detected —</div>
                ) : (
                    <>
                        <InfoRow label="Pose" value={poseData.poseName} valueColor="var(--accent-cyan)" />
                        <InfoRow label="Confidence" value={`${Math.round((poseData.score ?? 0) * 100)}%`} />
                        <InfoRow label="Keypoints" value={`${poseData.keypoints.filter(k => k.score > 0.4).length} / 17 visible`} />
                        <Divider />
                        <SectionLabel>Keypoint Details</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                            {poseData.keypoints.filter(k => k.score > 0.4).map(kp => (
                                <div key={kp.part} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{kp.part.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span style={{ color: 'var(--accent-green)' }}>{kp.score.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <Divider />
                        <SectionLabel>Pose Fact</SectionLabel>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {POSE_FACTS[poseData.poseName] ?? 'The human body has over 600 muscles.'}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── GESTURE PANEL ──────────────────────────────────────────── */
function GesturePanel({ gestureData }: { gestureData: GestureData | null }) {
    const info = gestureData ? GESTURE_INFO[gestureData.gesture] : null;

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span style={{ fontSize: 14 }}>{info?.emoji ?? '✋'}</span>
                    {gestureData ? gestureData.gesture : 'Hand Gesture'}
                </div>
                {gestureData && <span style={{ fontSize: 11, color: 'var(--accent-purple)', fontWeight: 600 }}>{Math.round(gestureData.confidence * 100)}%</span>}
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!gestureData ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>— no hands detected —</div>
                ) : (
                    <>
                        {/* Large gesture badge */}
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 8 }}>{info?.emoji ?? '✋'}</div>
                            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, color: 'var(--accent-purple)' }}>{gestureData.gesture}</div>
                        </div>
                        <InfoRow label="Hand" value={gestureData.hand} />
                        <InfoRow label="Confidence" value={`${Math.round(gestureData.confidence * 100)}%`} />
                        {info && (
                            <>
                                <Divider />
                                <SectionLabel>Meaning</SectionLabel>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{info.meaning}</p>
                                <Divider />
                                <SectionLabel>Used For</SectionLabel>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{info.usage}</p>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── FACE PANEL ─────────────────────────────────────────────── */
function FacePanel({ faceData, faceFact }: { faceData: FaceData | null; faceFact: string }) {
    const EXPR_EMOJI: Record<string, string> = { Neutral: '😐', Smiling: '😊', Surprised: '😲', 'Mouth Open': '😮', None: '—' };

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span style={{ fontSize: 14 }}>{EXPR_EMOJI[faceData?.expression ?? 'None'] ?? '😐'}</span>
                    Face Detected
                </div>
                {faceData && <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>{faceData.faceCount} face{faceData.faceCount !== 1 ? 's' : ''}</span>}
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!faceData || faceData.faceCount === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>— no faces detected —</div>
                ) : (
                    <>
                        <InfoRow label="Faces in frame" value={String(faceData.faceCount)} />
                        <InfoRow label="Expression" value={faceData.expression} valueColor="var(--accent-cyan)" />
                        <Divider />
                        <SectionLabel>Head Orientation</SectionLabel>
                        <InfoRow label="Horizontal" value={faceData.headH} />
                        <InfoRow label="Vertical" value={faceData.headV} />
                        <Divider />
                        <SectionLabel>Eye State</SectionLabel>
                        <InfoRow label="Left eye" value={faceData.leftEye} valueColor={faceData.leftEye === 'Open' ? 'var(--accent-green)' : 'var(--accent-amber)'} />
                        <InfoRow label="Right eye" value={faceData.rightEye} valueColor={faceData.rightEye === 'Open' ? 'var(--accent-green)' : 'var(--accent-amber)'} />
                        <Divider />
                        <SectionLabel>Face Fact</SectionLabel>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>{faceFact}</p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: valueColor ?? 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{children}</div>;
}

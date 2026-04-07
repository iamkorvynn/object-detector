'use client';

import React from 'react';
import type { DetectorMode } from './DetectorApp';

interface Props {
    mode: DetectorMode;
}

const MODEL_DATA: Record<DetectorMode, Array<{ label: string; value: string }>> = {
    coco: [
        { label: 'Model', value: 'COCO-SSD' },
        { label: 'Base', value: 'lite_mobilenet_v2' },
        { label: 'Classes', value: '80' },
        { label: 'TF.js', value: 'v4.20.0' },
        { label: 'Max Dets', value: '10 / frame' },
        { label: 'Tracking', value: 'IoU-based' },
        { label: 'Execution', value: 'Client-side' },
        { label: 'Privacy', value: 'No upload' },
    ],
    pose: [
        { label: 'Model', value: 'PoseNet' },
        { label: 'Base', value: 'MobileNetV1' },
        { label: 'Keypoints', value: '17' },
        { label: 'TF.js', value: 'v4.20.0' },
        { label: 'Stride', value: '16' },
        { label: 'Poses', value: 'Multi-person' },
        { label: 'Execution', value: 'Client-side' },
        { label: 'Privacy', value: 'No upload' },
    ],
    hands: [
        { label: 'Model', value: 'MP Hands' },
        { label: 'Provider', value: 'MediaPipe' },
        { label: 'Landmarks', value: '21 / hand' },
        { label: 'Max Hands', value: '2' },
        { label: 'Gestures', value: '8 classes' },
        { label: 'Complexity', 'value': 'Level 1' },
        { label: 'Execution', value: 'Client-side' },
        { label: 'Privacy', value: 'No upload' },
    ],
    face: [
        { label: 'Model', value: 'Face Mesh' },
        { label: 'Provider', value: 'MediaPipe' },
        { label: 'Landmarks', value: '468 points' },
        { label: 'Max Faces', value: '4' },
        { label: 'Refined', value: 'Yes' },
        { label: 'Analysis', value: 'Expression+Gaze' },
        { label: 'Execution', value: 'Client-side' },
        { label: 'Privacy', value: 'No upload' },
    ],
};

const SAMPLE_CLASSES: Record<DetectorMode, string[]> = {
    coco: ['person', 'car', 'dog', 'cat', 'bicycle', 'phone', 'laptop', 'bottle', 'chair', 'bird'],
    pose: ['nose', 'leftEye', 'rightEye', 'leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle'],
    hands: ['Fist', 'Open Hand', 'Thumbs Up', 'Peace', 'Call Me', 'Pointing', 'Thumbs Down', 'Crossed Fingers'],
    face: ['eyes', 'lips', 'eyebrows', 'nose', 'face outline', '468 mesh points'],
};

export default function ModelInfo({ mode }: Props) {
    const cells = MODEL_DATA[mode];
    const samples = SAMPLE_CLASSES[mode];

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-dot" style={{ background: 'var(--accent-purple)' }} />
                    Model Info
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mode.toUpperCase()}</span>
            </div>
            <div className="panel-body">
                <div className="model-grid">
                    {cells.map(cell => (
                        <div key={cell.label} className="model-cell">
                            <div className="model-cell-label">{cell.label}</div>
                            <div className="model-cell-value">{cell.value}</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                        {mode === 'coco' ? 'Sample classes' : mode === 'pose' ? 'Keypoints' : mode === 'hands' ? 'Gestures' : 'Zones'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {samples.map(c => (
                            <span key={c} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                                {c}
                            </span>
                        ))}
                        {mode === 'coco' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>+70 more</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
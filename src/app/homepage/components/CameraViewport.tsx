'use client';

import React, { RefObject } from 'react';
import type { AppState, DetectorMode } from './DetectorApp';

interface Props {
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    clickLayerRef: RefObject<HTMLDivElement | null>;
    appState: AppState;
    mode: DetectorMode;
    loadingMsg: string;
    onStart: () => void;
    onRetry: () => void;
    onLoadModel: () => void;
    onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function CameraViewport({
    videoRef, canvasRef, clickLayerRef, appState, mode, loadingMsg, onStart, onRetry, onLoadModel, onCanvasClick,
}: Props) {
    const showOverlay = appState === 'IDLE' || appState === 'LOADING' || appState === 'ERROR' || appState === 'STOPPED';

    return (
        <div
            className={`camera-wrap${appState === 'RUNNING' ? ' running' : ''}`}
            style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
        >
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />
            {appState === 'RUNNING' && <div className="scan-line" />}

            <video
                ref={videoRef}
                muted playsInline autoPlay
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', zIndex: 1 }}
            />

            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none', zIndex: 2 }}
            />

            {/* Click layer for COCO mode bounding box selection */}
            {appState === 'RUNNING' && mode === 'coco' && (
                <div
                    ref={clickLayerRef}
                    onClick={onCanvasClick}
                    style={{ position: 'absolute', inset: 0, zIndex: 3, cursor: 'crosshair' }}
                />
            )}

            {/* Idle / Loading / Error overlay */}
            <div
                style={{
                    position: 'absolute', inset: 0, zIndex: 5,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
                    background: appState === 'RUNNING' ? 'transparent' : 'rgba(8,11,16,0.9)',
                    transition: 'background 0.4s ease',
                    pointerEvents: showOverlay ? 'auto' : 'none',
                }}
            >
                {appState === 'IDLE' && <IdleContent onStart={onStart} onLoadModel={onLoadModel} mode={mode} />}
                {appState === 'LOADING' && <LoadingContent msg={loadingMsg} />}
                {appState === 'ERROR' && <ErrorContent onRetry={onRetry} />}
                {appState === 'STOPPED' && <StoppedContent onStart={onStart} />}
            </div>

            {appState === 'RUNNING' && (
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 6, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,255,157,0.12)', border: '1px solid rgba(0,255,157,0.3)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulseGlowGreen 1.5s ease infinite' }} />
                    LIVE
                </div>
            )}
        </div>
    );
}

const MODE_LABELS: Record<string, string> = {
    coco: 'COCO-SSD detects 80 object classes live in your browser.',
    pose: 'PoseNet detects full human body skeleton with 17 keypoints.',
    hands: 'MediaPipe Hands detects up to 2 hands with gesture recognition.',
    face: 'MediaPipe Face Mesh draws 468 facial landmarks with expression analysis.',
};

function IdleContent({ onStart, onLoadModel, mode }: { onStart: () => void; onLoadModel: () => void; mode: string }) {
    return (
        <>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--accent-cyan)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px dashed var(--accent-cyan)', animation: 'spin 8s linear infinite', opacity: 0.5 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>👁</div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--accent-cyan)', animation: 'scannerPing 2s ease-out infinite' }} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 8 }}>
                    Real-Time AI Detection
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {MODE_LABELS[mode] ?? MODE_LABELS.coco} No data leaves your device.
                </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="ctrl-btn ctrl-btn-primary" onClick={onStart} style={{ minWidth: 140 }}>
                    <CameraIcon size={15} /> Start Detection
                </button>
                <button className="ctrl-btn" onClick={onLoadModel} style={{ fontSize: 11 }}>Pre-load Model</button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Requires camera permission · Runs 100% client-side</p>
        </>
    );
}

function LoadingContent({ msg }: { msg: string }) {
    return (
        <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-cyan)', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Loading Neural Network</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{msg}</p>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: 'var(--accent-amber)' }}>
                <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
                Initialising model…
            </div>
        </>
    );
}

function ErrorContent({ onRetry }: { onRetry: () => void }) {
    return (
        <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: 'var(--glow-red)' }}>⚠</div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: 'var(--accent-red)', marginBottom: 6 }}>Detection Error</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 280 }}>
                    Camera access denied or model failed to load. Try Chrome for best MediaPipe support.
                </p>
            </div>
            <button className="ctrl-btn ctrl-btn-primary" onClick={onRetry}>Retry</button>
        </>
    );
}

function StoppedContent({ onStart }: { onStart: () => void }) {
    return (
        <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⏸</div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>Detection Paused</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Camera stream stopped. Model remains loaded.</p>
            </div>
            <button className="ctrl-btn ctrl-btn-primary" onClick={onStart}><CameraIcon size={15} /> Resume Detection</button>
        </>
    );
}

function CameraIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    );
}
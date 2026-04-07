'use client';

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function Header() {
    return (
        <header
            style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                padding: '0 16px',
            }}
        >
            <div
                style={{
                    maxWidth: 1100,
                    margin: '0 auto',
                    height: 'var(--header-h)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Link href="/homepage" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <AppLogo size={30} />
                    <span
                        style={{
                            fontFamily: 'var(--font-head)',
                            fontSize: 18,
                            background: 'linear-gradient(90deg, var(--text-primary), var(--accent-cyan))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '-0.3px',
                        }}
                    >
                        ObjectDetector
                    </span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link
                        href="/homepage"
                        style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 0.2s',
                        }}
                    >
                        Detector
                    </Link>
                </nav>
            </div>
        </header>
    );
}
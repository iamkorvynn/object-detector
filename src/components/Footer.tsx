'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function Footer() {
    const [year, setYear] = useState('');

    useEffect(() => {
        setYear(new Date()?.getFullYear()?.toString());
    }, []);

    return (
        <footer
            style={{
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                padding: '0 4px',
                height: 'var(--footer-h)',
                fontFamily: 'var(--font-mono)',
            }}
        >
            {/* Left: Logo + copyright */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppLogo size={18} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        ObjectDetector
                    </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {year ? `© ${year}` : ''}
                </span>
            </div>

            {/* Right: links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <Link
                    href="/homepage"
                    style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                >
                    Detector
                </Link>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    Privacy
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    Terms
                </span>
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: 'var(--accent-green)',
                        letterSpacing: '0.5px',
                    }}
                >
                    <span
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: 'var(--accent-green)',
                            animation: 'pulseGlowGreen 2s ease infinite',
                        }}
                    />
                    100% Client-side
                </span>
            </div>
        </footer>
    );
}
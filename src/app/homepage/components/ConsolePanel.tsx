'use client';

import React, { useEffect, useRef } from 'react';
import type { LogEntry } from './DetectorApp';

interface Props {
  logs: LogEntry[];
}

export default function ConsolePanel({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-dot" style={{ background: 'var(--accent-amber)' }} />
          Console
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {logs.length} entries
        </span>
      </div>

      <div
        ref={scrollRef}
        className="panel-body"
        style={{
          maxHeight: 180,
          overflowY: 'auto',
          padding: '8px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
            Waiting for events…
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="log-line">
              <span className="log-time">{log.time}</span>
              <span className={`log-${log.type}`}>
                {log.type === 'info'    && '[INFO]'}
                {log.type === 'success' && '[OK]  '}
                {log.type === 'warn'    && '[WARN]'}
                {log.type === 'error'   && '[ERR] '}
              </span>
              <span className="log-msg">{log.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
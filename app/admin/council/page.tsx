'use client';

import { useState } from 'react';

export default function AdminCouncil() {
  const [secret, setSecret] = useState('');
  const [topic, setTopic] = useState('');
  const [autoTopic, setAutoTopic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const triggerDebate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/council/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSecret: secret,
          topic: autoTopic ? '' : topic,
          generateTopic: autoTopic,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: 'Failed to trigger debate' });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>Council Admin</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Admin Secret:</label><br />
        <input
          type="password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={autoTopic}
            onChange={e => setAutoTopic(e.target.checked)}
          />
          {' '}Auto-generate topic (Claude picks)
        </label>
      </div>

      {!autoTopic && (
        <div style={{ marginBottom: 20 }}>
          <label>Manual Topic:</label><br />
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g., Should AI systems have legal personhood?"
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
      )}

      <button
        onClick={triggerDebate}
        disabled={loading || !secret}
        style={{
          padding: '12px 24px',
          background: loading ? '#666' : '#2a2a2a',
          color: '#f5f2ed',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 16,
        }}
      >
        {loading ? 'Generating debate... (takes ~30 seconds)' : 'GO LIVE'}
      </button>

      {result && (
        <div style={{ marginTop: 20, padding: 16, background: '#1a1a1a', color: '#ccc', borderRadius: 4 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

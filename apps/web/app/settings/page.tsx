'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserSettings {
  id: string;
  handle?: string;
  username: string;
  avatar?: string;
  bio?: string;
  rating: number;
  maxRating: number;
  rank: string;
  contribution: number;
  battleWins: number;
  battleLosses: number;
  winStreak: number;
  totalBattles: number;
  favoriteTopics: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bio, setBio] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<'cpp' | 'python' | 'java'>('cpp');

  useEffect(() => {
    fetchSettings();
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('codeclash_default_language') as 'cpp' | 'python' | 'java';
      if (savedLang && ['cpp', 'python', 'java'].includes(savedLang)) {
        setDefaultLanguage(savedLang);
      }
    }
  }, []);

  const handleLanguageChange = (lang: 'cpp' | 'python' | 'java') => {
    setDefaultLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('codeclash_default_language', lang);
      setSuccess(`Default language set to ${lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python' : 'Java'}`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';

      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
        setBio(data.data.bio || '');
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Profile updated successfully');
        setSettings(data.data);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncProfile = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const token = (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || 'guest-token';
      const res = await fetch(`${apiUrl}/api/auth/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Profile synced');
        setSettings(data.data);
      } else {
        setError(data.error || 'Failed to sync profile');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
            {success}
          </div>
        )}

        <div className="p-6 border rounded-2xl bg-card card-elevated motion-enter space-y-4">
          <h2 className="text-lg font-semibold">Account Profile</h2>
          <p className="text-sm text-muted-foreground">
            Your CodeClash account handle and competitive statistics.
          </p>

          {settings && (
            <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{settings.username || settings.handle}</div>
                  <div className="text-sm text-muted-foreground font-mono tabular-nums">
                    Rating {settings.rating} · Max {settings.maxRating} · {settings.rank}
                  </div>
                </div>
                <a
                  href={`/profile/${settings.username || settings.handle}`}
                  className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-accent transition-colors duration-150 active:scale-[0.98]"
                >
                  View Profile
                </a>
              </div>
              <div className="text-sm text-muted-foreground font-mono tabular-nums">
                {settings.battleWins}W / {settings.battleLosses}L · {settings.totalBattles} battles · streak {settings.winStreak}
              </div>
            </div>
          )}

          <button
            onClick={handleSyncProfile}
            disabled={syncing}
            className="px-4 py-2 border rounded-lg font-medium hover:bg-accent transition-colors duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Profile'}
          </button>
        </div>

        {/* Editor Preferences */}
        <div className="p-6 border rounded-2xl bg-card card-elevated motion-enter space-y-4">
          <h2 className="text-lg font-semibold">Editor Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Configure your default programming language and coding environment.
          </p>
          <div className="space-y-3">
            <label className="text-sm font-medium">Default Language</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cpp', label: 'C++ (Default)', desc: 'C++20 with STL' },
                { id: 'python', label: 'Python', desc: 'Python 3.11' },
                { id: 'java', label: 'Java', desc: 'OpenJDK 21' },
              ].map((item) => {
                const isSelected = defaultLanguage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLanguageChange(item.id as 'cpp' | 'python' | 'java')}
                    className={`p-3.5 border rounded-xl text-left transition-colors duration-150 active:scale-[0.98] ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-accent'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>{item.label}</span>
                      {isSelected && <span className="text-primary text-xs font-bold">✓ Active</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-2xl bg-card card-elevated motion-enter space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border rounded-lg bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Tell other competitors about yourself..."
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

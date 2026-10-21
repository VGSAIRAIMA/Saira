/**
 * DeleteAccountSection.tsx
 *
 * "Delete my data" Settings section with a confirmation modal that:
 *  1. Explains exactly what will be deleted
 *  2. Requires the user to type "DELETE" (all caps) to enable the button
 *  3. Calls deleteAccount() → shows progress → signs out → navigates to /
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { db } from '@/lib/firebase';
import { deleteAccount } from '@/lib/deleteAccount';

const CONFIRM_WORD = 'DELETE';

export const DeleteAccountSection: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const signOutUser = useAuthStore((s) => s.signOutUser);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!user || !db) return null;

  // db is non-null past this point — capture in a local variable so TS is happy
  const safeDb = db;

  const canDelete = confirmText === CONFIRM_WORD && !isDeleting;

  const open = () => {
    setIsOpen(true);
    setConfirmText('');
    setError(null);
    setProgress(0);
  };

  const close = () => {
    if (isDeleting) return; // disallow closing while in progress
    setIsOpen(false);
    setConfirmText('');
    setError(null);
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount({
        db: safeDb,
        user,
        onProgress: (n) => setProgress(n),
      });
      // Sign out (best-effort — auth user is already deleted)
      try {
        await signOutUser();
      } catch {
        // ignore
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled')) {
        setError('Re-authentication was cancelled. Your account was NOT deleted.');
      } else {
        setError(`Deletion failed: ${msg}`);
      }
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Trigger section */}
      <div className="bg-surface border border-danger/30 rounded-3xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-danger" />
          <h3 className="text-sm font-semibold text-foreground">Delete Account &amp; Data</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently deletes all your progress, notes, day logs, revision history, weekly
          reviews, reminder settings, and device tokens from our servers. This cannot be
          undone. Export a JSON backup first if you want a local copy.
        </p>
        <button
          id="delete-account-open-btn"
          type="button"
          onClick={open}
          className="px-4 py-2 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors cursor-pointer"
        >
          Delete my data&hellip;
        </button>
      </div>

      {/* Confirmation modal */}
      {isOpen && (
        <>
          <div
            onClick={close}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50"
          />
          <div className="fixed inset-x-4 top-24 max-w-md mx-auto bg-surface border border-danger/40 rounded-2xl z-50 shadow-2xl p-6 space-y-5 animate-fade-rise">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                <h2 className="text-base font-semibold text-foreground">
                  Permanently delete your account?
                </h2>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={close}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* What will be deleted */}
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>All item progress, notes, confidence ratings, and link overrides</li>
                <li>All day logs (streaks, heatmap, pace history)</li>
                <li>Weekly reviews and revision history</li>
                <li>Reminder settings and device push tokens</li>
                <li>Custom items and hidden-item list</li>
                <li>Your Google sign-in (you can sign up again with a fresh account)</li>
              </ul>
              <p className="text-warning font-medium pt-1">
                This cannot be undone. Export a JSON backup before proceeding.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
                {error}
              </div>
            )}

            {/* Progress */}
            {isDeleting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>
                  {progress === 0
                    ? 'Deleting your data…'
                    : `Deleted ${progress} documents so far…`}
                </span>
              </div>
            )}

            {/* Confirmation input */}
            {!isDeleting && (
              <div className="space-y-1.5">
                <label
                  htmlFor="delete-confirm-input"
                  className="text-xs font-semibold text-foreground"
                >
                  Type <span className="font-mono text-danger">{CONFIRM_WORD}</span> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs font-mono text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-danger"
                />
              </div>
            )}

            {/* Buttons */}
            {!isDeleting && (
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-foreground text-xs font-semibold hover:bg-surface-2/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="delete-account-confirm-btn"
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    canDelete
                      ? 'bg-danger text-white hover:bg-danger/80'
                      : 'bg-danger/20 text-danger/40 cursor-not-allowed'
                  }`}
                >
                  Delete everything
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { allPhases } from '@/lib/seed';
import { useSheetStore } from '@/stores/useSheetStore';
import { X, Plus } from 'lucide-react';

interface CustomItemModalProps {
  isOpen: boolean;
  defaultTopicId?: string;
  onClose: () => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  defaultTopicId,
  onClose,
}) => {
  const { addCustomItem, selectedPhaseId } = useSheetStore();

  const currentPhase =
    allPhases.find((p) => p.id === selectedPhaseId) || allPhases[0];

  const [topicId, setTopicId] = useState(
    defaultTopicId || currentPhase.topics[0]?.id || ''
  );
  const [kind, setKind] = useState<'subtopic' | 'practice'>('subtopic');
  const [title, setTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [practiceLink, setPracticeLink] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addCustomItem({
      kind,
      topicId,
      phaseId: selectedPhaseId,
      title: title.trim(),
      links: {
        video: videoLink.trim() || undefined,
        article: articleLink.trim() || undefined,
        practice: practiceLink.trim() || undefined,
      },
    });

    setTitle('');
    setVideoLink('');
    setArticleLink('');
    setPracticeLink('');
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
      />
      <div className="fixed inset-x-4 top-24 max-w-lg mx-auto bg-surface border border-border rounded-2xl z-50 shadow-2xl p-6 space-y-5 animate-fade-rise">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Add Custom Item</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Item Kind: Subtopic vs Practice Problem */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] block">
              Item Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKind('subtopic')}
                className={`py-2 rounded-xl border text-center font-medium transition-colors ${
                  kind === 'subtopic'
                    ? 'bg-primary/20 border-primary text-foreground font-semibold'
                    : 'bg-surface-2/40 border-border text-muted-foreground'
                }`}
              >
                Learn Subtopic
              </button>
              <button
                type="button"
                onClick={() => setKind('practice')}
                className={`py-2 rounded-xl border text-center font-medium transition-colors ${
                  kind === 'practice'
                    ? 'bg-warning/20 border-warning text-foreground font-semibold'
                    : 'bg-surface-2/40 border-border text-muted-foreground'
                }`}
              >
                Practice Problem
              </button>
            </div>
          </div>

          {/* Topic Selector */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] block">
              Target Topic
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            >
              {allPhases.map((phase) => (
                <optgroup key={phase.id} label={`Phase ${phase.order}: ${phase.title}`}>
                  {phase.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] block">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inorder Traversal using Morris Traversal"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Optional Links */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px] block">
              Optional Links
            </label>
            <input
              type="url"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="Video URL (https://...)"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
            <input
              type="url"
              value={articleLink}
              onChange={(e) => setArticleLink(e.target.value)}
              placeholder="Article URL (https://...)"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
            <input
              type="url"
              value={practiceLink}
              onChange={(e) => setPracticeLink(e.target.value)}
              placeholder="Practice URL (https://...)"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

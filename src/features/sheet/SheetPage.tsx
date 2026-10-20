import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { allPhases } from '@/lib/seed';
import { useSheetStore } from '@/stores/useSheetStore';
import { PhaseRail } from './components/PhaseRail';
import { PhaseHeader } from './components/PhaseHeader';
import { SheetToolbar } from './components/SheetToolbar';
import { TopicAccordion } from './components/TopicAccordion';
import { ItemDetailDrawer } from './components/ItemDetailDrawer';
import { SearchModal } from './components/SearchModal';
import { CustomItemModal } from './components/CustomItemModal';
import { HiddenItemsModal } from './components/HiddenItemsModal';
import { ExportImportModal } from './components/ExportImportModal';
import { UndoToast } from './components/UndoToast';

export const SheetPage: React.FC = () => {
  const { phaseId } = useParams();
  const navigate = useNavigate();

  const {
    isLoaded,
    initialize,
    selectedPhaseId,
    setSelectedPhaseId,
    selectedItemId,
    setSelectedItemId,
    toggleItemDone,
    toggleBookmark,
    customItems,
  } = useSheetStore();

  // Initialize storage once
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync route param with store
  useEffect(() => {
    if (phaseId && phaseId !== selectedPhaseId) {
      const exists = allPhases.some((p) => p.id === phaseId);
      if (exists) {
        setSelectedPhaseId(phaseId);
      }
    }
  }, [phaseId, selectedPhaseId, setSelectedPhaseId]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState<string | undefined>(undefined);
  const [isHiddenModalOpen, setIsHiddenModalOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Active Phase
  const currentPhase = useMemo(
    () => allPhases.find((p) => p.id === selectedPhaseId) || allPhases[0],
    [selectedPhaseId]
  );

  // Flat list of visible items in current phase for j/k keyboard navigation
  const visibleItemIds = useMemo(() => {
    const ids: string[] = [];
    for (const topic of currentPhase.topics) {
      for (const s of topic.subtopics || []) {
        ids.push(s.id);
      }
      for (const p of topic.practice || []) {
        ids.push(p.id);
      }
      // Add custom items for this topic
      for (const c of customItems.filter((ci) => ci.topicId === topic.id)) {
        ids.push(c.id);
      }
    }
    return ids;
  }, [currentPhase, customItems]);

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const focusedItemId = focusedIndex >= 0 ? visibleItemIds[focusedIndex] : null;

  // Global Keyboard Navigation
  useEffect(() => {
    let lastKey = '';
    let gTimer: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keystrokes if typing inside inputs/textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Search modal shortcut (Ctrl+K or /)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Escape key closes modals / drawer
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (isAddModalOpen) setIsAddModalOpen(false);
        else if (isHiddenModalOpen) setIsHiddenModalOpen(false);
        else if (isExportImportOpen) setIsExportImportOpen(false);
        else if (selectedItemId) setSelectedItemId(null);
        return;
      }

      // 'g t' -> Today, 'g s' -> Sheet navigation
      if (e.key === 'g') {
        lastKey = 'g';
        if (gTimer) clearTimeout(gTimer);
        gTimer = window.setTimeout(() => {
          lastKey = '';
        }, 1000);
        return;
      }
      if (lastKey === 'g' && e.key === 't') {
        e.preventDefault();
        lastKey = '';
        navigate('/today');
        return;
      }
      if (lastKey === 'g' && e.key === 's') {
        e.preventDefault();
        lastKey = '';
        navigate('/sheet');
        return;
      }

      // 'j' / 'k' cursor navigation
      if (e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < visibleItemIds.length - 1 ? prev + 1 : 0;
          const nextId = visibleItemIds[next];
          const el = document.getElementById(`item-${nextId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
        return;
      }
      if (e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : visibleItemIds.length - 1;
          const nextId = visibleItemIds[next];
          const el = document.getElementById(`item-${nextId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
        return;
      }

      // 'x' toggle done
      if (e.key === 'x') {
        if (focusedItemId) {
          e.preventDefault();
          toggleItemDone(focusedItemId);
        }
        return;
      }

      // 'b' toggle bookmark
      if (e.key === 'b') {
        if (focusedItemId) {
          e.preventDefault();
          toggleBookmark(focusedItemId);
        }
        return;
      }

      // 'Enter' open detail drawer
      if (e.key === 'Enter') {
        if (focusedItemId) {
          e.preventDefault();
          setSelectedItemId(focusedItemId);
        }
        return;
      }

      // 'n' open notes drawer
      if (e.key === 'n') {
        if (focusedItemId) {
          e.preventDefault();
          setSelectedItemId(focusedItemId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [
    isSearchOpen,
    isAddModalOpen,
    isHiddenModalOpen,
    isExportImportOpen,
    selectedItemId,
    focusedItemId,
    visibleItemIds,
    setSelectedItemId,
    toggleItemDone,
    toggleBookmark,
    navigate,
  ]);

  const handleOpenAddModal = (topicId?: string) => {
    setTargetTopicId(topicId);
    setIsAddModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-xs text-muted-foreground gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading DSA Sheet...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <SheetToolbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
      />

      {/* Main Sheet Grid: Left Rail (1 col) + Content (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sticky Desktop Left Rail */}
        <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-20">
          <PhaseRail />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          {/* Phase Header Card */}
          <PhaseHeader
            phase={currentPhase}
            onOpenAddModal={() => handleOpenAddModal()}
            onOpenHiddenModal={() => setIsHiddenModalOpen(true)}
          />

          {/* Topics List with Accordions */}
          <div className="space-y-3">
            {currentPhase.topics.map((topic) => (
              <TopicAccordion
                key={topic.id}
                topic={topic}
                phaseOrder={currentPhase.order}
                focusedItemId={focusedItemId}
                onOpenAddModal={(tId) => handleOpenAddModal(tId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals & Slide-over Drawer */}
      <ItemDetailDrawer />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <CustomItemModal
        isOpen={isAddModalOpen}
        defaultTopicId={targetTopicId}
        onClose={() => {
          setIsAddModalOpen(false);
          setTargetTopicId(undefined);
        }}
      />

      <HiddenItemsModal
        isOpen={isHiddenModalOpen}
        onClose={() => setIsHiddenModalOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
      />

      <UndoToast />
    </div>
  );
};

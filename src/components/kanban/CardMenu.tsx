"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { archiveProject, deleteProject } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";

interface CardMenuProps {
  projectId: string;
  onRemove?: () => void;
}

export default function CardMenu({ projectId, onRemove }: CardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handleArchive(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen(false);
    onRemove?.();
    startTransition(async () => {
      const result = await archiveProject(projectId);
      if (result.success) {
        showToast("Project scrapped.", "success");
      } else {
        showToast(result.error || "Failed to archive project.", "error");
      }
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen(false);
    if (!confirm("Are you sure you want to delete this project?")) return;
    onRemove?.();
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.success) {
        showToast("Project deleted.", "success");
      } else {
        showToast(result.error || "Failed to delete project.", "error");
      }
    });
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span
        onClick={() => setIsOpen(!isOpen)}
        className="material-symbols-outlined text-[16px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        more_horiz
      </span>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-[#0a0a0a] border border-white/10 shadow-2xl z-50 flex flex-col">
          <button
            onClick={handleArchive}
            className="text-left px-3 py-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
          >
            Scrap
          </button>
          <button
            onClick={handleDelete}
            className="text-left px-3 py-2 text-[10px] font-mono text-accent/80 uppercase tracking-widest hover:bg-accent-subtle hover:text-accent transition-colors border-t border-white/5"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

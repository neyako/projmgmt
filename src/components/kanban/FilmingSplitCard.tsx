"use client";

import Image from "next/image";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import ShotRow from "./ShotRow";
import { parsePlatforms } from "@/lib/utils";
import { updateProjectShotlist } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import CardMenu from "./CardMenu";
import type { ProjectCardData, ShotItem } from "@/types";
import { useLocale, useT } from "@/lib/i18n/client";
import { toIntlLocale, type Locale } from "@/lib/i18n/locales";

interface FilmingSplitCardProps {
  project: ProjectCardData;
  onProjectUpdate?: (updated: Partial<ProjectCardData> & { id: string }) => void;
  onRemove?: (id: string) => void;
}

function parseShotItems(json?: string): ShotItem[] {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function calcPercent(shots: ShotItem[]): number {
  if (shots.length === 0) return 0;
  const done = shots.filter((s) => s.isCompleted).length;
  return Math.round((done / shots.length) * 100);
}

function formatScopeDeadline(date: Date | string | null | undefined, locale: Locale) {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed
    .toLocaleDateString(toIntlLocale(locale), { month: "short", day: "2-digit" })
    .toUpperCase();
}

export default function FilmingSplitCard({
  project,
  onProjectUpdate,
  onRemove,
}: FilmingSplitCardProps) {
  const [, startTransition] = useTransition();
  const { showToast } = useToast();
  const t = useT();
  const locale = useLocale();

  const platforms = parsePlatforms(project.platformsTargeted);
  const assignmentValues: Array<
    string | { id: string; name?: string | null; avatarUrl?: string | null } | null | undefined
  > = [
    project.assignedEditor,
    project.assignedCameraman,
    project.assignedTalent,
    project.aRollAssignee,
    project.bRollAssignee,
    project.editingAssignee,
  ];
  const assignees = assignmentValues.reduce<
    Array<{ id: string; name: string; avatarUrl?: string | null }>
  >((list, value, index) => {
    if (!value) {
      return list;
    }

    const name = typeof value === "string" ? value.trim() : value.name?.trim();

    if (!name || name.toUpperCase() === "UNASSIGNED") {
      return list;
    }

    const id = typeof value === "string" ? name.toUpperCase() : value.id;

    if (list.some((assignee) => assignee.id === id)) {
      return list;
    }

    list.push({
      id,
      name,
      avatarUrl: typeof value === "string" ? null : value.avatarUrl,
    });

    return list;
  }, []);
  const aRollShots = parseShotItems(project.aRollShots);
  const bRollShots = parseShotItems(project.bRollShots);

  const aRollPercent = calcPercent(aRollShots);
  const bRollPercent = calcPercent(bRollShots);
  const aRollDone = aRollShots.filter((s) => s.isCompleted).length;
  const bRollDone = bRollShots.filter((s) => s.isCompleted).length;
  const filmingDeadline = project.filmingDueDate
    ? formatScopeDeadline(project.filmingDueDate, locale)
    : "";

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function toggleShot(list: "a" | "b", shotId: string) {
    const current = list === "a" ? aRollShots : bRollShots;
    const next = current.map((s) =>
      s.id === shotId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    const serialized = JSON.stringify(next);
    const field = list === "a" ? "aRollShots" : "bRollShots";

    // Optimistic parent update
    onProjectUpdate?.({ id: project.id, [field]: serialized });

    startTransition(async () => {
      const result = await updateProjectShotlist(
        project.id,
        list === "a" ? "aRoll" : "bRoll",
        next
      );
      if (!result.success) {
        onProjectUpdate?.({ id: project.id, [field]: JSON.stringify(current) });
        showToast(result.error, "error");
      }
    });
  }

  return (
    <div className="ui-filming-card-surface border border-border-visible p-md flex flex-col gap-sm relative group overflow-hidden">
      {/* Left accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-subtle" />

      {/* Title + Menu */}
      <div className="flex justify-between items-start pl-2">
        <div className="text-style-subheading text-text-primary font-[family-name:var(--font-heading)]">
          {project.title}
        </div>
        <CardMenu projectId={project.id} onRemove={() => onRemove?.(project.id)} />
      </div>

      {/* Tags */}
      {platforms.length > 0 && (
        <div className="flex gap-2 mt-xs pl-2">
          {platforms.map((p) => (
            <Tag key={p} label={p} />
          ))}
        </div>
      )}

      {project.filmingDueDate && (
        <div className="flex items-center justify-between gap-3 mt-xs ml-2 border border-border-visible bg-input-surface px-2 py-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">
            {t("kanban.filmingDue")}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap text-text-display">
            {filmingDeadline}
          </span>
        </div>
      )}

      {/* Split Task Section */}
      <div className="mt-md pl-2 border-l border-border ml-2 flex flex-col gap-sm">
        {/* A-Roll */}
        <div>
          <div className="flex justify-between items-center mb-xs">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "material-symbols-outlined text-[14px]",
                  aRollPercent === 100
                    ? "text-success"
                    : aRollPercent > 0
                      ? "text-warning"
                      : "text-text-secondary"
                )}
              >
                {aRollPercent === 100 ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className="text-style-caption text-text-primary">{t("kanban.aRoll")}</span>
              <span className="text-[10px] font-mono text-text-disabled">
                {aRollDone}/{aRollShots.length}
              </span>
            </div>
            <span className="text-style-label text-[10px] text-text-secondary">
              {aRollPercent}%
            </span>
          </div>
          <ProgressBar
            total={Math.max(aRollShots.length, 1)}
            filled={aRollDone}
            height="h-[4px]"
            filledColor="bg-success"
          />
          {aRollShots.length > 0 && (
            <div className="mt-2 flex flex-col gap-0.5">
              {aRollShots.map((shot) => (
                <ShotRow
                  key={shot.id}
                  shot={shot}
                  onToggle={(id) => toggleShot("a", id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* B-Roll */}
        <div>
          <div className="flex justify-between items-center mb-xs">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "material-symbols-outlined text-[14px]",
                  bRollPercent === 100
                    ? "text-success"
                    : bRollPercent > 0
                      ? "text-warning"
                      : "text-text-secondary"
                )}
              >
                {bRollPercent === 100 ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span className="text-style-caption text-text-primary">{t("kanban.bRoll")}</span>
              <span className="text-[10px] font-mono text-text-disabled">
                {bRollDone}/{bRollShots.length}
              </span>
            </div>
            <span className="text-style-label text-[10px] text-text-secondary">
              {bRollPercent}%
            </span>
          </div>
          <ProgressBar
            total={Math.max(bRollShots.length, 1)}
            filled={bRollDone}
            height="h-[4px]"
            filledColor="bg-success"
          />
          {bRollShots.length > 0 && (
            <div className="mt-2 flex flex-col gap-0.5">
              {bRollShots.map((shot) => (
                <ShotRow
                  key={shot.id}
                  shot={shot}
                  onToggle={(id) => toggleShot("b", id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-sm pt-sm border-t border-border pl-2">
        <div className="text-style-caption text-text-secondary">
          #{project.id.slice(-6).toUpperCase()}
        </div>
        {assignees.length > 0 ? (
          <div className="flex items-center">
            {assignees.map((assignee, index) => (
              <div
                key={assignee.id}
                className={cn(
                  "w-7 h-7 border border-border-visible bg-surface-raised text-text-primary text-xs font-mono flex items-center justify-center overflow-hidden",
                  index > 0 ? "-ml-2" : "ml-0"
                )}
                style={{ zIndex: assignees.length - index }}
                title={assignee.name}
              >
                {assignee.avatarUrl ? (
                  <Image
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{getInitials(assignee.name)}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

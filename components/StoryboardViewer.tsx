"use client";

import { useState } from "react";

/**
 * StoryboardViewer - Shoot-plan cards for content creators
 * Displays recommended tone/style, shot type, camera, action, dialogue, production notes
 */

export interface ShootRecommendations {
  tone: string;
  style: string;
  lighting: string;
  pacing: string;
  equipment: string;
  locationTips: string;
  otherNotes: string;
}

export interface ReferenceInspiration {
  references: Array<{
    name: string;
    type: string;
    whyItWorks: string;
    keyElements: string[];
    searchHint?: string;
  }>;
  trendSummary: string;
  breakdown: string;
}

export interface ProductionChecklist {
  props: string[];
  peopleRequired: string[];
  permissions: string[];
  safety: string[];
  scheduleNotes?: string;
  weatherNotes?: string;
  budgetNotes?: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  shotType: string;
  cameraAngle: string;
  action: string;
  dialogue: string;
  notes: string;
  description?: string;
  imageBase64?: string;
  mimeType?: string;
}

interface StoryboardViewerProps {
  recommendations?: ShootRecommendations | null;
  scenes: StoryboardScene[];
  script?: string;
  fullScript?: string;
  productionChecklist?: ProductionChecklist | null;
  referenceInspiration?: ReferenceInspiration | null;
  editable?: boolean;
  onProductionChecklistChange?: (checklist: ProductionChecklist) => void;
  onSceneNotesChange?: (sceneNumber: number, notes: string) => void;
}

const EditableField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
      {label}
    </p>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      placeholder={`Edit ${label.toLowerCase()}...`}
    />
  </div>
);

const RecItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) =>
  value ? (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  ) : null;

function hasChecklistContent(c: ProductionChecklist): boolean {
  return (
    c.props.length > 0 ||
    c.peopleRequired.length > 0 ||
    c.permissions.length > 0 ||
    c.safety.length > 0 ||
    !!c.scheduleNotes ||
    !!c.weatherNotes ||
    !!c.budgetNotes
  );
}

const ChecklistSection = ({
  title,
  items,
  icon,
  sectionId,
  checked,
  onToggle,
}: {
  title: string;
  items: string[];
  icon: string;
  sectionId: string;
  checked: Set<string>;
  onToggle: (id: string) => void;
}) =>
  items.length > 0 ? (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {icon} {title}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-slate-800 dark:text-slate-200">
        {items.map((item, i) => {
          const id = `${sectionId}-${i}`;
          const isChecked = checked.has(id);
          return (
            <li key={i} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onToggle(id)}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-xs transition-colors hover:border-emerald-500 dark:border-slate-600 dark:bg-slate-800"
                aria-label={isChecked ? "Uncheck" : "Check"}
              >
                {isChecked ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                ) : null}
              </button>
              <span
                className={
                  isChecked ? "text-slate-500 line-through dark:text-slate-400" : ""
                }
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

export default function StoryboardViewer({
  recommendations,
  scenes,
  script,
  fullScript,
  productionChecklist,
  referenceInspiration,
  editable = false,
  onProductionChecklistChange,
  onSceneNotesChange,
}: StoryboardViewerProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (scenes.length === 0) return null;

  const hasRecs =
    recommendations &&
    (recommendations.tone ||
      recommendations.style ||
      recommendations.lighting ||
      recommendations.equipment);

  return (
    <div className="space-y-6">
      {/* Recommended tone, style, and production details */}
      {hasRecs && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Recommended for your shoot
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <RecItem label="Tone" value={recommendations.tone} />
            <RecItem label="Style" value={recommendations.style} />
            <RecItem label="Lighting" value={recommendations.lighting} />
            <RecItem label="Pacing" value={recommendations.pacing} />
            <RecItem label="Equipment" value={recommendations.equipment} />
            <RecItem label="Location tips" value={recommendations.locationTips} />
            {recommendations.otherNotes && (
              <div className="sm:col-span-2">
                <RecItem label="Other notes" value={recommendations.otherNotes} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* References & Trends - agentic research for better planning */}
      {referenceInspiration &&
        (referenceInspiration.references.length > 0 ||
          referenceInspiration.trendSummary ||
          referenceInspiration.breakdown) && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-5 dark:border-violet-800/50 dark:bg-violet-950/20">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
            References & trends
          </p>
          <p className="mb-4 text-xs text-violet-600/80 dark:text-violet-400/80">
            Trending examples and breakdown to inform your plan
          </p>
          {referenceInspiration.trendSummary && (
            <div className="mb-4">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
                What&apos;s working now
              </p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {referenceInspiration.trendSummary}
              </p>
            </div>
          )}
          {referenceInspiration.references.length > 0 && (
            <div className="mb-4 space-y-4">
              {referenceInspiration.references.map((ref, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-violet-200/60 bg-white p-3 dark:border-violet-700/50 dark:bg-slate-800/50"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {ref.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {ref.type}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {ref.whyItWorks}
                  </p>
                  {ref.keyElements.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {ref.keyElements.map((el, j) => (
                        <li
                          key={j}
                          className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
                        >
                          {el}
                        </li>
                      ))}
                    </ul>
                  )}
                  {ref.searchHint && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Search: {ref.searchHint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {referenceInspiration.breakdown && (
            <div>
              <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
                Breakdown
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                {referenceInspiration.breakdown}
              </p>
            </div>
          )}
        </div>
      )}

      {script && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Production summary
          </p>
          <p className="mt-1 text-sm text-indigo-900 dark:text-indigo-100">
            {script}
          </p>
        </div>
      )}

      {fullScript && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Full script
          </p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {fullScript}
          </pre>
        </div>
      )}

      {productionChecklist &&
        (hasChecklistContent(productionChecklist) || editable) && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Shoot day bible
          </p>
          <p className="mb-4 text-xs text-emerald-600/80 dark:text-emerald-400/80">
            Your one-page reference — tick off as you go
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChecklistSection
              title="Props"
              items={productionChecklist.props}
              icon="📦"
              sectionId="props"
              checked={checkedItems}
              onToggle={toggleCheck}
            />
            <ChecklistSection
              title="People required"
              items={productionChecklist.peopleRequired}
              icon="👥"
              sectionId="people"
              checked={checkedItems}
              onToggle={toggleCheck}
            />
            <ChecklistSection
              title="Permissions & releases"
              items={productionChecklist.permissions}
              icon="📋"
              sectionId="permissions"
              checked={checkedItems}
              onToggle={toggleCheck}
            />
            <ChecklistSection
              title="Safety"
              items={productionChecklist.safety}
              icon="⚠️"
              sectionId="safety"
              checked={checkedItems}
              onToggle={toggleCheck}
            />
            {(productionChecklist.scheduleNotes || editable) && (
              <div className="sm:col-span-2">
                {editable && onProductionChecklistChange ? (
                  <EditableField
                    label="Schedule"
                    value={productionChecklist.scheduleNotes ?? ""}
                    onChange={(v) =>
                      onProductionChecklistChange({
                        ...productionChecklist,
                        scheduleNotes: v || undefined,
                      })
                    }
                  />
                ) : (
                  <RecItem
                    label="Schedule"
                    value={productionChecklist.scheduleNotes ?? ""}
                  />
                )}
              </div>
            )}
            {(productionChecklist.weatherNotes || editable) && (
              <div className="sm:col-span-2">
                {editable && onProductionChecklistChange ? (
                  <EditableField
                    label="Weather considerations"
                    value={productionChecklist.weatherNotes ?? ""}
                    onChange={(v) =>
                      onProductionChecklistChange({
                        ...productionChecklist,
                        weatherNotes: v || undefined,
                      })
                    }
                  />
                ) : (
                  <RecItem
                    label="Weather considerations"
                    value={productionChecklist.weatherNotes ?? ""}
                  />
                )}
              </div>
            )}
            {(productionChecklist.budgetNotes || editable) && (
              <div className="sm:col-span-2">
                {editable && onProductionChecklistChange ? (
                  <EditableField
                    label="Budget notes"
                    value={productionChecklist.budgetNotes ?? ""}
                    onChange={(v) =>
                      onProductionChecklistChange({
                        ...productionChecklist,
                        budgetNotes: v || undefined,
                      })
                    }
                  />
                ) : (
                  <RecItem
                    label="Budget notes"
                    value={productionChecklist.budgetNotes ?? ""}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Optional thumbnail */}
              <div className="h-32 w-full shrink-0 bg-slate-100 sm:h-auto sm:w-48 dark:bg-slate-900">
                {scene.imageBase64 ? (
                  <img
                    src={`data:${scene.mimeType ?? "image/png"};base64,${scene.imageBase64}`}
                    alt={`Scene ${scene.sceneNumber}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <span className="text-xs">Shot {scene.sceneNumber}</span>
                  </div>
                )}
              </div>

              {/* Production details */}
              <div className="flex-1 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                    Scene {scene.sceneNumber}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {scene.shotType}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    {scene.cameraAngle}
                  </span>
                </div>

                <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {scene.action}
                </p>

                {scene.dialogue && (
                  <p className="mb-2 border-l-2 border-indigo-300 pl-3 text-sm italic text-slate-600 dark:border-indigo-700 dark:text-slate-400">
                    &ldquo;{scene.dialogue}&rdquo;
                  </p>
                )}

                {editable && onSceneNotesChange ? (
                  <div>
                    <label className="text-xs font-medium text-slate-500">
                      Notes
                    </label>
                    <textarea
                      value={scene.notes}
                      onChange={(e) =>
                        onSceneNotesChange(scene.sceneNumber, e.target.value)
                      }
                      rows={2}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      placeholder="Edit scene notes..."
                    />
                  </div>
                ) : (
                  scene.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      <span className="font-medium">Notes:</span> {scene.notes}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

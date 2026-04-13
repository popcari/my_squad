'use client';

import type { FormationSlot } from '@/types/formation';

export interface FootballPitchSlot extends FormationSlot {
  id?: string;
}

interface FootballPitchProps {
  slots: FootballPitchSlot[];
  renderSlot?: (slot: FootballPitchSlot, index: number) => React.ReactNode;
  onSlotDrop?: (slotIndex: number, data: string) => void;
  onSlotMove?: (slotIndex: number, x: number, y: number) => void;
  className?: string;
}

/**
 * Visual football pitch (7-a-side). Slots use (x,y) percent coordinates where
 * x = horizontal (0-100 left-right) and y = vertical (0 = own goal, 100 =
 * opponent goal). The pitch is RENDERED flipped so y=0 appears at the BOTTOM
 * of the screen — goalkeeper end at the bottom, attackers at the top.
 */
export function FootballPitch({
  slots,
  renderSlot,
  onSlotDrop,
  onSlotMove,
  className,
}: FootballPitchProps) {
  const handleDragOver = (e: React.DragEvent) => {
    if (onSlotDrop) e.preventDefault();
  };

  const handlePitchClick = (
    e: React.MouseEvent<HTMLDivElement>,
    slotIndex: number,
  ) => {
    if (!onSlotMove) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    // Pitch renders flipped (y=0 at bottom), so invert from screen coords.
    const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
    onSlotMove(slotIndex, x, y);
  };

  return (
    <div
      className={`relative w-full aspect-[2/3] overflow-hidden rounded-lg border-2 border-white/30 ${
        className ?? ''
      }`}
      style={{
        background:
          'linear-gradient(180deg, #166534 0%, #15803d 50%, #166534 100%)',
      }}
    >
      {/* Pitch markings */}
      <svg
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Outer boundary */}
        <rect
          x="4"
          y="4"
          width="92"
          height="142"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        {/* Halfway line */}
        <line
          x1="4"
          y1="75"
          x2="96"
          y2="75"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        {/* Center circle */}
        <circle
          cx="50"
          cy="75"
          r="9"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        <circle cx="50" cy="75" r="0.6" fill="white" fillOpacity="0.7" />
        {/* Top penalty area */}
        <rect
          x="25"
          y="4"
          width="50"
          height="14"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        {/* Top goal */}
        <rect
          x="40"
          y="4"
          width="20"
          height="4"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        {/* Bottom penalty area */}
        <rect
          x="25"
          y="132"
          width="50"
          height="14"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
        {/* Bottom goal */}
        <rect
          x="40"
          y="142"
          width="20"
          height="4"
          fill="none"
          stroke="white"
          strokeWidth="0.4"
          strokeOpacity="0.7"
        />
      </svg>

      {/* Slots */}
      {slots.map((slot, i) => (
        <div
          key={slot.id ?? i}
          data-slot-index={i}
          className="absolute"
          style={{
            left: `${slot.x}%`,
            // Render flipped: data y=0 → bottom, y=100 → top.
            top: `${100 - slot.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => {
            if (!onSlotDrop) return;
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            onSlotDrop(i, data);
          }}
          onClick={(e) => handlePitchClick(e, i)}
        >
          {renderSlot ? (
            renderSlot(slot, i)
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/90 text-green-800 font-bold text-xs flex items-center justify-center border-2 border-white shadow-lg">
              {slot.role}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

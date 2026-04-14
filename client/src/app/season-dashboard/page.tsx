'use client';

import { MatchesPageSkeleton } from '@/components/shared/skeleton';
import { Lightbox } from '@/components/ui/lightbox';
import { Select } from '@/components/ui/select';
import { MATCH_STATUS } from '@/constant/enum';
import { matchesService, usersService } from '@/services';
import type { MatchGoal, MatchLineup, User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const RANGE_OPTIONS = [1, 3, 6, 12] as const;
type Range = (typeof RANGE_OPTIONS)[number];

interface Row {
  userId: string;
  displayName: string;
  jerseyNumber?: number;
  avatar?: string;
  count: number;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({
  name,
  src,
  size = 28,
  ring,
}: {
  name: string;
  src?: string;
  size?: number;
  ring?: string;
}) {
  const ringClass = ring ?? '';
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden shrink-0 ${ringClass}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.35 }}>{initialsOf(name)}</span>
      )}
    </div>
  );
}

function monthsAgoCutoff(months: number): number {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.getTime();
}

function sortedNonZero(rows: Row[]): Row[] {
  return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

function buildRow(users: User[], tally: Map<string, number>): Row[] {
  return users.map((u) => ({
    userId: u.id,
    displayName: u.displayName,
    jerseyNumber: u.jerseyNumber,
    avatar: u.avatar,
    count: tally.get(u.id) ?? 0,
  }));
}

type RankedRow = Row & { rank: number };

interface PodiumItemProps {
  row: RankedRow;
  size: number;
  crown?: boolean;
  ring: string;
  unit: string;
}

function AvatarWithLightbox(props: {
  name: string;
  src?: string;
  size: number;
  ring?: string;
}) {
  const avatar = <Avatar {...props} />;
  if (!props.src) return avatar;
  return (
    <Lightbox src={props.src} alt={props.name}>
      {avatar}
    </Lightbox>
  );
}

function PodiumItem({ row, size, crown, ring, unit }: PodiumItemProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 min-w-0"
      data-testid={`row-${row.userId}`}
    >
      <div className="relative">
        {crown && (
          <span
            aria-hidden
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg"
          >
            👑
          </span>
        )}
        <AvatarWithLightbox
          name={row.displayName}
          src={row.avatar}
          size={size}
          ring={ring}
        />
      </div>
      <Link
        href={`/players/${row.userId}`}
        className="text-[11px] md:text-xs font-medium truncate max-w-[90px] text-center hover:text-primary hover:underline"
      >
        {row.displayName}
      </Link>
      <div className="flex items-baseline gap-0.5">
        <span
          data-testid={`row-count-${row.userId}`}
          className="text-xs font-bold text-primary"
        >
          {row.count}
        </span>
        <span className="text-[9px] font-normal text-muted uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
}

interface RankCardProps {
  title: string;
  icon: string;
  rows: Row[];
  unitShort: string;
  emptyText: string;
}

function RankCard({ title, icon, rows, unitShort, emptyText }: RankCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const ranked = rows.reduce<RankedRow[]>((acc, r, i) => {
    const prev = acc[acc.length - 1];
    const rank = prev && prev.count === r.count ? prev.rank : i + 1;
    acc.push({ ...r, rank });
    return acc;
  }, []);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const visibleRest = expanded ? rest : [];

  return (
    <section className="bg-card rounded-lg overflow-hidden flex flex-col">
      <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted">
        <span aria-hidden className="text-lg">
          {icon}
        </span>
        {title}
      </h2>
      {ranked.length === 0 ? (
        <p className="text-xs text-muted py-8 px-4 text-center">{emptyText}</p>
      ) : (
        <>
          {/* Podium — 2nd, 1st (center, larger + crown), 3rd */}
          <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent px-3 pt-8 pb-4">
            <div className="flex items-end justify-center gap-3 md:gap-4">
              {podium[1] ? (
                <PodiumItem
                  row={podium[1]}
                  size={44}
                  ring="ring-2 ring-slate-400"
                  unit={unitShort}
                />
              ) : (
                <div className="w-11" />
              )}
              {podium[0] && (
                <PodiumItem
                  row={podium[0]}
                  size={64}
                  crown
                  ring="ring-2 ring-yellow-400"
                  unit={unitShort}
                />
              )}
              {podium[2] ? (
                <PodiumItem
                  row={podium[2]}
                  size={44}
                  ring="ring-2 ring-orange-600/70"
                  unit={unitShort}
                />
              ) : (
                <div className="w-11" />
              )}
            </div>
          </div>

          {/* Rest list (rank 4+) — collapsible after 5 rows */}
          {rest.length > 0 && (
            <ul className="flex flex-col divide-y divide-border">
              {visibleRest.map((r) => (
                <li
                  key={r.userId}
                  className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm"
                  data-testid={`row-${r.userId}`}
                >
                  <span className="w-5 shrink-0 text-center text-muted font-semibold">
                    {r.rank}
                  </span>
                  <AvatarWithLightbox
                    name={r.displayName}
                    src={r.avatar}
                    size={28}
                  />
                  <Link
                    href={`/players/${r.userId}`}
                    className="flex-1 truncate min-w-0 hover:text-primary hover:underline"
                  >
                    {r.displayName}
                  </Link>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span
                      data-testid={`row-count-${r.userId}`}
                      className="font-bold text-primary"
                    >
                      {r.count}
                    </span>
                    <span className="text-[10px] text-muted">{unitShort}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full py-2 text-xs font-medium text-primary hover:bg-card-hover transition-colors border-t border-border"
            >
              {expanded
                ? t('seasonDashboard.showLess')
                : t('seasonDashboard.showMore', { count: rest.length })}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default function SeasonDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>(1);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<
    { id: string; matchDate: string; status: string }[]
  >([]);
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, g, l, u] = await Promise.all([
          matchesService.getAll(),
          matchesService.getAllGoals(),
          matchesService.getAllLineups(),
          usersService.getAll(),
        ]);
        setMatches(m);
        setGoals(g);
        setLineups(l);
        setUsers(u);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const aggregates = useMemo(() => {
    const cutoff = monthsAgoCutoff(range);
    const completedIds = new Set(
      matches
        .filter(
          (m) =>
            m.status === MATCH_STATUS.COMPLETED &&
            new Date(m.matchDate).getTime() >= cutoff,
        )
        .map((m) => m.id),
    );

    const scorerTally = new Map<string, number>();
    goals
      .filter((g) => completedIds.has(g.matchId))
      .forEach((g) =>
        scorerTally.set(g.scorerId, (scorerTally.get(g.scorerId) ?? 0) + 1),
      );

    const assistTally = new Map<string, number>();
    goals
      .filter((g) => completedIds.has(g.matchId) && g.assistId)
      .forEach((g) => {
        const aid = g.assistId as string;
        assistTally.set(aid, (assistTally.get(aid) ?? 0) + 1);
      });

    const attendanceTally = new Map<string, number>();
    const seen = new Set<string>();
    lineups
      .filter((l) => completedIds.has(l.matchId))
      .forEach((l) => {
        const key = `${l.userId}:${l.matchId}`;
        if (seen.has(key)) return;
        seen.add(key);
        attendanceTally.set(l.userId, (attendanceTally.get(l.userId) ?? 0) + 1);
      });

    return {
      scorers: sortedNonZero(buildRow(users, scorerTally)),
      assisters: sortedNonZero(buildRow(users, assistTally)),
      attendance: sortedNonZero(buildRow(users, attendanceTally)),
    };
  }, [matches, goals, lineups, users, range]);

  if (loading) return <MatchesPageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('seasonDashboard.title')}</h1>
        <div className="w-40">
          <Select
            data-testid="range-select"
            aria-label={t('seasonDashboard.rangeLabel')}
            value={String(range)}
            onChange={(e) => setRange(Number(e.target.value) as Range)}
          >
            {RANGE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {t(`seasonDashboard.range.${n}m`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-start">
        <RankCard
          title={t('seasonDashboard.topScorers')}
          icon="⚽"
          rows={aggregates.scorers}
          unitShort={t('seasonDashboard.unit.goals')}
          emptyText={t('seasonDashboard.noData')}
        />
        <RankCard
          title={t('seasonDashboard.topAssisters')}
          icon="🎯"
          rows={aggregates.assisters}
          unitShort={t('seasonDashboard.unit.assists')}
          emptyText={t('seasonDashboard.noData')}
        />
        <RankCard
          title={t('seasonDashboard.topAttendance')}
          icon="📅"
          rows={aggregates.attendance}
          unitShort={t('seasonDashboard.unit.matches')}
          emptyText={t('seasonDashboard.noData')}
        />
      </div>
    </div>
  );
}

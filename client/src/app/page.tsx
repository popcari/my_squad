'use client';

import { Calendar } from '@/components/calendar';
import { ScoreModal } from '@/components/score-modal';
import { HomePageSkeleton } from '@/components/shared/skeleton';
import { InputText } from '@/components/ui/input-text';
import { MATCH_RESULT_TYPES, MATCH_STATUS } from '@/constant/enum';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  createMatchSchema,
  type CreateMatchForm,
} from '@/schemas/create-match.schema';
import { matchesService } from '@/services';
import { teamSettingsService } from '@/services/team-settings.service';
import type { Match } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamName, setTeamName] = useState('default');
  const [loading, setLoading] = useState(true);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T15:00`;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateMatchForm>({
    resolver: zodResolver(createMatchSchema),
    mode: 'onTouched',
    defaultValues: {
      opponent: '',
      matchDate: todayStr,
      location: '',
      notes: '',
    },
  });

  const loadMatches = async (year: number, month: number) => {
    setLoading(true);
    const data = await matchesService.getByMonth(year, month + 1);
    setMatches(data);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const settings = await teamSettingsService.get();
      setTeamName(settings.name || 'My Squad');
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await matchesService.getByMonth(calYear, calMonth + 1);
      setMatches(data);
      setLoading(false);
    };
    load();
  }, [calYear, calMonth]);

  // Matches for selected date
  const selectedMatches = useMemo(() => {
    if (!selectedDate) return null;
    return matches.filter((m) => {
      const d = new Date(m.matchDate);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dateStr === selectedDate;
    });
  }, [selectedDate, matches]);

  const handlePrev = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else setCalMonth(calMonth - 1);
  };

  const handleNext = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else setCalMonth(calMonth + 1);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
    if (canManage) {
      setValue('matchDate', `${date}T15:00`);
    }
  };

  const onCreateMatch = async (data: CreateMatchForm) => {
    const ok = await confirm({
      title: t('home.createMatch'),
      message: t('home.createMatchConfirm', { opponent: data.opponent }),
      confirmText: t('common.create'),
    });
    if (!ok) return;
    await matchesService.create({
      ...data,
      matchDate: new Date(data.matchDate).toISOString(),
    });
    reset({ opponent: '', matchDate: todayStr, location: '', notes: '' });
    setShowForm(false);
    loadMatches(calYear, calMonth);
  };

  const handleOpenScore = (m: Match) => {
    setScoreMatch(m);
  };

  const handleScoreSaved = () => {
    setScoreMatch(null);
    loadMatches(calYear, calMonth);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('home.deleteMatch'),
      message: t('home.deleteMatchConfirm'),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await matchesService.remove(id);
    loadMatches(calYear, calMonth);
  };

  const matchResult = (m: Match): `${MATCH_RESULT_TYPES}` | null => {
    if (
      m.status !== MATCH_STATUS.COMPLETED ||
      m.homeScore == null ||
      m.awayScore == null
    )
      return null;
    if (m.homeScore > m.awayScore) return MATCH_RESULT_TYPES.WIN;
    if (m.homeScore < m.awayScore) return MATCH_RESULT_TYPES.LOSE;
    return MATCH_RESULT_TYPES.DRAW;
  };

  const resultColor = (r: `${MATCH_RESULT_TYPES}` | null) => {
    if (r === MATCH_RESULT_TYPES.WIN) return 'text-accent';
    if (r === MATCH_RESULT_TYPES.LOSE) return 'text-danger';
    if (r === MATCH_RESULT_TYPES.DRAW) return 'text-yellow-400';
    return 'text-muted';
  };

  const resultDot = (m: Match) => {
    const r = matchResult(m);
    if (r === MATCH_RESULT_TYPES.WIN) return 'bg-accent';
    if (r === MATCH_RESULT_TYPES.LOSE) return 'bg-danger';
    if (r === MATCH_RESULT_TYPES.DRAW) return 'bg-yellow-400';
    if (m.status === MATCH_STATUS.CANCELLED) return 'bg-danger';
    return 'bg-primary';
  };

  const monthLabel = new Date(calYear, calMonth).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const renderMatchCard = (m: Match) => (
    <div
      key={m.id}
      className="bg-card-hover p-3 rounded-lg flex items-center gap-3 group transition-colors hover:bg-border/50 cursor-pointer"
      onClick={() => handleOpenScore(m)}
    >
      <div className="flex-shrink-0 w-12 h-12 bg-background rounded-lg flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none">
          {new Date(m.matchDate).getDate()}
        </span>
        <span className="text-[10px] text-muted uppercase">
          {new Date(m.matchDate).toLocaleDateString('vi-VN', { weekday: 'short' })}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${resultDot(m)}`}
          />
          <span className="font-medium truncate">
            {teamName} <span className="text-muted font-normal">vs</span>{' '}
            {m.opponent}
          </span>
          {m.status === MATCH_STATUS.COMPLETED && (
            <span
              className={`text-sm font-bold ml-auto flex-shrink-0 ${resultColor(matchResult(m))}`}
            >
              {m.homeScore} - {m.awayScore}
            </span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5">
          {new Date(m.matchDate).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' · '}
          {m.location}
        </div>
      </div>

      {canManage && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(m.id);
            }}
            className="px-2 py-1 bg-danger/20 text-danger rounded text-xs hover:bg-danger/30"
          >
            {t('home.del')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('home.matchSchedule')}</h1>

      {loading ? (
        <HomePageSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Calendar + Form (60%) */}
          <div className="lg:col-span-3 space-y-4">
            <Calendar
              year={calYear}
              month={calMonth}
              matches={matches}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrev={handlePrev}
              onNext={handleNext}
            />

            {selectedDate && selectedMatches && (
              <div className="bg-card rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">
                  {new Date(selectedDate + 'T00:00').toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                {selectedMatches.length === 0 ? (
                  <p className="text-xs text-muted">
                    {t('home.noMatchesOnDay')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedMatches.map(renderMatchCard)}
                  </div>
                )}
              </div>
            )}

            {canManage && (
              <div className="bg-card rounded-lg p-4">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="w-full text-sm font-medium text-primary hover:text-primary-hover transition-colors text-left"
                >
                  {showForm ? t('home.cancelCreate') : t('home.createNewMatch')}
                </button>
                {showForm && (
                  <form
                    onSubmit={handleSubmit(onCreateMatch)}
                    className="mt-3 space-y-3"
                  >
                    <InputText
                      placeholder={t('home.opponent')}
                      error={errors.opponent}
                      required
                      {...register('opponent')}
                    />
                    <InputText
                      type="datetime-local"
                      error={errors.matchDate}
                      required
                      {...register('matchDate')}
                    />
                    <InputText
                      placeholder={t('home.location')}
                      error={errors.location}
                      required
                      {...register('location')}
                    />
                    <InputText
                      placeholder={t('home.notesOptional')}
                      {...register('notes')}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      {isSubmitting
                        ? t('common.creating')
                        : t('home.createMatch')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right: Match list for current month */}
          <div className="lg:col-span-2">
            {matches.length === 0 ? (
              <div className="bg-card rounded-lg p-8 text-center">
                <p className="text-muted">
                  {t('home.noMatchesInMonth', { month: monthLabel })}
                </p>
                {canManage && (
                  <p className="text-xs text-muted mt-1">
                    {t('home.clickDateToStart')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
                    {monthLabel}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted">
                    {matches.length}{' '}
                    {matches.length > 1 ? t('home.matches') : t('home.match')}
                  </span>
                </div>
                <div className="space-y-2">{matches.map(renderMatchCard)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {scoreMatch && (
        <ScoreModal
          match={scoreMatch}
          teamName={teamName}
          canManage={canManage}
          onClose={() => setScoreMatch(null)}
          onSaved={handleScoreSaved}
        />
      )}
    </div>
  );
}

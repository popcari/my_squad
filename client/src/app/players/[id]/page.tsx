'use client';

import { positionsService, traitsService, usersService } from '@/services';
import type { PlayerProfile, Position, Trait } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [allTraits, setAllTraits] = useState<Trait[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, pos, traits] = await Promise.all([
        usersService.getProfile(id),
        positionsService.getAll(),
        traitsService.getAll(),
      ]);
      setProfile(p);
      setAllPositions(pos);
      setAllTraits(traits);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!profile) return <p className="text-danger">Player not found.</p>;

  const positionNames = profile.positions.map((up) => {
    const pos = allPositions.find((p) => p.id === up.positionId);
    return pos?.name || up.positionId;
  });

  const traitData = profile.traits.map((ut) => {
    const trait = allTraits.find((t) => t.id === ut.traitId);
    return { name: trait?.name || ut.traitId, rating: ut.rating };
  });

  const maxRating = 100;

  return (
    <div>
      <Link
        href="/players"
        className="text-sm text-muted hover:text-primary mb-4 inline-block"
      >
        &larr; Back to Players
      </Link>

      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
            {profile.jerseyNumber || '#'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-sm text-muted">{profile.email}</p>
            <div className="flex gap-2 mt-2">
              {positionNames.map((name) => (
                <span
                  key={name}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
                >
                  {name}
                </span>
              ))}
              <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium capitalize">
                {profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {profile.stats.goals}
              </div>
              <div className="text-sm text-muted">Goals</div>
            </div>
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-accent">
                {profile.stats.assists}
              </div>
              <div className="text-sm text-muted">Assists</div>
            </div>
          </div>
        </div>

        {/* Traits */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Traits</h2>
          {traitData.length === 0 ? (
            <p className="text-sm text-muted">No traits assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {traitData.map((t) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t.name}</span>
                    <span className="text-muted">
                      {t.rating}/{maxRating}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(t.rating / maxRating) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

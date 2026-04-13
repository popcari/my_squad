export enum MATCH_RESULT_TYPES {
  WIN = 'win',
  LOSE = 'lose',
  DRAW = 'draw',
}

export enum MATCH_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CONTRIBUTION_TYPE {
  RECURRING = 'recurring',
  DONATION = 'donation',
}

export enum USER_ROLE {
  PRESIDENT = 'president',
  COACH = 'coach',
  PLAYER = 'player',
}

export enum LINEUP_TYPE {
  STARTING = 'starting',
  SUBSTITUTE = 'substitute',
}

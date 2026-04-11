export const VN_CURRENCY = 'VND';

export const POSITION_GROUPS = {
  GK: {
    roles: ['GK'],
    colorClass: 'bg-yellow-500/20 text-yellow-500',
    weight: 1,
  },
  DEFENDER: {
    roles: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
    colorClass: 'bg-blue-500/20 text-blue-500',
    weight: 2,
  },
  MIDFIELDER: {
    roles: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
    colorClass: 'bg-green-500/20 text-green-500',
    weight: 3,
  },
  ATTACKER: {
    roles: ['ST', 'CF', 'LW', 'RW'],
    colorClass: 'bg-red-500/20 text-red-500',
    weight: 4,
  },
  UNKNOWN: {
    roles: [] as string[],
    colorClass: 'bg-gray-500/20 text-gray-500',
    weight: 5,
  },
};

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

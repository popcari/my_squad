/** Vietnamese phone: 03x, 05x, 07x, 08x, 09x — 10 digits */
export const PHONE_VN_REGEX = /^(0[3|5|7|8|9])\d{8}$/;

/** At least 1 uppercase letter */
export const HAS_UPPERCASE_REGEX = /[A-Z]/;

/** At least 1 digit */
export const HAS_NUMBER_REGEX = /\d/;

/** Email basic format */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

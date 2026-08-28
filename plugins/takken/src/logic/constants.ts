// Short, ticking timers are the whole point of the "hell" mode: they force a
// quick gut-check recall instead of slow, careful re-reading.
export const MARU_BATSU_TIME_SEC = 12;
export const KOSUU_TIME_SEC = 30;

export const MARU_BATSU_SESSION_LEN = 10;
export const KOSUU_SESSION_LEN = 5;

export const XP_MARU_BATSU_CORRECT = 10;
export const XP_KOSUU_CORRECT = 25;
export const XP_SPEED_BONUS_MARU = 5;
export const XP_SPEED_BONUS_KOSUU = 10;
export const XP_COMBO_BONUS = 15;
export const COMBO_BONUS_EVERY = 3;

// Chat-command quiz (/宅建問題, /宅建回答) has no visual countdown, so the
// "fast answer" XP bonus instead uses a generous wall-clock window measured
// from when the question message was posted.
export const CHAT_FAST_SECONDS_MARU = 20;
export const CHAT_FAST_SECONDS_KOSUU = 45;

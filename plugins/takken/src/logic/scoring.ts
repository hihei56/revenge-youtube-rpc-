import {
    COMBO_BONUS_EVERY,
    XP_COMBO_BONUS,
    XP_KOSUU_CORRECT,
    XP_MARU_BATSU_CORRECT,
    XP_SPEED_BONUS_KOSUU,
    XP_SPEED_BONUS_MARU,
} from "./constants";
import type { Mode } from "../types";

// Shared by the Settings-screen quiz and the chat-command quiz so both
// award XP the same way. `comboAfter` is the combo count *after* this
// answer (0 if the answer was wrong).
export function computeXpForAnswer(mode: Mode, isCorrect: boolean, fast: boolean, comboAfter: number): number {
    if (!isCorrect) return 0;

    let gained = mode === "maru_batsu" ? XP_MARU_BATSU_CORRECT : XP_KOSUU_CORRECT;
    if (fast) gained += mode === "maru_batsu" ? XP_SPEED_BONUS_MARU : XP_SPEED_BONUS_KOSUU;
    if (comboAfter > 0 && comboAfter % COMBO_BONUS_EVERY === 0) gained += XP_COMBO_BONUS;
    return gained;
}

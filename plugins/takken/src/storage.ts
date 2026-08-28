import { storage } from "@vendetta/plugin";

import type { QuestionStat, SessionRecord } from "./types";

export const vstorage = storage as {
    xp: number;
    totalAnswered: number;
    totalCorrect: number;
    bestCombo: number;
    chatCombo: number;
    sessions: SessionRecord[];
    qstats: Record<string, QuestionStat>;
};

const MAX_SESSIONS_KEPT = 30;

export function initStorage() {
    vstorage.xp ??= 0;
    vstorage.totalAnswered ??= 0;
    vstorage.totalCorrect ??= 0;
    vstorage.bestCombo ??= 0;
    vstorage.chatCombo ??= 0;
    vstorage.sessions ??= [];
    vstorage.qstats ??= {};
}

export function pushSession(record: SessionRecord) {
    vstorage.sessions.unshift(record);
    if (vstorage.sessions.length > MAX_SESSIONS_KEPT) {
        vstorage.sessions.length = MAX_SESSIONS_KEPT;
    }
}

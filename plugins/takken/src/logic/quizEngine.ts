import { KOSUU, MARU_BATSU } from "../data/questions";
import { vstorage } from "../storage";
import type { Category, KosuuQuestion, MaruBatsuQuestion, QuestionStat } from "../types";

function weightFor(id: string): number {
    const stat: QuestionStat | undefined = vstorage.qstats[id];
    if (!stat) return 5; // never-seen questions are prioritized for coverage

    const daysSince = (Date.now() - stat.lastSeen) / (1000 * 60 * 60 * 24);
    // Wrong answers and longer gaps since last review raise the odds of
    // resurfacing a question — a simple stand-in for spaced repetition.
    return 1 + stat.wrongStreak * 2 + Math.min(daysSince, 14) / 3;
}

function weightedSample<T extends { id: string }>(pool: T[], count: number): T[] {
    const remaining = [...pool];
    const picked: T[] = [];

    while (remaining.length && picked.length < count) {
        const weights = remaining.map(q => weightFor(q.id));
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        let index = 0;
        for (; index < weights.length - 1; index++) {
            roll -= weights[index];
            if (roll <= 0) break;
        }
        picked.push(remaining[index]);
        remaining.splice(index, 1);
    }

    return picked;
}

export function pickMaruBatsuSession(category: Category | "all", count: number): MaruBatsuQuestion[] {
    const pool = category === "all" ? MARU_BATSU : MARU_BATSU.filter(q => q.category === category);
    return weightedSample(pool, count);
}

export function pickKosuuSession(category: Category | "all", count: number): KosuuQuestion[] {
    const pool = category === "all" ? KOSUU : KOSUU.filter(q => q.category === category);
    return weightedSample(pool, count);
}

export function recordAnswer(id: string, correct: boolean) {
    const stat = vstorage.qstats[id] ?? { seen: 0, correct: 0, wrongStreak: 0, lastSeen: 0 };
    stat.seen += 1;
    stat.lastSeen = Date.now();
    if (correct) {
        stat.correct += 1;
        stat.wrongStreak = 0;
    } else {
        stat.wrongStreak += 1;
    }
    vstorage.qstats[id] = stat;
}

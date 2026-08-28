export const RANKS: { level: number; title: string }[] = [
    { level: 1, title: "宅建ひよこ🐣" },
    { level: 3, title: "重要事項見習い📄" },
    { level: 5, title: "契約書アシスタント✍️" },
    { level: 8, title: "重説マイスター🎓" },
    { level: 12, title: "宅建士補🏠" },
    { level: 16, title: "登録実務講習修了者🏅" },
    { level: 20, title: "宅建士(仮)🔰" },
    { level: 25, title: "専任の宅建士⭐" },
    { level: 30, title: "宅建マスター👑" },
    { level: 40, title: "伝説の宅建士🐉" },
];

const XP_PER_LEVEL_BASE = 50;

// Cumulative XP required to *reach* a given level (level 1 = 0 XP). Growth is
// triangular (level 2 costs 50, level 3 another 100, ...) so each level takes
// a bit longer than the last — the usual mobile-game curve.
function cumulativeXpForLevel(level: number): number {
    return (XP_PER_LEVEL_BASE * level * (level - 1)) / 2;
}

export interface LevelInfo {
    level: number;
    title: string;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progress: number; // 0..1
}

export function getLevelInfo(xp: number): LevelInfo {
    let level = 1;
    while (cumulativeXpForLevel(level + 1) <= xp) level++;

    const currentFloor = cumulativeXpForLevel(level);
    const nextFloor = cumulativeXpForLevel(level + 1);
    const xpIntoLevel = xp - currentFloor;
    const xpForNextLevel = nextFloor - currentFloor;

    let title = RANKS[0].title;
    for (const rank of RANKS) {
        if (level >= rank.level) title = rank.title;
    }

    return {
        level,
        title,
        xpIntoLevel,
        xpForNextLevel,
        progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1,
    };
}

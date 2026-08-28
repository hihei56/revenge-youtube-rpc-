export type Category = "kenri" | "gyoho" | "horei" | "zei";

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
    { id: "kenri", label: "権利関係", emoji: "⚖️" },
    { id: "gyoho", label: "宅建業法", emoji: "🏠" },
    { id: "horei", label: "法令上の制限", emoji: "🏗️" },
    { id: "zei", label: "税・その他", emoji: "💰" },
];

export type Mode = "maru_batsu" | "kosuu";

export interface MaruBatsuQuestion {
    id: string;
    category: Category;
    text: string;
    answer: boolean;
    explanation: string;
}

export interface KosuuStatement {
    label: string;
    text: string;
    answer: boolean;
}

export interface KosuuQuestion {
    id: string;
    category: Category;
    prompt: string;
    statements: KosuuStatement[];
}

export interface SessionRecord {
    date: number;
    mode: Mode;
    category: Category | "all";
    correct: number;
    total: number;
    xpGained: number;
}

export interface QuestionStat {
    seen: number;
    correct: number;
    wrongStreak: number;
    lastSeen: number;
}

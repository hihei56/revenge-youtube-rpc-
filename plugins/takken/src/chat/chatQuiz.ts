import { CHAT_FAST_SECONDS_KOSUU, CHAT_FAST_SECONDS_MARU } from "../logic/constants";
import { getLevelInfo } from "../logic/gamification";
import { pickKosuuSession, pickMaruBatsuSession, recordAnswer } from "../logic/quizEngine";
import { computeXpForAnswer } from "../logic/scoring";
import { pushSession, vstorage } from "../storage";
import { CATEGORIES } from "../types";
import type { Category, KosuuQuestion, MaruBatsuQuestion, Mode } from "../types";

interface ChatSession {
    mode: Mode;
    category: Category | "all";
    question: MaruBatsuQuestion | KosuuQuestion;
    startedAt: number;
}

// Not persisted to storage on purpose — a question posted in chat only
// needs to survive until the reply, and storing question payloads on disk
// would just go stale if the question bank ever changes.
let active: ChatSession | null = null;

const CATEGORY_ALIASES: { category: Category; keywords: string[] }[] = [
    { category: "kenri", keywords: ["権利", "民法", "けんり"] },
    { category: "gyoho", keywords: ["業法", "宅建業法", "ぎょうほう"] },
    { category: "horei", keywords: ["法令", "制限", "都市計画", "ほうれい"] },
    { category: "zei", keywords: ["税", "価格", "その他", "ぜい"] },
];

function categoryLabel(category: Category | "all"): string {
    if (category === "all") return "全分野";
    return CATEGORIES.find(c => c.id === category)?.label ?? category;
}

function resolveCategory(raw?: string): Category | "all" {
    const trimmed = raw?.trim();
    if (!trimmed || trimmed === "全分野" || trimmed.toLowerCase() === "all") return "all";
    for (const { category, keywords } of CATEGORY_ALIASES) {
        if (keywords.some(k => trimmed.includes(k))) return category;
    }
    return "all";
}

function resolveMode(raw?: string): Mode | null {
    const trimmed = raw?.trim();
    if (!trimmed) return null; // null => pick randomly
    const lower = trimmed.toLowerCase();
    if (trimmed.includes("個数") || lower.includes("kosuu") || lower.includes("hell")) return "kosuu";
    if (trimmed.includes("○") || trimmed.includes("×") || lower.includes("maru")) return "maru_batsu";
    return null;
}

function pickQuestion(mode: Mode, category: Category | "all"): MaruBatsuQuestion | KosuuQuestion | undefined {
    return mode === "maru_batsu" ? pickMaruBatsuSession(category, 1)[0] : pickKosuuSession(category, 1)[0];
}

export function startQuestion(categoryRaw?: string, modeRaw?: string): string {
    const category = resolveCategory(categoryRaw);
    let mode = resolveMode(modeRaw);

    if (!mode) mode = Math.random() < 0.6 ? "maru_batsu" : "kosuu";
    let question = pickQuestion(mode, category);

    // Fall back to the other mode if this category happens to have no
    // questions of the randomly-picked type yet.
    if (!question) {
        mode = mode === "maru_batsu" ? "kosuu" : "maru_batsu";
        question = pickQuestion(mode, category);
    }

    if (!question) {
        active = null;
        return `😢 ${categoryLabel(category)}にはまだ問題がありません。分野を指定せずにもう一度試してね。`;
    }

    active = { mode, category, question, startedAt: Date.now() };

    if (mode === "maru_batsu") {
        const q = question as MaruBatsuQuestion;
        return (
            `🏠⭕ 宅建クイズ [${categoryLabel(category)}]\n` +
            `Q. ${q.text}\n` +
            "○か×か、/宅建回答 で答えてね(例: /宅建回答 こたえ:○)"
        );
    }

    const q = question as KosuuQuestion;
    const lines = q.statements.map(s => `${s.label}. ${s.text}`).join("\n");
    return (
        `🏠🔥 宅建クイズ(個数問題・hell級) [${categoryLabel(category)}]\n` +
        `${q.prompt}\n${lines}\n` +
        "正しいものはいくつ？(0〜4) /宅建回答 で答えてね"
    );
}

function toHalfWidthDigits(s: string): string {
    return s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function normalize(raw: string): string {
    return toHalfWidthDigits(raw)
        .trim()
        .toLowerCase()
        .replace(/[\s　。！]/g, "");
}

// Small edit-distance check so obvious typos ("ばず" for "ばつ") still land —
// only applied to multi-character tokens to avoid false positives on
// single-character ones like "o" or "x".
function levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
}

function fuzzyIncludes(normalized: string, tokens: string[]): boolean {
    if (tokens.includes(normalized)) return true;
    return tokens.some(t => t.length >= 2 && levenshtein(normalized, t) <= 1);
}

const TRUE_TOKENS = ["○", "まる", "maru", "o", "ok", "yes", "true", "正しい", "正", "t", "y", "1"];
const FALSE_TOKENS = ["×", "x", "ばつ", "batsu", "batu", "no", "false", "誤り", "誤", "f", "n", "0"];

function parseMaruBatsuAnswer(raw: string): boolean | null {
    const normalized = normalize(raw);
    if (!normalized) return null;
    if (fuzzyIncludes(normalized, TRUE_TOKENS)) return true;
    if (fuzzyIncludes(normalized, FALSE_TOKENS)) return false;
    return null;
}

function parseKosuuAnswer(raw: string): number | null {
    const normalized = normalize(raw).replace(/[個こつ]/g, "");
    if (/^[0-4]$/.test(normalized)) return Number(normalized);
    return null;
}

export function submitAnswer(raw: string): string {
    if (!active) {
        return "🤔 出題中の問題がないよ。まず /宅建問題 で問題を出してね。";
    }

    const { mode, category, question, startedAt } = active;
    const elapsedSec = (Date.now() - startedAt) / 1000;

    let isCorrect: boolean;
    const explanationLines: string[] = [];

    if (mode === "maru_batsu") {
        const parsed = parseMaruBatsuAnswer(raw);
        if (parsed === null) {
            return "❓ ○か×で答えてね(「まる」「ばつ」でもOK)。例: /宅建回答 こたえ:○";
        }
        const q = question as MaruBatsuQuestion;
        isCorrect = parsed === q.answer;
        explanationLines.push(`正解: ${q.answer ? "○ 正しい" : "× 誤り"}`, q.explanation);
    } else {
        const parsed = parseKosuuAnswer(raw);
        if (parsed === null) {
            return "❓ 0〜4の数字で答えてね。例: /宅建回答 こたえ:2";
        }
        const q = question as KosuuQuestion;
        const correctCount = q.statements.filter(s => s.answer).length;
        isCorrect = parsed === correctCount;
        explanationLines.push(
            `正解: ${correctCount}個 (${q.statements.map(s => `${s.label}${s.answer ? "○" : "×"}`).join(" ")})`,
        );
    }

    active = null;
    recordAnswer(question.id, isCorrect);

    const nextCombo = isCorrect ? vstorage.chatCombo + 1 : 0;
    vstorage.chatCombo = nextCombo;
    if (nextCombo > vstorage.bestCombo) vstorage.bestCombo = nextCombo;

    const fast = elapsedSec <= (mode === "maru_batsu" ? CHAT_FAST_SECONDS_MARU : CHAT_FAST_SECONDS_KOSUU);
    const gained = computeXpForAnswer(mode, isCorrect, fast, nextCombo);

    const levelBefore = getLevelInfo(vstorage.xp);
    vstorage.xp += gained;
    vstorage.totalAnswered += 1;
    if (isCorrect) vstorage.totalCorrect += 1;
    const levelAfter = getLevelInfo(vstorage.xp);

    pushSession({
        date: Date.now(),
        mode,
        category,
        correct: isCorrect ? 1 : 0,
        total: 1,
        xpGained: gained,
    });

    const header = isCorrect
        ? `✅ 正解！ +${gained}XP${nextCombo > 1 ? ` 🔥${nextCombo}コンボ` : ""}`
        : "❌ 不正解...";
    const levelLine =
        levelAfter.level > levelBefore.level
            ? `🆙 レベルアップ！ Lv.${levelAfter.level} ${levelAfter.title}`
            : `Lv.${levelAfter.level} ${levelAfter.title} (${levelAfter.xpIntoLevel}/${levelAfter.xpForNextLevel}XP)`;

    return [header, ...explanationLines, levelLine].join("\n");
}

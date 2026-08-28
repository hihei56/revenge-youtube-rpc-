import { React, ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";

import ProgressBar from "../components/ProgressBar";
import { KOSUU_SESSION_LEN, KOSUU_TIME_SEC, MARU_BATSU_SESSION_LEN, MARU_BATSU_TIME_SEC } from "../logic/constants";
import { pickKosuuSession, pickMaruBatsuSession, recordAnswer } from "../logic/quizEngine";
import { computeXpForAnswer } from "../logic/scoring";
import { CATEGORIES } from "../types";
import type { Category, KosuuQuestion, MaruBatsuQuestion, Mode } from "../types";

export interface QuizSummary {
    correct: number;
    total: number;
    xpGained: number;
    bestCombo: number;
}

interface Feedback {
    correct: boolean;
    explanationLines: string[];
}

function categoryLabel(category: Category | "all"): string {
    if (category === "all") return "全分野";
    return CATEGORIES.find(c => c.id === category)?.label ?? category;
}

export default function Quiz({
    mode,
    category,
    onFinish,
}: {
    mode: Mode;
    category: Category | "all";
    onFinish: (summary: QuizSummary) => void;
}) {
    const timeLimit = mode === "maru_batsu" ? MARU_BATSU_TIME_SEC : KOSUU_TIME_SEC;
    const sessionLen = mode === "maru_batsu" ? MARU_BATSU_SESSION_LEN : KOSUU_SESSION_LEN;

    const [questions] = React.useState(() =>
        mode === "maru_batsu" ? pickMaruBatsuSession(category, sessionLen) : pickKosuuSession(category, sessionLen),
    );

    const [index, setIndex] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState(timeLimit);
    const [feedback, setFeedback] = React.useState<Feedback | null>(null);
    const [combo, setCombo] = React.useState(0);
    const [bestCombo, setBestCombo] = React.useState(0);
    const [correctCount, setCorrectCount] = React.useState(0);
    const [xpGained, setXpGained] = React.useState(0);

    const current = questions[index];
    const answeredRef = React.useRef(false);

    React.useEffect(() => {
        answeredRef.current = false;
        setTimeLeft(timeLimit);
        // eslint-disable-next-line
    }, [index]);

    React.useEffect(() => {
        if (feedback || !current) return;

        const interval = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(interval);
                    if (!answeredRef.current) handleTimeout();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [index, feedback]);

    function applyResult(isCorrect: boolean) {
        recordAnswer(current!.id, isCorrect);

        const nextCombo = isCorrect ? combo + 1 : 0;
        setCombo(nextCombo);
        if (nextCombo > bestCombo) setBestCombo(nextCombo);
        if (isCorrect) setCorrectCount(c => c + 1);

        const fast = timeLeft > timeLimit * 0.6;
        const gained = computeXpForAnswer(mode, isCorrect, fast, nextCombo);
        setXpGained(x => x + gained);
    }

    function finish(isCorrect: boolean, explanationLines: string[]) {
        if (answeredRef.current) return;
        answeredRef.current = true;
        applyResult(isCorrect);
        setFeedback({ correct: isCorrect, explanationLines });
    }

    function submitMaruBatsu(choice: boolean) {
        const q = current as MaruBatsuQuestion;
        const isCorrect = choice === q.answer;
        finish(isCorrect, [`正解: ${q.answer ? "○ 正しい" : "× 誤り"}`, q.explanation]);
    }

    function submitKosuu(pickCount: number) {
        const q = current as KosuuQuestion;
        const correctAnswerCount = q.statements.filter(s => s.answer).length;
        const isCorrect = pickCount === correctAnswerCount;
        finish(isCorrect, [
            `正解: ${correctAnswerCount}個`,
            ...q.statements.map(s => `${s.label}: ${s.answer ? "○" : "×"} ${s.text}`),
        ]);
    }

    function handleTimeout() {
        if (mode === "maru_batsu") {
            const q = current as MaruBatsuQuestion;
            finish(false, [`正解: ${q.answer ? "○ 正しい" : "× 誤り"}`, q.explanation, "⏰ 時間切れ"]);
        } else {
            const q = current as KosuuQuestion;
            const correctAnswerCount = q.statements.filter(s => s.answer).length;
            finish(false, [
                `正解: ${correctAnswerCount}個`,
                ...q.statements.map(s => `${s.label}: ${s.answer ? "○" : "×"} ${s.text}`),
                "⏰ 時間切れ",
            ]);
        }
    }

    function next() {
        if (index + 1 >= questions.length) {
            onFinish({ correct: correctCount, total: questions.length, xpGained, bestCombo });
            return;
        }
        setFeedback(null);
        setIndex(i => i + 1);
    }

    if (!current) {
        return (
            <RN.View style={{ padding: 24 }}>
                <RN.Text style={{ color: semanticColors.TEXT_NORMAL }}>この分野にはまだ問題がありません。</RN.Text>
            </RN.View>
        );
    }

    const timerRatio = timeLeft / timeLimit;
    const timerColor = timerRatio > 0.5 ? "#3ba55d" : timerRatio > 0.25 ? "#faa61a" : "#ed4245";

    return (
        <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <RN.View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontWeight: "600" }}>
                    {categoryLabel(category)} ・ {index + 1} / {questions.length}
                </RN.Text>
                <RN.Text style={{ color: combo > 0 ? "#faa61a" : semanticColors.TEXT_MUTED, fontWeight: "700" }}>
                    🔥 {combo} コンボ
                </RN.Text>
            </RN.View>

            <ProgressBar progress={timerRatio} color={timerColor} height={10} />
            <RN.Text style={{ textAlign: "right", color: timerColor, marginTop: 4, marginBottom: 16, fontWeight: "700" }}>
                残り {timeLeft}秒
            </RN.Text>

            {mode === "maru_batsu" ? (
                <MaruBatsuCard question={current as MaruBatsuQuestion} disabled={!!feedback} onAnswer={submitMaruBatsu} />
            ) : (
                <KosuuCard question={current as KosuuQuestion} disabled={!!feedback} onAnswer={submitKosuu} />
            )}

            {feedback && (
                <RN.View
                    style={{
                        marginTop: 20,
                        padding: 14,
                        borderRadius: 10,
                        backgroundColor: feedback.correct ? "rgba(59,165,93,0.15)" : "rgba(237,66,69,0.15)",
                    }}
                >
                    <RN.Text
                        style={{
                            fontWeight: "700",
                            fontSize: 16,
                            color: feedback.correct ? "#3ba55d" : "#ed4245",
                            marginBottom: 8,
                        }}
                    >
                        {feedback.correct ? "✅ 正解！" : "❌ 不正解"}
                    </RN.Text>
                    {feedback.explanationLines.map((line, i) => (
                        <RN.Text key={i} style={{ color: semanticColors.TEXT_NORMAL, marginBottom: 4, fontSize: 13 }}>
                            {line}
                        </RN.Text>
                    ))}

                    <RN.TouchableOpacity
                        onPress={next}
                        style={{
                            marginTop: 12,
                            backgroundColor: "#3ba55d",
                            borderRadius: 8,
                            paddingVertical: 12,
                            alignItems: "center",
                        }}
                    >
                        <RN.Text style={{ color: "#fff", fontWeight: "700" }}>
                            {index + 1 >= questions.length ? "結果を見る ▶" : "次の問題へ ▶"}
                        </RN.Text>
                    </RN.TouchableOpacity>
                </RN.View>
            )}
        </RN.ScrollView>
    );
}

function MaruBatsuCard({
    question,
    disabled,
    onAnswer,
}: {
    question: MaruBatsuQuestion;
    disabled: boolean;
    onAnswer: (v: boolean) => void;
}) {
    return (
        <RN.View>
            <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontSize: 17, lineHeight: 24, marginBottom: 20 }}>
                {question.text}
            </RN.Text>
            <RN.View style={{ flexDirection: "row" }}>
                <RN.TouchableOpacity
                    disabled={disabled}
                    onPress={() => onAnswer(true)}
                    style={{
                        flex: 1,
                        marginRight: 8,
                        paddingVertical: 20,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: "rgba(59,165,93,0.18)",
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <RN.Text style={{ fontSize: 22, fontWeight: "800", color: "#3ba55d" }}>○</RN.Text>
                    <RN.Text style={{ color: "#3ba55d", marginTop: 4 }}>正しい</RN.Text>
                </RN.TouchableOpacity>
                <RN.TouchableOpacity
                    disabled={disabled}
                    onPress={() => onAnswer(false)}
                    style={{
                        flex: 1,
                        marginLeft: 8,
                        paddingVertical: 20,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: "rgba(237,66,69,0.18)",
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <RN.Text style={{ fontSize: 22, fontWeight: "800", color: "#ed4245" }}>×</RN.Text>
                    <RN.Text style={{ color: "#ed4245", marginTop: 4 }}>誤り</RN.Text>
                </RN.TouchableOpacity>
            </RN.View>
        </RN.View>
    );
}

function KosuuCard({
    question,
    disabled,
    onAnswer,
}: {
    question: KosuuQuestion;
    disabled: boolean;
    onAnswer: (count: number) => void;
}) {
    return (
        <RN.View>
            <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
                {question.prompt}
            </RN.Text>
            {question.statements.map(s => (
                <RN.View key={s.label} style={{ flexDirection: "row", marginBottom: 10 }}>
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontWeight: "700", marginRight: 6 }}>
                        {s.label}
                    </RN.Text>
                    <RN.Text style={{ color: semanticColors.TEXT_NORMAL, flex: 1, lineHeight: 20 }}>{s.text}</RN.Text>
                </RN.View>
            ))}

            <RN.Text style={{ color: semanticColors.TEXT_MUTED, marginTop: 8, marginBottom: 8, fontSize: 13 }}>
                正しいものはいくつ？
            </RN.Text>
            <RN.View style={{ flexDirection: "row" }}>
                {[0, 1, 2, 3, 4].map(n => (
                    <RN.TouchableOpacity
                        key={n}
                        disabled={disabled}
                        onPress={() => onAnswer(n)}
                        style={{
                            flex: 1,
                            marginRight: n < 4 ? 6 : 0,
                            paddingVertical: 16,
                            borderRadius: 10,
                            alignItems: "center",
                            backgroundColor: "rgba(88,101,242,0.18)",
                            opacity: disabled ? 0.5 : 1,
                        }}
                    >
                        <RN.Text style={{ fontSize: 18, fontWeight: "800", color: "#5865f2" }}>{n}</RN.Text>
                    </RN.TouchableOpacity>
                ))}
            </RN.View>
        </RN.View>
    );
}

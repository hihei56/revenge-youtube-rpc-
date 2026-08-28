import { ReactNative as RN } from "@vendetta/metro/common";
import { semanticColors } from "@vendetta/ui";

import ProgressBar from "../components/ProgressBar";
import type { LevelInfo } from "../logic/gamification";
import { CATEGORIES } from "../types";
import type { Category, Mode } from "../types";

export interface ResultData {
    mode: Mode;
    category: Category | "all";
    correct: number;
    total: number;
    xpGained: number;
    bestCombo: number;
    levelBefore: LevelInfo;
    levelAfter: LevelInfo;
    leveledUp: boolean;
}

function categoryLabel(category: Category | "all"): string {
    if (category === "all") return "全分野";
    return CATEGORIES.find(c => c.id === category)?.label ?? category;
}

export default function Result({
    data,
    onRetry,
    onHome,
}: {
    data: ResultData;
    onRetry: () => void;
    onHome: () => void;
}) {
    const accuracy = data.total ? Math.round((data.correct / data.total) * 100) : 0;
    const isGreat = accuracy >= 80;

    return (
        <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <RN.View style={{ alignItems: "center", marginBottom: 24 }}>
                <RN.Text style={{ fontSize: 40 }}>{isGreat ? "🎉" : accuracy >= 50 ? "🙂" : "📚"}</RN.Text>
                <RN.Text style={{ fontSize: 24, fontWeight: "800", color: semanticColors.TEXT_NORMAL, marginTop: 8 }}>
                    {data.correct} / {data.total} 正解
                </RN.Text>
                <RN.Text style={{ color: semanticColors.TEXT_MUTED, marginTop: 4 }}>
                    正答率 {accuracy}%・{categoryLabel(data.category)}
                </RN.Text>
            </RN.View>

            {data.leveledUp && (
                <RN.View
                    style={{
                        backgroundColor: "rgba(250,166,26,0.18)",
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 20,
                        alignItems: "center",
                    }}
                >
                    <RN.Text style={{ color: "#faa61a", fontWeight: "800", fontSize: 16 }}>
                        🆙 レベルアップ！ Lv.{data.levelAfter.level}
                    </RN.Text>
                    <RN.Text style={{ color: semanticColors.TEXT_NORMAL, marginTop: 4 }}>{data.levelAfter.title}</RN.Text>
                </RN.View>
            )}

            <RN.View style={{ marginBottom: 20 }}>
                <RN.View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontWeight: "700" }}>
                        Lv.{data.levelAfter.level} {data.levelAfter.title}
                    </RN.Text>
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED }}>
                        {data.levelAfter.xpIntoLevel} / {data.levelAfter.xpForNextLevel} XP
                    </RN.Text>
                </RN.View>
                <ProgressBar progress={data.levelAfter.progress} color="#3ba55d" />
            </RN.View>

            <RN.View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    backgroundColor: "rgba(127,127,127,0.12)",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 24,
                }}
            >
                <RN.View style={{ alignItems: "center" }}>
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontSize: 12 }}>獲得XP</RN.Text>
                    <RN.Text style={{ color: "#5865f2", fontWeight: "800", fontSize: 18 }}>+{data.xpGained}</RN.Text>
                </RN.View>
                <RN.View style={{ alignItems: "center" }}>
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontSize: 12 }}>ベストコンボ</RN.Text>
                    <RN.Text style={{ color: "#faa61a", fontWeight: "800", fontSize: 18 }}>🔥{data.bestCombo}</RN.Text>
                </RN.View>
            </RN.View>

            <RN.TouchableOpacity
                onPress={onRetry}
                style={{
                    backgroundColor: "#3ba55d",
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                <RN.Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>🔁 もう一度挑戦</RN.Text>
            </RN.TouchableOpacity>

            <RN.TouchableOpacity onPress={onHome} style={{ paddingVertical: 14, alignItems: "center" }}>
                <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontWeight: "600" }}>🏠 ホームへ戻る</RN.Text>
            </RN.TouchableOpacity>
        </RN.ScrollView>
    );
}

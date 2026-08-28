import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";

import ProgressBar from "../components/ProgressBar";
import { KOSUU, MARU_BATSU } from "../data/questions";
import { vstorage } from "../storage";
import { CATEGORIES } from "../types";
import type { Category } from "../types";

function categoryLabel(category: Category | "all"): string {
    if (category === "all") return "全分野";
    return CATEGORIES.find(c => c.id === category)?.label ?? category;
}

function modeLabel(mode: string): string {
    return mode === "kosuu" ? "個数問題" : "○×";
}

function formatDate(ts: number): string {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function History({ onBack }: { onBack: () => void }) {
    useProxy(vstorage);

    const categoryStats = React.useMemo(() => {
        return CATEGORIES.map(c => {
            const ids = [
                ...MARU_BATSU.filter(q => q.category === c.id).map(q => q.id),
                ...KOSUU.filter(q => q.category === c.id).map(q => q.id),
            ];
            let seen = 0;
            let correct = 0;
            for (const id of ids) {
                const stat = vstorage.qstats[id];
                if (!stat) continue;
                seen += stat.seen;
                correct += stat.correct;
            }
            return { ...c, seen, accuracy: seen ? correct / seen : 0 };
        });
        // eslint-disable-next-line
    }, [vstorage.qstats]);

    return (
        <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <RN.TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
                <RN.Text style={{ color: "#5865f2", fontWeight: "600" }}>◀ ホームへ戻る</RN.Text>
            </RN.TouchableOpacity>

            <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontWeight: "800", fontSize: 16, marginBottom: 12 }}>
                📊 分野別の正答率
            </RN.Text>
            {categoryStats.map(c => (
                <RN.View key={c.id} style={{ marginBottom: 14 }}>
                    <RN.View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <RN.Text style={{ color: semanticColors.TEXT_NORMAL }}>
                            {c.emoji} {c.label}
                        </RN.Text>
                        <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontSize: 12 }}>
                            {c.seen ? `${Math.round(c.accuracy * 100)}%（${c.seen}問）` : "未挑戦"}
                        </RN.Text>
                    </RN.View>
                    <ProgressBar
                        progress={c.accuracy}
                        color={c.accuracy >= 0.7 ? "#3ba55d" : c.accuracy >= 0.4 ? "#faa61a" : "#ed4245"}
                    />
                </RN.View>
            ))}

            <RN.Text
                style={{
                    color: semanticColors.TEXT_NORMAL,
                    fontWeight: "800",
                    fontSize: 16,
                    marginTop: 20,
                    marginBottom: 12,
                }}
            >
                🕘 最近の挑戦
            </RN.Text>
            {vstorage.sessions.length === 0 && (
                <RN.Text style={{ color: semanticColors.TEXT_MUTED }}>
                    まだ記録がありません。クイズに挑戦してみましょう。
                </RN.Text>
            )}
            {vstorage.sessions.map((s, i) => (
                <RN.View
                    key={i}
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: 10,
                        borderBottomWidth: i < vstorage.sessions.length - 1 ? 1 : 0,
                        borderBottomColor: "rgba(127,127,127,0.2)",
                    }}
                >
                    <RN.View>
                        <RN.Text style={{ color: semanticColors.TEXT_NORMAL }}>
                            {modeLabel(s.mode)}・{categoryLabel(s.category)}
                        </RN.Text>
                        <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontSize: 12 }}>{formatDate(s.date)}</RN.Text>
                    </RN.View>
                    <RN.View style={{ alignItems: "flex-end" }}>
                        <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontWeight: "700" }}>
                            {s.correct} / {s.total}
                        </RN.Text>
                        <RN.Text style={{ color: "#5865f2", fontSize: 12 }}>+{s.xpGained}XP</RN.Text>
                    </RN.View>
                </RN.View>
            ))}
        </RN.ScrollView>
    );
}

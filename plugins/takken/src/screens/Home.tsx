import { React, ReactNative as RN } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";
import { semanticColors } from "@vendetta/ui";
import { Forms } from "@vendetta/ui/components";

import ProgressBar from "../components/ProgressBar";
import { getLevelInfo } from "../logic/gamification";
import { vstorage } from "../storage";
import { CATEGORIES } from "../types";
import type { Category, Mode } from "../types";

const { FormSection } = Forms;

const MODES: { id: Mode; label: string; emoji: string; description: string }[] = [
    { id: "maru_batsu", label: "○×モード", emoji: "⭕", description: "1問1答。テンポよく正誤を判定しよう。" },
    { id: "kosuu", label: "個数問題モード 🔥", emoji: "🔥", description: "4つの記述から正しい数を当てる、宅建名物のhell級モード。" },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <RN.TouchableOpacity
            onPress={onPress}
            style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
                backgroundColor: selected ? "#3ba55d" : "rgba(127,127,127,0.15)",
            }}
        >
            <RN.Text style={{ color: selected ? "#fff" : semanticColors.TEXT_NORMAL, fontWeight: selected ? "700" : "400" }}>
                {label}
            </RN.Text>
        </RN.TouchableOpacity>
    );
}

export default function Home({
    onStart,
    onHistory,
}: {
    onStart: (mode: Mode, category: Category | "all") => void;
    onHistory: () => void;
}) {
    useProxy(vstorage);
    const [mode, setMode] = React.useState<Mode>("maru_batsu");
    const [category, setCategory] = React.useState<Category | "all">("all");

    const info = getLevelInfo(vstorage.xp);
    const accuracy = vstorage.totalAnswered ? Math.round((vstorage.totalCorrect / vstorage.totalAnswered) * 100) : 0;

    return (
        <RN.ScrollView style={{ flex: 1 }}>
            <FormSection title="ステータス">
                <RN.View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <RN.View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontWeight: "700", fontSize: 16 }}>
                            Lv.{info.level} {info.title}
                        </RN.Text>
                        <RN.Text style={{ color: semanticColors.TEXT_MUTED }}>
                            {info.xpIntoLevel} / {info.xpForNextLevel} XP
                        </RN.Text>
                    </RN.View>
                    <ProgressBar progress={info.progress} color="#3ba55d" />
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, marginTop: 10, fontSize: 13 }}>
                        正答率 {accuracy}%（{vstorage.totalCorrect}/{vstorage.totalAnswered}問）・ベストコンボ {vstorage.bestCombo}
                    </RN.Text>
                </RN.View>
            </FormSection>

            <FormSection title="モードを選ぶ">
                {MODES.map(m => (
                    <RN.TouchableOpacity
                        key={m.id}
                        onPress={() => setMode(m.id)}
                        style={{
                            marginHorizontal: 16,
                            marginBottom: 10,
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: mode === m.id ? "#3ba55d" : "transparent",
                            backgroundColor: "rgba(127,127,127,0.12)",
                        }}
                    >
                        <RN.Text style={{ color: semanticColors.TEXT_NORMAL, fontWeight: "700" }}>
                            {m.emoji} {m.label}
                        </RN.Text>
                        <RN.Text style={{ color: semanticColors.TEXT_MUTED, marginTop: 4, fontSize: 13 }}>
                            {m.description}
                        </RN.Text>
                    </RN.TouchableOpacity>
                ))}
            </FormSection>

            <FormSection title="分野を選ぶ">
                <RN.View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16 }}>
                    <Chip label="🎲 全分野" selected={category === "all"} onPress={() => setCategory("all")} />
                    {CATEGORIES.map(c => (
                        <Chip
                            key={c.id}
                            label={`${c.emoji} ${c.label}`}
                            selected={category === c.id}
                            onPress={() => setCategory(c.id)}
                        />
                    ))}
                </RN.View>
            </FormSection>

            <RN.View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
                <RN.TouchableOpacity
                    onPress={() => onStart(mode, category)}
                    style={{
                        backgroundColor: "#3ba55d",
                        borderRadius: 10,
                        paddingVertical: 14,
                        alignItems: "center",
                    }}
                >
                    <RN.Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>▶ スタート</RN.Text>
                </RN.TouchableOpacity>

                <RN.TouchableOpacity onPress={onHistory} style={{ paddingVertical: 14, alignItems: "center" }}>
                    <RN.Text style={{ color: semanticColors.TEXT_MUTED, fontWeight: "600" }}>
                        📈 学習履歴・苦手分野を見る
                    </RN.Text>
                </RN.TouchableOpacity>
            </RN.View>
        </RN.ScrollView>
    );
}

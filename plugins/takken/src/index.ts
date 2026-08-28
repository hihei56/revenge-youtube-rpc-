import { logger } from "@vendetta";
import { registerCommand } from "@vendetta/commands";

import { startQuestion, submitAnswer } from "./chat/chatQuiz";
import { getLevelInfo } from "./logic/gamification";
import Settings from "./Settings";
import { initStorage, vstorage } from "./storage";

const unregisterFns: (() => void)[] = [];

function getOptionValue(args: any[] | undefined, name: string): string | undefined {
    const found = args?.find((a: any) => a?.name === name);
    return typeof found?.value === "string" ? found.value : undefined;
}

export default {
    onLoad: () => {
        initStorage();

        unregisterFns.push(
            registerCommand({
                name: "宅建",
                displayName: "宅建",
                description: "宅建クイズの現在の進捗を表示します",
                displayDescription: "宅建クイズの現在の進捗を表示します",
                options: [],
                applicationId: "-1",
                inputType: 1, // BUILT_IN_TEXT
                type: 1, // CHAT
                execute: () => {
                    const info = getLevelInfo(vstorage.xp);
                    const accuracy = vstorage.totalAnswered
                        ? Math.round((vstorage.totalCorrect / vstorage.totalAnswered) * 100)
                        : 0;
                    return {
                        content:
                            "🏠 **宅建クイズ**\n" +
                            `Lv.${info.level} ${info.title}\n` +
                            `XP ${info.xpIntoLevel} / ${info.xpForNextLevel}\n` +
                            `正答率 ${accuracy}%（${vstorage.totalCorrect} / ${vstorage.totalAnswered}問）\n` +
                            `ベストコンボ ${vstorage.bestCombo}\n\n` +
                            "1問だけチャットで挑戦するなら /宅建問題 → /宅建回答、じっくり挑戦するならプラグイン設定から。",
                    };
                },
            }),
        );

        unregisterFns.push(
            registerCommand({
                name: "宅建問題",
                displayName: "宅建問題",
                description: "チャットで宅建クイズを1問出題します",
                displayDescription: "チャットで宅建クイズを1問出題します(分野・モードは省略可)",
                options: [
                    {
                        name: "分野",
                        description: "権利関係 / 宅建業法 / 法令上の制限 / 税その他 (省略で全分野)",
                        required: false,
                        type: 3, // STRING
                        displayName: "分野",
                        displayDescription: "権利関係 / 宅建業法 / 法令上の制限 / 税その他 (省略で全分野)",
                    },
                    {
                        name: "モード",
                        description: "○× / 個数 (省略でランダム)",
                        required: false,
                        type: 3, // STRING
                        displayName: "モード",
                        displayDescription: "○× / 個数 (省略でランダム)",
                    },
                ],
                applicationId: "-1",
                inputType: 1,
                type: 1,
                execute: (args: any[]) => ({
                    content: startQuestion(getOptionValue(args, "分野"), getOptionValue(args, "モード")),
                }),
            }),
        );

        unregisterFns.push(
            registerCommand({
                name: "宅建回答",
                displayName: "宅建回答",
                description: "直前に /宅建問題 で出題された問題に答えます",
                displayDescription: "○×、またはア〜エの正しい数(0〜4)を入力してください",
                options: [
                    {
                        name: "こたえ",
                        description: "○×、またはア〜エの正しい数(0〜4)。多少の表記ゆれはOK",
                        required: true,
                        type: 3, // STRING
                        displayName: "こたえ",
                        displayDescription: "○×、またはア〜エの正しい数(0〜4)。多少の表記ゆれはOK",
                    },
                ],
                applicationId: "-1",
                inputType: 1,
                type: 1,
                execute: (args: any[]) => ({
                    content: submitAnswer(getOptionValue(args, "こたえ") ?? ""),
                }),
            }),
        );

        logger.log("[TakkenQuiz] loaded");
    },
    onUnload: () => {
        for (const unregister of unregisterFns.splice(0)) unregister();
        logger.log("[TakkenQuiz] unloaded");
    },
    settings: Settings,
};

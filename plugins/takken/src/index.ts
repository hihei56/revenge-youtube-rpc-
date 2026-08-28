import { logger } from "@vendetta";
import { registerCommand } from "@vendetta/commands";

import { getLevelInfo } from "./logic/gamification";
import Settings from "./Settings";
import { initStorage, vstorage } from "./storage";

let unregisterCommand: (() => void) | undefined;

export default {
    onLoad: () => {
        initStorage();

        unregisterCommand = registerCommand({
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
                        "続きはプラグインの設定から挑戦できます。",
                };
            },
        });

        logger.log("[TakkenQuiz] loaded");
    },
    onUnload: () => {
        unregisterCommand?.();
        logger.log("[TakkenQuiz] unloaded");
    },
    settings: Settings,
};

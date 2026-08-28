import { React } from "@vendetta/metro/common";
import { useProxy } from "@vendetta/storage";

import { getLevelInfo } from "./logic/gamification";
import History from "./screens/History";
import Home from "./screens/Home";
import Quiz, { type QuizSummary } from "./screens/Quiz";
import Result, { type ResultData } from "./screens/Result";
import { pushSession, vstorage } from "./storage";
import type { Category, Mode } from "./types";

type Screen =
    | { name: "home" }
    | { name: "quiz"; mode: Mode; category: Category | "all" }
    | { name: "result"; data: ResultData }
    | { name: "history" };

export default function Settings() {
    useProxy(vstorage);
    const [screen, setScreen] = React.useState<Screen>({ name: "home" });

    if (screen.name === "quiz") {
        const { mode, category } = screen;
        return (
            <Quiz
                mode={mode}
                category={category}
                onFinish={(summary: QuizSummary) => {
                    const levelBefore = getLevelInfo(vstorage.xp);

                    vstorage.xp += summary.xpGained;
                    vstorage.totalAnswered += summary.total;
                    vstorage.totalCorrect += summary.correct;
                    if (summary.bestCombo > vstorage.bestCombo) vstorage.bestCombo = summary.bestCombo;

                    pushSession({
                        date: Date.now(),
                        mode,
                        category,
                        correct: summary.correct,
                        total: summary.total,
                        xpGained: summary.xpGained,
                    });

                    const levelAfter = getLevelInfo(vstorage.xp);

                    setScreen({
                        name: "result",
                        data: {
                            mode,
                            category,
                            correct: summary.correct,
                            total: summary.total,
                            xpGained: summary.xpGained,
                            bestCombo: summary.bestCombo,
                            levelBefore,
                            levelAfter,
                            leveledUp: levelAfter.level > levelBefore.level,
                        },
                    });
                }}
            />
        );
    }

    if (screen.name === "result") {
        return (
            <Result
                data={screen.data}
                onRetry={() => setScreen({ name: "quiz", mode: screen.data.mode, category: screen.data.category })}
                onHome={() => setScreen({ name: "home" })}
            />
        );
    }

    if (screen.name === "history") {
        return <History onBack={() => setScreen({ name: "home" })} />;
    }

    return (
        <Home
            onStart={(mode, category) => setScreen({ name: "quiz", mode, category })}
            onHistory={() => setScreen({ name: "history" })}
        />
    );
}

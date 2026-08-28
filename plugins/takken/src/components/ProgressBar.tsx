import { ReactNative as RN } from "@vendetta/metro/common";

export default function ProgressBar({
    progress,
    color,
    height = 8,
    backgroundColor = "rgba(127,127,127,0.25)",
}: {
    progress: number;
    color: string;
    height?: number;
    backgroundColor?: string;
}) {
    const clamped = Math.max(0, Math.min(1, progress));
    return (
        <RN.View style={{ height, borderRadius: height / 2, backgroundColor, overflow: "hidden" }}>
            <RN.View
                style={{
                    height: "100%",
                    width: `${clamped * 100}%`,
                    backgroundColor: color,
                    borderRadius: height / 2,
                }}
            />
        </RN.View>
    );
}

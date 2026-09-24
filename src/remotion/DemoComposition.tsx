import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Check, Clock, Flame, Hash, MousePointer2, Repeat, AlignLeft, Cloud } from "lucide-react";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";

export const DemoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // انیمیشن دوربین (Camera Scale & Position - افکت زوم و پن هوشمند)
  const cameraScale = interpolate(
    frame,
    [0, 45, 60, 210, 240, 310, 340, 380, 410, 470],
    [1.0, 1.0, 1.38, 1.38, 1.12, 1.12, 1.25, 1.25, 1.0, 1.0],
    { extrapolateRight: "clamp" },
  );

  const cameraTranslateY = interpolate(
    frame,
    [0, 45, 60, 210, 240, 310, 340, 380, 410, 470],
    [0, 0, -110, -110, -30, -30, -140, -140, 0, 0],
    { extrapolateRight: "clamp" },
  );

  const cameraTranslateX = interpolate(
    frame,
    [0, 45, 60, 210, 240, 310, 340, 380, 410, 470],
    [0, 0, 0, 0, 0, 0, 80, 80, 0, 0],
    { extrapolateRight: "clamp" },
  );

  // موقعیت موس شبیه‌سازی شده (Virtual Mouse Pointer X, Y)
  const mouseX = interpolate(
    frame,
    [0, 45, 60, 230, 245, 270, 330, 345, 370, 400],
    [850, 680, 680, 680, 320, 320, 1180, 1180, 720, 960],
    { extrapolateRight: "clamp" },
  );

  const mouseY = interpolate(
    frame,
    [0, 45, 60, 230, 245, 270, 330, 345, 370, 400],
    [400, 240, 240, 240, 240, 240, 480, 480, 330, 600],
    { extrapolateRight: "clamp" },
  );

  const isClicking =
    (frame >= 43 && frame <= 50) ||
    (frame >= 242 && frame <= 250) ||
    (frame >= 342 && frame <= 350) ||
    (frame >= 378 && frame <= 385);

  // متن کامل تایپ هوشمند با تبدیل کلمات کلیدی به تایمر، اولویت و تگ
  const fullText = "جلسه تحویل پروژه تسک‌دراپ +۲ ساعت دیگه !فوری #پروژه هر هفته // همراه با دمو";
  const typingStart = 55;
  const typingEnd = 215;
  const currentChars = Math.floor(
    interpolate(frame, [typingStart, typingEnd], [0, fullText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedString = fullText.slice(0, currentChars);

  // استخراج در لحظه کلمات کلیدی
  const hasTimerKeyword = typedString.includes("+۲ ساعت دیگه");
  const hasPriorityKeyword = typedString.includes("!فوری");
  const hasTagKeyword = typedString.includes("#پروژه");
  const hasRepeatKeyword = typedString.includes("هر هفته");
  const hasDescKeyword = typedString.includes("// همراه با دمو");

  // وضعیت‌های تعاملی برنامه
  const isSubmitted = frame >= 248;
  const isSecondTaskDone = frame >= 346;
  const isTagFiltered = frame >= 382;

  // انیمیشن ورود فنری تسک سابمیت شده
  const taskEntranceSpring = spring({
    frame: frame - 248,
    fps,
    config: { damping: 13, mass: 0.7, stiffness: 140 },
  });

  // ثانیه‌شمار معکوس زنده تایمر تسک
  const baseSeconds = 7200; // ۲ ساعت
  const elapsedSeconds = Math.max(0, Math.floor((frame - 248) / 3));
  const currentSecondsLeft = Math.max(0, baseSeconds - elapsedSeconds);
  const hrs = Math.floor(currentSecondsLeft / 3600);
  const mins = Math.floor((currentSecondsLeft % 3600) / 60);
  const secs = currentSecondsLeft % 60;
  const countdownText = `۰${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#09090b",
        fontFamily: "Vazirmatn, sans-serif",
        direction: "rtl",
        color: "#fafafa",
        overflow: "hidden",
      }}
    >
      {/* مش گرادینت متحرک پس‌زمینه */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(1000px circle at 50% 15%, rgba(234, 179, 8, 0.08), transparent 70%),
            radial-gradient(800px circle at 85% 75%, rgba(139, 92, 246, 0.08), transparent 70%),
            radial-gradient(600px circle at 15% 65%, rgba(16, 185, 129, 0.06), transparent 70%)
          `,
          transform: `scale(${1 + Math.sin(frame * 0.015) * 0.02})`,
        }}
      />

      {/* خطوط پس‌زمینه مدرن */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* کانتینر اصلی اپلیکیشن با زوم پویا */}
      <div
        style={{
          transform: `scale(${cameraScale}) translate3d(${cameraTranslateX}px, ${cameraTranslateY}px, 0)`,
          transformOrigin: "center 30%",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "45px",
        }}
      >
        {/* قاب پنجره برنامه TaskDrop */}
        <div
          className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl backdrop-blur-xl relative overflow-hidden"
          style={{
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 35px 80px -15px rgba(0,0,0,0.9)",
          }}
        >
          {/* نوار بالای پنجره (Header Bar) */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-red-500/80" />
              <div className="size-3 rounded-full bg-yellow-500/80" />
              <div className="size-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* عنوان و لوگوی TaskDrop */}
            <div className="flex items-center gap-2 font-bold text-sm text-zinc-200">
              <span className="size-2 rounded-full bg-yellow-400 animate-ping" />
              <span>TaskDrop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-normal">
                v2.0
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Cloud className="size-3.5" />
                <span className="text-[11px]">همگام</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400 font-mono text-[11px]">🔥 ۳ روز استریک</span>
            </div>
          </div>

          {/* محتوای اصلی داخل برنامه */}
          <div className="p-5 space-y-4">
            {/* ۱. فیلد ورودی سریع QuickAdd */}
            <div className="relative">
              <div
                className={`relative flex items-center rounded-xl border bg-zinc-900/90 px-4 py-3 shadow-inner transition-colors ${
                  frame >= 45 && frame < 248
                    ? "border-yellow-400/80 ring-2 ring-yellow-400/20"
                    : "border-zinc-700/80"
                }`}
              >
                <div className="flex-1 text-sm font-normal text-zinc-100 flex items-center min-h-[28px]">
                  {frame < typingStart ? (
                    <span className="text-zinc-500">
                      چی یادت نره؟ مثلاً: فردا ساعت ۱۰ جلسه فنی !فوری #کار
                    </span>
                  ) : isSubmitted ? (
                    <span className="text-zinc-500">چی یادت نره؟</span>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>{renderHighlightedInput(typedString)}</span>
                      {Math.sin(frame * 0.35) > 0 && (
                        <span className="inline-block w-0.5 h-4 bg-yellow-400 align-middle shadow-[0_0_6px_#facc15]" />
                      )}
                    </div>
                  )}
                </div>

                {/* دکمه‌های راهنمای کیبورد */}
                <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0 ms-2">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[11px] font-mono">
                    /
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[11px] font-mono transition-transform ${
                      frame >= 242 && frame <= 252
                        ? "scale-90 bg-yellow-400 text-black border-yellow-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    ↵
                  </span>
                </div>
              </div>

              {/* چیپ‌های استخراج شده به محض تایپ */}
              {!isSubmitted && typedString.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 text-xs">
                  <span className="font-semibold text-zinc-200">
                    {typedString
                      .replace(/(\+۲ ساعت دیگه|!فوری|#پروژه|هر هفته|\/\/.*)/g, "")
                      .trim() || "جلسه..."}
                  </span>

                  {/* چیپ اولویت بالا */}
                  {hasPriorityKeyword && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-800/80 bg-red-950/80 px-2 py-0.5 text-[11px] font-semibold text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <Flame className="size-3 text-red-400 fill-red-400" />
                      فوری
                    </span>
                  )}

                  {/* چیپ تایمر هوشمند */}
                  {hasTimerKeyword && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-black shadow-md">
                      <Clock className="size-3 text-black" />۲ ساعت بعد
                    </span>
                  )}

                  {/* چیپ تکرار */}
                  {hasRepeatKeyword && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/90 px-2 py-0.5 text-[11px] text-zinc-200">
                      <Repeat className="size-3 text-blue-400" />
                      هر هفته
                    </span>
                  )}

                  {/* چیپ تگ */}
                  {hasTagKeyword && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-purple-800/80 bg-purple-950/80 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                      <span className="size-1.5 rounded-full bg-purple-400" />
                      #پروژه
                    </span>
                  )}

                  {/* چیپ یادداشت */}
                  {hasDescKeyword && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                      <AlignLeft className="size-3" />
                      همراه با دمو
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ۲. فیلترها و تب‌های وضعیت تسک‌ها */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white font-semibold">
                  همه <span className="text-zinc-400 font-normal">({isSubmitted ? "۴" : "۳"})</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white">
                  امروز <span className="text-zinc-500">(۲)</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white">
                  آینده <span className="text-zinc-500">(۲)</span>
                </span>
              </div>

              {/* تگ‌های قابل فیلتر */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                    isTagFiltered
                      ? "bg-purple-900/80 text-purple-200 border border-purple-500"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                  }`}
                >
                  <Hash className="size-3 text-purple-400" />
                  پروژه
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                  <Hash className="size-3 text-emerald-400" />
                  مالی
                </span>
              </div>
            </div>

            {/* ۳. لیست زنده تسک‌ها */}
            <div className="space-y-2.5">
              {/* تسک جدید ثبت شده (با فیزیک Spring و تایمر فعال) */}
              {isSubmitted && (
                <div
                  style={{
                    transform: `translateY(${interpolate(
                      taskEntranceSpring,
                      [0, 1],
                      [-20, 0],
                    )}px) scale(${interpolate(taskEntranceSpring, [0, 1], [0.95, 1])})`,
                    opacity: interpolate(taskEntranceSpring, [0, 0.4, 1], [0, 0.7, 1]),
                  }}
                  className="relative flex items-center justify-between gap-3.5 rounded-2xl border-2 border-yellow-400/80 bg-zinc-900/90 p-3.5 shadow-lg shadow-yellow-500/10"
                >
                  <div className="absolute -inset-0.5 rounded-2xl bg-yellow-400/10 blur-sm pointer-events-none -z-10" />

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-6 shrink-0 rounded-lg border-2 border-yellow-400 bg-yellow-400/10 flex items-center justify-center">
                      <div className="size-2 rounded-xs bg-yellow-400 animate-pulse" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">
                          جلسه تحویل پروژه تسک‌دراپ
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-red-800/80 bg-red-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                          <Flame className="size-3 text-red-400 fill-red-400" />
                          فوری
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-800/80 bg-purple-950/80 px-1.5 py-0.5 text-[10px] text-purple-300">
                          #پروژه
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                          <Repeat className="size-2.5 text-blue-400" />
                          هفتگی
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                        <AlignLeft className="size-3 text-zinc-500" />
                        <span>همراه با دمو</span>
                      </div>
                    </div>
                  </div>

                  {/* تایمر معکوس زنده در انتهای تسک */}
                  <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold shadow-xs">
                    <Clock className="size-3.5 text-emerald-400" />
                    <span>{countdownText}</span>
                  </div>
                </div>
              )}

              {/* تسک ۲: تسک پروژه */}
              <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 text-zinc-200">
                <div className="flex items-center gap-3 min-w-0">
                  <button className="size-6 shrink-0 rounded-lg border border-zinc-600 bg-zinc-800/80 flex items-center justify-center">
                    {isSecondTaskDone && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${isSecondTaskDone ? "line-through text-zinc-500" : ""}`}
                      >
                        بررسی طراحی و دیزاین سیستم جدید
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-[10px] text-purple-300">
                        #پروژه
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">فردا ۱۰:۰۰ صبح</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 font-mono">فردا</span>
              </div>

              {/* تسک ۳: تسک مالی */}
              {!isTagFiltered && (
                <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 text-zinc-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-6 shrink-0 rounded-lg border border-zinc-600 bg-zinc-800/80 flex items-center justify-center" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">پرداخت صورتحساب سرور ابری</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-[10px] text-emerald-300">
                          #مالی
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">امروز ۲۰:۰۰</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">امروز</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* بنر راهنمای کلیدواژه‌ها */}
        <div
          style={{
            opacity: interpolate(frame, [15, 45], [0, 1], { extrapolateRight: "clamp" }),
          }}
          className="mt-6 flex items-center gap-6 px-6 py-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md text-xs text-zinc-400"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-200 font-semibold">+۲ ساعت دیگه</span>
            <span>➔ تایمر معکوس</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="text-zinc-200 font-semibold">!فوری</span>
            <span>➔ اولویت آنی</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-purple-400" />
            <span className="text-zinc-200 font-semibold">#پروژه</span>
            <span>➔ تگ هوشمند</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-blue-400" />
            <span className="text-zinc-200 font-semibold">هر هفته</span>
            <span>➔ تکرار دوره‌ای</span>
          </div>
        </div>
      </div>

      {/* موس شبیه‌سازی شده متحرک */}
      <div
        className="pointer-events-none absolute z-50 transition-transform duration-75"
        style={{
          left: `${mouseX}px`,
          top: `${mouseY}px`,
          transform: `scale(${isClicking ? 0.85 : 1})`,
        }}
      >
        <MousePointer2
          className="size-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] fill-white"
          strokeWidth={1.5}
        />
        {isClicking && (
          <div className="absolute -top-2 -left-2 size-10 rounded-full bg-yellow-400/30 animate-ping pointer-events-none" />
        )}
      </div>
    </AbsoluteFill>
  );
};

// تابع رنگ‌آمیزی کلمات در حال تایپ
function renderHighlightedInput(text: string) {
  const parts = text.split(/(\+۲ ساعت دیگه|!فوری|#پروژه|هر هفته|\/\/ همراه با دمو)/g);
  return parts.map((part, i) => {
    if (part === "+۲ ساعت دیگه") {
      return (
        <span key={i} className="text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded">
          {part}
        </span>
      );
    }
    if (part === "!فوری") {
      return (
        <span key={i} className="text-red-400 font-bold bg-red-950/80 px-1 rounded">
          {part}
        </span>
      );
    }
    if (part === "#پروژه") {
      return (
        <span key={i} className="text-purple-400 font-bold bg-purple-950/80 px-1 rounded">
          {part}
        </span>
      );
    }
    if (part === "هر هفته") {
      return (
        <span key={i} className="text-blue-400 font-bold bg-blue-950/80 px-1 rounded">
          {part}
        </span>
      );
    }
    if (part === "// همراه با دمو") {
      return (
        <span key={i} className="text-zinc-400 italic">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

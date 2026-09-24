import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Sparkles,
  Clock,
  Flame,
  Hash,
  Repeat,
  CheckCircle2,
  CornerDownLeft,
  Zap,
} from "lucide-react";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";

export const DemoComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // فریم‌های کلیدی سناریو (مجموع ۴۵۰ فریم = ۱۵ ثانیه در ۳۰ فریم بر ثانیه)
  // 0 - 60: معرفی و ورود جذاب
  // 60 - 210: تایپ هوشمند و تبدیل ریل‌تایم کلمات به تایمر، اولویت و تگ
  // 210 - 300: زوم عمیق و هایلایت تبدیل کلمات کلیدی
  // 300 - 390: فشردن اینتر و ثبت آنی تسک همراه با تیک‌تاک تایمر
  // 390 - 450: آترو و نمایش شعار تسک‌دراپ

  // ۱. انیمیشن دوربین و زوم پویا (Smooth Camera Zoom)
  const cameraScale = interpolate(
    frame,
    [0, 50, 70, 200, 240, 310, 350, 400],
    [0.92, 1, 1, 1.18, 1.22, 1.05, 1, 0.95],
    { extrapolateRight: "clamp" },
  );

  const cameraY = interpolate(
    frame,
    [0, 50, 70, 200, 240, 310, 350, 400],
    [30, 0, 0, -60, -80, -20, 0, 0],
    { extrapolateRight: "clamp" },
  );

  const introOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ۲. محاسبه متن تایپ شده به صورت متوالی
  // متن کامل: «تحویل نهایی پروژه تسک‌دراپ +۲ ساعت دیگه !فوری #توسعه هر هفته»
  const fullSentence = "تحویل نهایی پروژه تسک‌دراپ +۲ ساعت دیگه !فوری #توسعه هر هفته";

  // بازه‌های تایپ
  const typingStartFrame = 65;
  const typingEndFrame = 195;
  const currentCharsCount = Math.floor(
    interpolate(frame, [typingStartFrame, typingEndFrame], [0, fullSentence.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const currentTypedText = fullSentence.slice(0, currentCharsCount);

  // تشخیص وضعیت کلمات کلیدی در متن فعلی
  const hasTimer = currentTypedText.includes("+۲ ساعت دیگه");
  const hasPriority = currentTypedText.includes("!فوری");
  const hasTag = currentTypedText.includes("#توسعه");
  const hasRepeat = currentTypedText.includes("هر هفته");

  // انیمیشن‌های ظهور هر برچسب هوشمند (Spring Animation)
  const timerBadgeSpring = spring({
    frame: frame - 125,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const priorityBadgeSpring = spring({
    frame: frame - 150,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const tagBadgeSpring = spring({
    frame: frame - 170,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const repeatBadgeSpring = spring({
    frame: frame - 190,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // انیمیشن سابمیت تسک (فریم ۳۱۰)
  const isSubmitted = frame >= 310;
  const taskCardSpring = spring({
    frame: frame - 310,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // افکت چشمک‌زن نشانگر موس/کرسر تایپ
  const cursorBlink = Math.sin(frame * 0.3) > 0;

  // شبیه‌سازی ثانیه‌شمار معکوس زنده تایمر
  const timerSecondsLeft = Math.max(0, 7200 - Math.floor((Math.max(0, frame - 310) / 30) * 1));
  const timerHours = Math.floor(timerSecondsLeft / 3600);
  const timerMins = Math.floor((timerSecondsLeft % 3600) / 60);
  const timerSecs = timerSecondsLeft % 60;
  const formattedCountdown = `${String(timerHours).padStart(2, "0")}:${String(timerMins).padStart(
    2,
    "0",
  )}:${String(timerSecs).padStart(2, "0")}`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#08080a",
        fontFamily: "Vazirmatn, sans-serif",
        direction: "rtl",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* بک‌گراند نوری داینامیک و مِش گرادینت متحرک */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle 700px at 50% 20%, rgba(234, 179, 8, 0.12), transparent 80%),
            radial-gradient(circle 600px at 80% 80%, rgba(139, 92, 246, 0.1), transparent 70%),
            radial-gradient(circle 500px at 20% 60%, rgba(16, 185, 129, 0.08), transparent 70%)
          `,
          transform: `scale(${1 + Math.sin(frame * 0.02) * 0.03})`,
        }}
      />

      {/* خطوط شبکه‌ای مدرن پس‌زمینه */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* لایه اصلی با ترنسفرم دوربین و زوم */}
      <div
        style={{
          opacity: introOpacity,
          transform: `scale(${cameraScale}) translateY(${cameraY}px)`,
          transformOrigin: "center 40%",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 80px",
        }}
      >
        {/* نوار هدر ویدیو: بج و تیتر */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            style={{
              transform: `translateY(${interpolate(frame, [0, 30], [20, 0], {
                extrapolateRight: "clamp",
              })}px)`,
              opacity: interpolate(frame, [0, 25], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-semibold mb-4 backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>پردازش زبان طبیعی هوشمند (Natural NLP)</span>
          </div>

          <h1
            style={{
              transform: `translateY(${interpolate(frame, [10, 40], [20, 0], {
                extrapolateRight: "clamp",
              })}px)`,
              opacity: interpolate(frame, [10, 35], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
            className="text-4xl font-extrabold tracking-tight text-white mb-2"
          >
            کلمات معمولی رو به{" "}
            <span className="text-amber-400 underline decoration-amber-500/50 underline-offset-8">
              تایمر و اکشن‌های زنده
            </span>{" "}
            تبدیل کن
          </h1>

          <p
            style={{
              transform: `translateY(${interpolate(frame, [20, 50], [20, 0], {
                extrapolateRight: "clamp",
              })}px)`,
              opacity: interpolate(frame, [20, 45], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
            className="text-zinc-400 text-lg max-w-2xl font-normal"
          >
            فقط بنویسید؛ TaskDrop خودکار موعد، شمارش معکوس، اولویت و تگ‌ها را استخراج می‌کند.
          </p>
        </div>

        {/* فریم شیشه‌ای پنجره برنامه TaskDrop */}
        <div
          className="w-full max-w-4xl rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden"
          style={{
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 30px 100px -20px rgba(0,0,0,0.9)",
          }}
        >
          {/* نوار بالای پنجره سیستم با دکمه‌های کنترلی */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-zinc-500 font-mono ms-3 font-semibold">
                taskdrop.app — Quick Capture
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                ⌘ + K
              </span>
            </div>
          </div>

          {/* فیلد ورودی سریع (Quick Add Input) */}
          <div className="relative mb-6">
            <div className="relative flex items-center bg-zinc-900/90 border border-zinc-700/80 rounded-2xl px-5 py-4 shadow-inner">
              <div className="flex-1 text-xl font-medium tracking-wide flex items-center min-h-[32px] overflow-hidden text-zinc-100">
                {frame < typingStartFrame ? (
                  <span className="text-zinc-600">
                    چی یادت نره؟ مثلاً: فردا ساعت ۱۰ جلسه فنی !فوری #کار
                  </span>
                ) : isSubmitted ? (
                  <span className="text-zinc-600">چی یادت نره؟</span>
                ) : (
                  <span>
                    {/* هایلایت هوشمند درون فیلد ورودی */}
                    {highlightParsedInput(currentTypedText)}
                    {cursorBlink && (
                      <span className="inline-block w-0.5 h-6 bg-amber-400 ms-0.5 align-middle shadow-[0_0_8px_#f59e0b]" />
                    )}
                  </span>
                )}
              </div>

              {/* دکمه اینتر کوچک */}
              <div
                style={{
                  transform: `scale(${frame >= 300 && frame < 320 ? 0.9 : 1})`,
                  backgroundColor: frame >= 300 && frame < 320 ? "#eab308" : "#27272a",
                  color: frame >= 300 && frame < 320 ? "#000000" : "#a1a1aa",
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-semibold transition-all duration-150"
              >
                <span>Enter</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* نشانگرهای استخراج شده به صورت آنی زیر فیلد ورودی */}
            {!isSubmitted && (hasTimer || hasPriority || hasTag || hasRepeat) && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-1">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  تشخیص هوشمند:
                </span>

                {/* ۱. تبدیل به تایمر موعد */}
                {hasTimer && (
                  <div
                    style={{
                      transform: `scale(${Math.min(1, timerBadgeSpring)})`,
                      opacity: timerBadgeSpring,
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <Clock
                      className="w-3.5 h-3.5 text-emerald-400 animate-spin"
                      style={{ animationDuration: "6s" }}
                    />
                    <span>تایمر موعد: ۲ ساعت بعد</span>
                  </div>
                )}

                {/* ۲. تشخیص اولویت بالا */}
                {hasPriority && (
                  <div
                    style={{
                      transform: `scale(${Math.min(1, priorityBadgeSpring)})`,
                      opacity: priorityBadgeSpring,
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                    <span>اولویت: خیلی مهم (!فوری)</span>
                  </div>
                )}

                {/* ۳. تشخیص تگ خودکار */}
                {hasTag && (
                  <div
                    style={{
                      transform: `scale(${Math.min(1, tagBadgeSpring)})`,
                      opacity: tagBadgeSpring,
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    <span>دسته‌بندی: #توسعه</span>
                  </div>
                )}

                {/* ۴. تشخیص تکرار دوره‌ای */}
                {hasRepeat && (
                  <div
                    style={{
                      transform: `scale(${Math.min(1, repeatBadgeSpring)})`,
                      opacity: repeatBadgeSpring,
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-300 text-xs font-semibold shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  >
                    <Repeat className="w-3.5 h-3.5 text-blue-400" />
                    <span>روتین: تکرار هر هفته</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* لیست تسک‌ها و نمایش زنده تسک ساخته شده با تایمر فعال */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-2">
              <span>تسک‌های فعال امروز</span>
              <span>۳ تسک</span>
            </div>

            {/* تسک جدید ساخته شده با افکت دراپ و پالس */}
            {isSubmitted && (
              <div
                style={{
                  transform: `translateY(${interpolate(
                    taskCardSpring,
                    [0, 1],
                    [-40, 0],
                  )}px) scale(${interpolate(taskCardSpring, [0, 1], [0.95, 1])})`,
                  opacity: interpolate(taskCardSpring, [0, 0.5, 1], [0, 0.8, 1]),
                  boxShadow: "0 0 35px rgba(234, 179, 8, 0.25), 0 10px 25px rgba(0,0,0,0.5)",
                }}
                className="group relative flex items-center justify-between p-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-l from-zinc-900/90 via-amber-950/20 to-zinc-900/90 backdrop-blur-md"
              >
                {/* نور و هایلایت درخشان دور کارت */}
                <div className="absolute -inset-0.5 rounded-2xl bg-amber-500/20 blur-md pointer-events-none -z-10 animate-pulse" />

                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg border-2 border-amber-400/80 flex items-center justify-center bg-amber-500/10">
                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-400 animate-ping" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-white">
                        تحویل نهایی پروژه تسک‌دراپ
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950 border border-red-500/50 text-[11px] font-bold text-red-300">
                        <Flame className="w-3 h-3 text-red-400 fill-red-400" />
                        فوری
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950 border border-purple-500/50 text-[11px] font-semibold text-purple-300">
                        #توسعه
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950 border border-blue-500/50 text-[11px] font-medium text-blue-300">
                        <Repeat className="w-3 h-3 text-blue-400" />
                        هفتگی
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5">
                      <span>ثبت شده با NLP لحظه‌ای</span>
                    </div>
                  </div>
                </div>

                {/* تایمر معکوس دیجیتالی زنده */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-400 font-medium">زمان باقیمانده</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 font-mono text-sm font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{formattedCountdown}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* سایر تسک‌های پیش‌فرض برای واقع‌گرایی محیط برنامه */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 text-zinc-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                <span className="text-sm font-medium">بررسی لاگ‌های سرور کلودفلر</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  #زیرساخت
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">امروز ۱۸:۰۰</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 text-zinc-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                <span className="text-sm font-medium">جلسه بررسی دیزاین سیستم با تیم UI</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  #جلسه
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">فردا ۱۰:۰۰</span>
            </div>
          </div>
        </div>

        {/* کاتالوگ نمونه کلمات کلیدی در پایین پنجره */}
        <div
          style={{
            opacity: interpolate(frame, [40, 80], [0, 1], { extrapolateRight: "clamp" }),
          }}
          className="grid grid-cols-4 gap-4 w-full max-w-4xl mt-6"
        >
          <KeywordCard
            title="تایمرهای نسبی"
            example="+۲ ساعت دیگه / نیم ساعت بعد"
            tagColor="text-emerald-400"
            border="border-emerald-500/20 bg-emerald-950/20"
          />
          <KeywordCard
            title="اولویت‌های هوشمند"
            example="!فوری / !ضروری / !مهم"
            tagColor="text-red-400"
            border="border-red-500/20 bg-red-950/20"
          />
          <KeywordCard
            title="تگ‌گذاری سریع"
            example="#کار #پروژه #شخصی"
            tagColor="text-purple-400"
            border="border-purple-500/20 bg-purple-950/20"
          />
          <KeywordCard
            title="تکرار و روتین"
            example="هر روز / هر هفته / آخر هفته"
            tagColor="text-blue-400"
            border="border-blue-500/20 bg-blue-950/20"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// تابع کمکی برای رنگ‌آمیزی کلمات در حال تایپ
function highlightParsedInput(text: string) {
  const parts = text.split(/(\+۲ ساعت دیگه|!فوری|#توسعه|هر هفته)/g);
  return parts.map((part, i) => {
    if (part === "+۲ ساعت دیگه") {
      return (
        <span
          key={i}
          className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded-md mx-0.5"
        >
          {part}
        </span>
      );
    }
    if (part === "!فوری") {
      return (
        <span
          key={i}
          className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded-md mx-0.5"
        >
          {part}
        </span>
      );
    }
    if (part === "#توسعه") {
      return (
        <span
          key={i}
          className="text-purple-400 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded-md mx-0.5"
        >
          {part}
        </span>
      );
    }
    if (part === "هر هفته") {
      return (
        <span
          key={i}
          className="text-blue-400 font-bold bg-blue-950/60 px-1.5 py-0.5 rounded-md mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function KeywordCard({
  title,
  example,
  tagColor,
  border,
}: {
  title: string;
  example: string;
  tagColor: string;
  border: string;
}) {
  return (
    <div className={`p-3 rounded-2xl border ${border} backdrop-blur-md text-start`}>
      <div className="text-xs font-bold text-zinc-300">{title}</div>
      <div className={`text-[11px] font-mono mt-1 ${tagColor}`}>{example}</div>
    </div>
  );
}

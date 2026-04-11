"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Calendar, MapPin, Users, FileText, Clock, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAME_TYPES, GRADES } from "@/lib/constants";
import { createGame } from "@/lib/supabase-data";
import type { GameType, GradeValue } from "@/lib/constants";

/** 試合登録ページ — Supabase接続版 */
export default function NewGamePage() {
  const router = useRouter();
  const [type, setType] = useState<GameType>("practice");
  const [selectedGrades, setSelectedGrades] = useState<GradeValue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // フォームの値
  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");
  const [items, setItems] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const adminState = localStorage.getItem("sk_admin") === "true";
    if (!adminState) {
      router.replace("/calendar");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) return null;

  const toggleGrade = (grade: GradeValue) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 簡易バリデーション
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }
    if (selectedGrades.length === 0) {
      alert("対象学年を選択してください");
      return;
    }
    if (!dateStart) {
      alert("開始日時を入力してください");
      return;
    }
    if (!venueName.trim()) {
      alert("会場名を入力してください");
      return;
    }

    setIsSaving(true);

    const result = await createGame({
      title: title.trim(),
      type,
      grades: selectedGrades,
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim() || undefined,
      meetingPlace: meetingPlace.trim() || undefined,
      dateStart: new Date(dateStart).toISOString(),
      dateEnd: dateEnd ? new Date(dateEnd).toISOString() : undefined,
      meetingTime: meetingTime || undefined,
      rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : undefined,
      opponent: opponent.trim() || undefined,
      items: items.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSaving(false);

    if (result) {
      alert("✅ 試合を登録しました！");
      router.push("/calendar");
    } else {
      alert("❌ 登録に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* 戻るボタン */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        カレンダーに戻る
      </Link>

      <h1 className="font-black text-lg flex items-center gap-1.5">
        <Calendar className="w-5 h-5 text-primary" />
        試合を登録
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 種別 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3 shadow-sm animate-fade-in-up">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <FileText className="w-4 h-4 text-primary" />
            種別 <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GAME_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95 touch-active outline-none",
                  type === t.value
                    ? `badge-${t.color} border-current shadow-sm`
                    : "border-border text-muted active:bg-surface-variant"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* タイトル + 対戦相手 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3.5 shadow-sm animate-fade-in-up animate-fade-in-up-delay-1">
          <FormField icon={<FileText className="w-4 h-4 text-primary" />} label="タイトル" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 春季大会 1回戦"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </FormField>

          <FormField icon={<Users className="w-4 h-4 text-muted" />} label="対戦相手">
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="例: 城東シニア"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </FormField>
        </div>

        {/* 対象学年 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3 shadow-sm animate-fade-in-up animate-fade-in-up-delay-1">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <Users className="w-4 h-4 text-primary" />
            対象学年 <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => toggleGrade(g.value)}
                className={cn(
                  "flex-1 px-2 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95 touch-active outline-none",
                  selectedGrades.includes(g.value)
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-border text-muted bg-surface active:bg-surface-variant"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日時 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3.5 shadow-sm animate-fade-in-up animate-fade-in-up-delay-2">
          <div className="grid grid-cols-2 gap-3">
            <FormField icon={<Calendar className="w-4 h-4 text-primary" />} label="開始日時" required>
              <input
                type="datetime-local"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input appearance-none"
              />
            </FormField>
            <FormField icon={<Calendar className="w-4 h-4 text-muted" />} label="終了日時">
              <input
                type="datetime-local"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input appearance-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <FormField icon={<Clock className="w-4 h-4 text-warning" />} label="集合時間">
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input appearance-none"
              />
            </FormField>
            <FormField icon={<Calendar className="w-4 h-4 text-muted" />} label="出欠締切">
              <input
                type="date"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input appearance-none"
              />
            </FormField>
          </div>
        </div>

        {/* 会場 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3.5 shadow-sm animate-fade-in-up animate-fade-in-up-delay-2">
          <FormField icon={<MapPin className="w-4 h-4 text-error" />} label="会場名" required>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="例: 市民球場 Aグラウンド"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </FormField>

          <FormField icon={<MapPin className="w-4 h-4 text-muted" />} label="会場住所">
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="例: 東京都○○区..."
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </FormField>

          <FormField icon={<MapPin className="w-4 h-4 text-muted" />} label="集合場所">
            <input
              type="text"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
              placeholder="例: 球場正面入口"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </FormField>
        </div>

        {/* 持ち物・備考 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3.5 shadow-sm animate-fade-in-up animate-fade-in-up-delay-3">
          <FormField icon={<Package className="w-4 h-4 text-info" />} label="持ち物・準備物">
            <textarea
              rows={3}
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="例: ユニフォーム一式、スパイク、飲み物..."
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none shadow-input leading-relaxed"
            />
          </FormField>

          <FormField icon={<FileText className="w-4 h-4 text-muted" />} label="備考">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="その他の連絡事項..."
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none shadow-input leading-relaxed"
            />
          </FormField>
        </div>

        {/* 送信ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] transition-all outline-none",
              isSaving
                ? "bg-primary/50 text-white cursor-not-allowed"
                : "bg-primary text-white active:bg-primary-light shadow-lg active:scale-[0.98] touch-active"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登録中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                試合を登録する
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/** フォームフィールド */
function FormField({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5">
        {icon}
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  );
}

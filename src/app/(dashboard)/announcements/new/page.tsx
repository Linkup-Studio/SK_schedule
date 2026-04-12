"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Megaphone, Users, FileText, Pin, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADES } from "@/lib/constants";
import type { GradeValue } from "@/lib/constants";

/** お知らせ投稿ページ — モバイル最適化 */
export default function NewAnnouncementPage() {
  const [selectedGrades, setSelectedGrades] = useState<GradeValue[]>([1, 2, 3]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => {
        const combined = [...prev, ...newFiles];
        return combined.slice(0, 3); // 最大3枚
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleGrade = (grade: GradeValue) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const selectAll = () => {
    setSelectedGrades([1, 2, 3]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("タイトルと本文を入力してください");
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("お知らせを投稿しました（モック）");
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* 戻るボタン */}
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1 text-[13px] text-muted active:text-primary transition-colors py-1 pr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        お知らせ一覧に戻る
      </Link>

      <h1 className="font-black text-lg flex items-center gap-1.5">
        <Megaphone className="w-5 h-5 text-primary" />
        お知らせを投稿
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* タイトル & 本文 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-4 shadow-sm animate-fade-in-up">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5">
              <FileText className="w-4 h-4 text-primary" />
              タイトル <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: GW合宿のお知らせ"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5">
              <FileText className="w-4 h-4 text-primary" />
              本文 <span className="text-error">*</span>
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="お知らせの内容を入力してください..."
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none shadow-input leading-relaxed"
            />
            <p className="text-[10px] font-bold text-muted text-right">現在 {body.length} 文字</p>
          </div>
        </div>

        {/* 対象学年 + ピン留め */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-4 shadow-sm animate-fade-in-up animate-fade-in-up-delay-1">
          {/* 対象学年 */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted pl-0.5">
              <Users className="w-4 h-4 text-primary" />
              対象学年 <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all active:scale-95 touch-active outline-none",
                  selectedGrades.length === 3
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-border text-muted bg-surface active:bg-surface-variant"
                )}
              >
                全学年
              </button>
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

          <div className="h-px bg-border/50 -mx-3.5" />

          {/* ピン留め */}
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all active:scale-[0.98] touch-active outline-none",
              isPinned
                ? "border-error bg-red-50 text-error shadow-sm"
                : "border-border text-muted bg-surface active:bg-surface-variant"
            )}
          >
            <Pin className={cn("w-5 h-5 shrink-0", isPinned && "fill-current")} />
            <div className="text-left font-sans">
              <p className="text-[13px] font-bold leading-tight mb-0.5">ピン留めする</p>
              <p className="text-[10px] font-medium opacity-80 leading-tight">未読見逃しを防ぐため、一覧の最上部に固定表示されます</p>
            </div>
          </button>
        </div>

        {/* 画像添付 */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 shadow-sm animate-fade-in-up animate-fade-in-up-delay-2">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted mb-2 pl-0.5">
            <Image className="w-4 h-4 text-primary" />
            画像添付（任意・最大3枚）
          </label>
          <label 
            htmlFor="image-upload"
            className="cursor-pointer block bg-background border-2 border-dashed border-border rounded-xl p-5 text-center active:bg-primary-50/50 active:border-primary/30 transition-all outline-none touch-active"
          >
            <input 
              id="image-upload"
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg, image/png"
              multiple
              className="hidden" 
            />
            <Image className="w-7 h-7 text-muted/50 mx-auto mb-2" />
            <p className="text-[13px] font-bold text-muted mb-0.5">タップして画像を選択</p>
            <p className="text-[10px] font-medium text-muted/80">JPEG, PNG (各5MB以下)</p>
          </label>

          {/* 画像プレビュー */}
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((file, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] pb-[1px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* プレビュー表示 */}
        {(title || body) && (
          <div className="bg-surface-variant/30 rounded-2xl border border-border p-3.5 space-y-2 animate-fade-in-up">
            <h3 className="text-[11px] font-bold text-muted mb-1 pl-0.5 flex items-center gap-1">
              📋 プレビュー
            </h3>
            <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
              {title && <h4 className="font-black text-[15px] mb-2 leading-tight">{title}</h4>}
              {body && (
                <p className="text-[13px] text-muted whitespace-pre-line leading-relaxed">
                  {body}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving || !title.trim() || !body.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] transition-all outline-none",
              isSaving || !title.trim() || !body.trim()
                ? "bg-primary/30 text-white cursor-not-allowed"
                : "bg-primary text-white active:bg-primary-light shadow-lg active:scale-[0.98] touch-active"
            )}
          >
            <Save className="w-5 h-5" />
            {isSaving ? "投稿中..." : "お知らせを投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}

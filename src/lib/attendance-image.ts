import type { AttendanceStatusValue } from "@/lib/constants";

/**
 * スタッフ出欠の一覧をPNG画像として描画する。
 * LINEはテキストを吹き出し幅で折り返すため、共有には画像のほうが崩れず読みやすい。
 */

export interface StaffAttendanceRow {
  name: string;
  morning: AttendanceStatusValue;
  afternoon: AttendanceStatusValue;
  note?: string;
}

export interface StaffAttendanceImageInput {
  teamName: string;
  dateLabel: string;
  games: { time: string; title: string; venue: string }[];
  rows: StaffAttendanceRow[];
}

const CANVAS_WIDTH = 720;
const SCALE = 2;
const PADDING = 32;

const COLORS = {
  primary: "#1a237e",
  onPrimary: "#ffffff",
  background: "#ffffff",
  foreground: "#1a1a2e",
  muted: "#6b7280",
  border: "#e8e8ee",
  stripe: "#f7f7fb",
  attend: "#16a34a",
  absent: "#dc2626",
  undecided: "#f59e0b",
} as const;

const STATUS_MARK: Record<AttendanceStatusValue, { icon: string; color: string }> = {
  attend: { icon: "○", color: COLORS.attend },
  absent: { icon: "×", color: COLORS.absent },
  undecided: { icon: "△", color: COLORS.undecided },
};

const FONT_STACK = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif';

function font(size: number, weight: "normal" | "bold" = "normal") {
  return `${weight} ${size}px ${FONT_STACK}`;
}

/** 幅に収まるように文字単位で折り返す（日本語は単語境界がないため） */
function wrapByWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    if (current && ctx.measureText(current + char).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/**
 * 1回のパスで「高さの計測」と「描画」の両方に使う。
 * draw=false のときは座標計算だけ行い、必要な全体の高さを返す。
 */
function layout(ctx: CanvasRenderingContext2D, input: StaffAttendanceImageInput, draw: boolean) {
  const contentWidth = CANVAS_WIDTH - PADDING * 2;
  const colAfternoon = CANVAS_WIDTH - PADDING - 60;
  const colMorning = colAfternoon - 96;
  const nameWidth = colMorning - PADDING - 70;

  // ---- ヘッダー（濃紺の帯） ----
  const headerHeight = 132;
  if (draw) {
    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, 0, CANVAS_WIDTH, headerHeight);
    ctx.fillStyle = COLORS.onPrimary;
    ctx.textBaseline = "alphabetic";
    ctx.font = font(38, "bold");
    ctx.fillText(`${input.dateLabel}のスタッフ出欠`, PADDING, 66);
    ctx.font = font(22);
    ctx.globalAlpha = 0.75;
    ctx.fillText(input.teamName, PADDING, 102);
    ctx.globalAlpha = 1;
  }
  let y = headerHeight + 34;

  // ---- この日の予定 ----
  if (input.games.length > 0) {
    if (draw) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(20, "bold");
      ctx.fillText("この日の予定", PADDING, y);
    }
    y += 30;

    for (const game of input.games) {
      ctx.font = font(24, "bold");
      const timeWidth = ctx.measureText(`${game.time}　`).width;
      const titleLines = wrapByWidth(ctx, game.title, contentWidth - timeWidth);
      if (draw) {
        ctx.fillStyle = COLORS.foreground;
        ctx.fillText(game.time, PADDING, y);
        titleLines.forEach((line, index) => {
          ctx.fillText(line, PADDING + timeWidth, y + index * 32);
        });
      }
      y += titleLines.length * 32;

      if (game.venue) {
        ctx.font = font(20);
        const venueLines = wrapByWidth(ctx, game.venue, contentWidth - timeWidth);
        if (draw) {
          ctx.fillStyle = COLORS.muted;
          venueLines.forEach((line, index) => {
            ctx.fillText(line, PADDING + timeWidth, y + index * 28);
          });
        }
        y += venueLines.length * 28;
      }
      y += 10;
    }
    y += 14;
  }

  // ---- 集計 ----
  const summary = (period: "morning" | "afternoon") =>
    (Object.keys(STATUS_MARK) as AttendanceStatusValue[])
      .map((status) => ({ status, count: input.rows.filter((row) => row[period] === status).length }))
      .filter((entry) => entry.count > 0);

  const summaryHeight = 62;
  if (draw) {
    ctx.fillStyle = COLORS.stripe;
    roundRect(ctx, PADDING, y - 20, contentWidth, summaryHeight, 12);

    ctx.fillStyle = COLORS.foreground;
    ctx.font = font(22, "bold");
    ctx.fillText(`回答 ${input.rows.length}名`, PADDING + 20, y + 18);

    let x = PADDING + 160;
    for (const period of ["morning", "afternoon"] as const) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = font(20, "bold");
      ctx.fillText(period === "morning" ? "午前" : "午後", x, y + 18);
      x += 48;
      for (const entry of summary(period)) {
        ctx.fillStyle = STATUS_MARK[entry.status].color;
        ctx.font = font(22, "bold");
        const label = `${STATUS_MARK[entry.status].icon}${entry.count}`;
        ctx.fillText(label, x, y + 18);
        x += ctx.measureText(label).width + 14;
      }
      x += 22;
    }
  }
  y += summaryHeight + 22;

  // ---- 表のヘッダー ----
  if (draw) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = font(20, "bold");
    ctx.fillText("スタッフ", PADDING, y);
    ctx.textAlign = "center";
    ctx.fillText("午前", colMorning, y);
    ctx.fillText("午後", colAfternoon, y);
    ctx.textAlign = "left";
  }
  y += 14;

  // ---- 各スタッフの行 ----
  for (const [index, row] of input.rows.entries()) {
    ctx.font = font(26, "bold");
    const nameLines = wrapByWidth(ctx, row.name, nameWidth);
    ctx.font = font(19);
    const noteLines = row.note ? wrapByWidth(ctx, `メモ: ${row.note}`, nameWidth + 40) : [];
    const rowHeight = Math.max(64, 26 + nameLines.length * 34 + noteLines.length * 26 + (noteLines.length > 0 ? 10 : 0));

    if (draw) {
      if (index % 2 === 1) {
        ctx.fillStyle = COLORS.stripe;
        ctx.fillRect(PADDING - 8, y, contentWidth + 16, rowHeight);
      }
      if (index < input.rows.length - 1) {
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PADDING - 8, y + rowHeight);
        ctx.lineTo(CANVAS_WIDTH - PADDING + 8, y + rowHeight);
        ctx.stroke();
      }

      ctx.fillStyle = COLORS.foreground;
      ctx.font = font(26, "bold");
      nameLines.forEach((line, lineIndex) => {
        ctx.fillText(line, PADDING, y + 42 + lineIndex * 34);
      });

      if (noteLines.length > 0) {
        ctx.fillStyle = COLORS.muted;
        ctx.font = font(19);
        noteLines.forEach((line, lineIndex) => {
          ctx.fillText(line, PADDING, y + 42 + nameLines.length * 34 + lineIndex * 26 - 4);
        });
      }

      ctx.textAlign = "center";
      ctx.font = font(34, "bold");
      ctx.fillStyle = STATUS_MARK[row.morning].color;
      ctx.fillText(STATUS_MARK[row.morning].icon, colMorning, y + 44);
      ctx.fillStyle = STATUS_MARK[row.afternoon].color;
      ctx.fillText(STATUS_MARK[row.afternoon].icon, colAfternoon, y + 44);
      ctx.textAlign = "left";
    }
    y += rowHeight;
  }

  return y + PADDING;
}

/** スタッフ出欠の一覧をPNGのBlobにする。Canvasが使えない環境ではnullを返す */
export async function renderStaffAttendanceImage(input: StaffAttendanceImageInput): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const measureCtx = canvas.getContext("2d");
  if (!measureCtx) return null;

  const height = layout(measureCtx, input, false);

  canvas.width = CANVAS_WIDTH * SCALE;
  canvas.height = Math.ceil(height) * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);
  layout(ctx, input, true);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

"use client";

import { useEffect } from "react";

/**
 * 引っ張って更新（ホーム画面アプリでもブラウザの再読み込みなしで最新版を取得できるようにする）。
 * 一球スコアで確立した方式: ページ最上部で強めに引っ張った時だけ発火する。
 */
export function PullToRefresh() {
  useEffect(() => {
    let startY: number | null = null;
    let pull = 0;
    let armed = false;
    let bar: HTMLDivElement | null = null;

    function scroller(el: Element | null): Element | null {
      while (el && el !== document.body) {
        const st = getComputedStyle(el);
        if (
          (st.overflowY === "auto" || st.overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight
        ) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    }

    function ensureBar(): HTMLDivElement {
      if (bar) return bar;
      bar = document.createElement("div");
      bar.style.cssText =
        "position:fixed;top:-60px;left:50%;transform:translateX(-50%);z-index:2147483000;background:#1e3a8a;color:#fff;font:700 14px -apple-system,sans-serif;padding:10px 18px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.25);transition:top .15s;pointer-events:none;";
      document.body.appendChild(bar);
      return bar;
    }

    function onTouchStart(e: TouchEvent) {
      pull = 0;
      armed = false;
      startY = null;
      const sc = scroller(e.target as Element);
      const atTop = (sc ? sc.scrollTop : window.scrollY) <= 0;
      if (atTop) startY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY === null) return;
      pull = e.touches[0].clientY - startY;
      if (pull > 40) {
        const b = ensureBar();
        armed = pull > 130;
        b.textContent = armed ? "↻ 離すと更新" : "↓ さらに引っ張って更新";
        b.style.top = Math.min(14, (pull - 40) / 4) + "px";
      }
    }

    function onTouchEnd() {
      if (bar) {
        if (armed) {
          bar.textContent = "↻ 更新中...";
          setTimeout(() => location.reload(), 150);
        } else {
          bar.style.top = "-60px";
        }
      }
      startY = null;
      pull = 0;
      armed = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      bar?.remove();
    };
  }, []);

  return null;
}

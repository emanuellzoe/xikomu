"use client";

import { useEffect } from "react";
import { landingHtml } from "./landingHtml";

/**
 * Landing page ported from the Casa Flow static template.
 * Markup is injected verbatim (display:contents keeps nav/main/footer as
 * direct flex children of <body>); the original scroll/animation script
 * runs here in a post-mount effect. Colors match the in-app orange (#FF5E00).
 */
export default function Landing() {
  // Refresh the hero stats with live on-chain data so the numbers stay current
  // without a redeploy. The static markup ships ONCHAIN_STATS as the fallback.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const s = await res.json();
        if (cancelled || !s || typeof s.flips !== "number") return;

        const setText = (id: string, text: string) => {
          const el = document.getElementById(id);
          if (el) el.textContent = text;
        };
        setText("stat-flips", s.flips.toLocaleString());
        setText("stat-players", s.uniquePlayers.toLocaleString());
        setText("stat-winrate", `${s.winRatePct}%`);
        setText("stat-block", Number(s.block).toLocaleString());
      } catch {
        /* keep the static fallback numbers */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Interactive hero coin: tap (or let it auto-flip) to spin and land on a
  // random Heads/Tails. Transform accumulates so each flip keeps spinning
  // forward; CSS eases the deceleration into a satisfying settle.
  useEffect(() => {
    const wrapper = document.getElementById("svg-wrapper");
    const hint = document.getElementById("hero-coin-hint");
    const result = document.getElementById("hero-coin-result");
    let rotation = 0;
    let flipping = false;
    let autoTimer: ReturnType<typeof setTimeout> | undefined;

    const flip = () => {
      const coin = document.getElementById("hero-coin");
      if (!coin || flipping) return;
      flipping = true;
      const heads = Math.random() < 0.5;
      const turns = 4 + Math.floor(Math.random() * 2); // 4–5 full spins
      const aligned = rotation - (rotation % 360); // current heads-facing base
      rotation = aligned + turns * 360 + (heads ? 0 : 180);
      coin.style.transform = `rotateY(${rotation}deg)`;
      if (hint) hint.style.opacity = "0";
      if (result) result.style.opacity = "0";
      setTimeout(() => {
        if (result) {
          result.textContent = heads ? "Heads" : "Tails";
          result.style.color = heads ? "#FF5E00" : "#78716C";
          result.style.opacity = "1";
        }
        flipping = false;
      }, 1150);
    };

    const schedule = () => { autoTimer = setTimeout(tick, 4200); };
    const tick = () => { flip(); schedule(); };
    const onClick = (e: Event) => {
      if (!(e.target as HTMLElement).closest("#hero-coin")) return;
      if (autoTimer) clearTimeout(autoTimer);
      flip();
      schedule();
    };

    if (wrapper) wrapper.addEventListener("click", onClick);
    schedule(); // start ambient auto-flips

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      if (wrapper) wrapper.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    let running = true;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const mapRange = (val: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
      outMin + ((clamp(val, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

    // SVG draw loop on hover
    const svgWrapper = document.getElementById("svg-wrapper");
    let loopInterval: ReturnType<typeof setInterval> | undefined;
    const onSvgEnter = () => {
      // Only the legacy SVG draw-loop needs the innerHTML restart; skip it when
      // the wrapper holds the interactive coin (resetting would wipe its state).
      if (!svgWrapper || !svgWrapper.querySelector("svg")) return;
      const restart = () => { svgWrapper.innerHTML = svgWrapper.innerHTML; };
      restart();
      loopInterval = setInterval(restart, 3200);
    };
    const onSvgLeave = () => { if (loopInterval) clearInterval(loopInterval); };
    if (svgWrapper) {
      svgWrapper.addEventListener("mouseenter", onSvgEnter);
      svgWrapper.addEventListener("mouseleave", onSvgLeave);
    }

    // Staggered reveal
    const ctaObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".cta-bounce-enter").forEach((line, index) => {
              setTimeout(() => line.classList.add("active"), index * 150);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.3 }
    );
    ["cta-heading", "hero-heading", "gallery-content-wrapper", "live-quote-text-content"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) ctaObserver.observe(el);
    });

    // Winnings projection slider: net CELO from N winning 1-CELO flips at 1.95x.
    const slider = document.getElementById("finance-slider") as HTMLInputElement | null;
    const monthsDisplay = document.getElementById("months-display");
    const completionPrice = document.getElementById("completion-price");
    const netPerWin = 0.95; // 1.95x payout on a 1 CELO bet = +0.95 CELO net
    const onSlider = (e: Event) => {
      const wins = parseInt((e.target as HTMLInputElement).value);
      if (!monthsDisplay || !completionPrice) return;
      if (wins === 0) {
        monthsDisplay.textContent = "0 WINS";
        completionPrice.textContent = "0 CELO";
      } else {
        monthsDisplay.textContent = wins === 1 ? "1 WIN" : `${wins} WINS`;
        const projected = netPerWin * wins;
        completionPrice.textContent =
          projected.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " CELO";
      }
    };
    if (slider) slider.addEventListener("input", onSlider);

    // FAQ is a static <details> accordion now (see landingHtml) — no JS needed.

    // Scroll-driven animations
    const parallaxSection = document.getElementById("collections");
    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>(".parallax-item"));
    const paySec = document.getElementById("payment-section");
    const mockViewport = document.getElementById("mockup-viewport");
    const mockScroll = document.getElementById("mockup-scroll-content");
    const animItems = Array.from(document.querySelectorAll<HTMLElement>(".checkout-anim-item"));
    const fastItems = Array.from(document.querySelectorAll<HTMLElement>(".fast-item"));
    const quoteHeader = document.getElementById("quote-header");
    const m1 = document.getElementById("m1");
    const m2 = document.getElementById("m2");
    const m3 = document.getElementById("m3");
    const mLine = document.getElementById("milestone-progress-line");
    const featSec = document.getElementById("features-section");
    const featHeading = document.getElementById("features-heading");
    const featCard1 = document.getElementById("feature-card-1");
    const featCard2 = document.getElementById("feature-card-2");
    const featCard3 = document.getElementById("feature-card-3");

    let currentPayProg = 0;
    let currentParallaxProg = -1;

    function updateScroll() {
      if (!running) return;
      const windowHeight = window.innerHeight;

      if (featSec && featCard1 && featCard2 && featCard3) {
        const rect = featSec.getBoundingClientRect();
        const rawP = -rect.top / (rect.height - windowHeight);
        const p = clamp(rawP, 0, 1);
        const easeP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        if (featHeading) {
          const hProg = clamp(rawP * 3, 0, 1);
          featHeading.style.opacity = String(hProg);
          featHeading.style.transform = `translateY(${20 * (1 - hProg)}px)`;
        }
        if (window.innerWidth >= 1024) {
          featCard1.style.transform = `translateX(calc(${-15 - 105 * easeP}%)) rotate(${-3 - 9 * easeP}deg) translateY(${10 * easeP}px)`;
          featCard2.style.transform = `translateY(${-15 * easeP}px) scale(${1 + 0.05 * easeP})`;
          featCard3.style.transform = `translateX(calc(${15 + 105 * easeP}%)) rotate(${3 + 9 * easeP}deg) translateY(${10 * easeP}px)`;
        } else {
          featCard1.style.transform = `translateY(calc(${-5 - 55 * easeP}%)) rotate(${-2 - 4 * easeP}deg) scale(${1 - 0.05 * easeP})`;
          featCard2.style.transform = `scale(${1 + 0.02 * easeP})`;
          featCard3.style.transform = `translateY(calc(${5 + 55 * easeP}%)) rotate(${2 + 4 * easeP}deg) scale(${1 - 0.05 * easeP})`;
        }
      }

      if (parallaxSection) {
        const rect = parallaxSection.getBoundingClientRect();
        if (rect.top <= windowHeight && rect.bottom >= 0) {
          let targetProg = clamp(-rect.top / (rect.height - windowHeight), 0, 1);
          if (currentParallaxProg === -1) currentParallaxProg = targetProg;
          currentParallaxProg += (targetProg - currentParallaxProg) * 0.08;
          parallaxItems.forEach((item) => {
            const speed = parseFloat(item.dataset.speed || "0");
            const rot = parseFloat(item.dataset.rotation || "0");
            const travelDistance = windowHeight * 2.2;
            const yOffset = (0.5 - currentParallaxProg) * travelDistance * speed;
            item.style.transform = `translateY(${yOffset}px) rotate(${rot}deg)`;
          });
        }
      }

      if (paySec && mockScroll && mockViewport) {
        const pRect = paySec.getBoundingClientRect();
        const targetPayProg = Math.max(0, Math.min(1, -pRect.top / (pRect.height - windowHeight)));
        currentPayProg += (targetPayProg - currentPayProg) * 0.05;
        const prog = currentPayProg;
        if (quoteHeader) {
          quoteHeader.style.transform = `translateY(${mapRange(prog, 0.0, 0.1, -20, 0)}px)`;
          quoteHeader.style.opacity = String(mapRange(prog, 0.0, 0.1, 0, 1));
        }
        const maxScroll = mockScroll.scrollHeight - mockViewport.clientHeight;
        if (maxScroll > 0) {
          mockScroll.style.transform = `translateY(${-mapRange(prog, 0.1, 0.9, 0, maxScroll + 50)}px)`;
        }
        animItems.forEach((item, idx) => {
          const start = 0.05 + idx * 0.05;
          const itemP = clamp(mapRange(prog, start, start + 0.1, 0, 1), 0, 1);
          const dir = item.dataset.anim === "left" ? -20 : item.dataset.anim === "right" ? 20 : 0;
          const yDir = item.dataset.anim === "summary" ? 20 : 0;
          item.style.opacity = String(itemP);
          item.style.transform = `translate(${dir * (1 - itemP)}px, ${yDir * (1 - itemP)}px) scale(${0.95 + 0.05 * itemP})`;
        });
        const fProg = clamp(mapRange(prog, 0.15, 0.35, 0, 1), 0, 1);
        fastItems.forEach((item, idx) => {
          const step = 1 / fastItems.length;
          const itemStart = idx * step;
          const itemP = clamp(mapRange(fProg, itemStart, itemStart + step * 2, 0, 1), 0, 1);
          item.style.opacity = String(itemP);
          item.style.transform = `translateY(${15 * (1 - itemP)}px)`;
        });
        if (m1 && m2 && m3 && mLine) {
          const mProg = clamp(mapRange(prog, 0.45, 0.85, 0, 1), 0, 1);
          mLine.style.height = `${mProg * 100}%`;
          if (mProg > 0.05) { m1.classList.add("active"); mLine.classList.add("drawing-active"); }
          else { m1.classList.remove("active"); mLine.classList.remove("drawing-active"); }
          m2.classList.toggle("active", mProg > 0.45);
          m3.classList.toggle("active", mProg > 0.85);
        }
      }

      rafId = requestAnimationFrame(updateScroll);
    }
    rafId = requestAnimationFrame(updateScroll);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      if (loopInterval) clearInterval(loopInterval);
      if (svgWrapper) {
        svgWrapper.removeEventListener("mouseenter", onSvgEnter);
        svgWrapper.removeEventListener("mouseleave", onSvgLeave);
      }
      if (slider) slider.removeEventListener("input", onSlider);
      ctaObserver.disconnect();
    };
  }, []);

  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: landingHtml }} />;
}

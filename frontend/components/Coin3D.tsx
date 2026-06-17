"use client";

import { useEffect, useRef } from "react";
import { initCoin3D, type Coin3DHandle } from "@/lib/coin3d";

/**
 * Controlled 3D coin for the game.
 * - `spinning` true  -> tumble continuously (a flip tx is pending);
 * - `spinning` false -> land on `face` (the on-chain result) and rest there.
 * `face` is the side to show/land on (true = Heads). On a true→false `spinning`
 * transition the coin animates a landing; otherwise it just rests on `face`.
 */
export default function Coin3D({
  face,
  spinning,
  className,
}: {
  face: boolean;
  spinning: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<Coin3DHandle | null>(null);
  const faceRef = useRef(face);
  const wasSpinning = useRef(false);
  faceRef.current = face;

  useEffect(() => {
    if (!canvasRef.current) return;
    const handle = initCoin3D(canvasRef.current, {
      autoSpin: false,
      interactive: false,
      face: faceRef.current,
    });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  // Drive tumble/land off the `spinning` flag. Landing only fires on a real
  // true→false transition so the initial mount just rests on `face`.
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    if (spinning) {
      handle.setSpinning(true);
      wasSpinning.current = true;
    } else if (wasSpinning.current) {
      handle.land(faceRef.current);
      wasSpinning.current = false;
    }
  }, [spinning]);

  // Reflect face changes while idle (e.g., result cleared) without animating.
  useEffect(() => {
    if (!spinning && !wasSpinning.current) handleRef.current?.setFace(face);
  }, [face, spinning]);

  return <canvas ref={canvasRef} className={className} />;
}

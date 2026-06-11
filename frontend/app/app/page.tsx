"use client";

import { useState } from "react";
import CeloFlip from "@/components/CeloFlip";
import StacksFlip from "@/components/StacksFlip";
import type { Chain } from "@/components/ChainToggle";

// Single game surface. A header toggle picks the chain; each chain has its own
// wallet + contract engine behind the same UI. One deploy, one URL.
export default function AppPage() {
  const [chain, setChain] = useState<Chain>("celo");
  return chain === "celo" ? (
    <CeloFlip chain={chain} setChain={setChain} />
  ) : (
    <StacksFlip chain={chain} setChain={setChain} />
  );
}

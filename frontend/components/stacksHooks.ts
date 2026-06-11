"use client";

import { useCallback, useEffect, useState } from "react";
import { connect, disconnect, getLocalStorage } from "@stacks/connect";
import { getChips, getHouse } from "@/lib/stacks";

/** Connect / read the active Stacks address (Xverse, Leather, …) via @stacks/connect. */
export function useStacksWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const sync = useCallback(() => {
    const stx = getLocalStorage()?.addresses?.stx?.[0]?.address ?? null;
    setAddress(stx);
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const doConnect = useCallback(async () => {
    setConnecting(true);
    try {
      await connect(); // opens the wallet picker; persists to localStorage
      sync();
    } finally {
      setConnecting(false);
    }
  }, [sync]);

  const doDisconnect = useCallback(() => {
    disconnect();
    setAddress(null);
  }, []);

  return { address, connecting, connect: doConnect, disconnect: doDisconnect };
}

/** Poll the on-chain chips (for `address`) and house pool every few seconds. */
export function useFlipData(address: string | null) {
  const [chips, setChips] = useState<bigint>();
  const [house, setHouse] = useState<bigint>();

  const refresh = useCallback(async () => {
    try {
      setHouse(await getHouse());
    } catch {
      /* transient RPC error — keep last value */
    }
    if (!address) {
      setChips(undefined);
      return;
    }
    try {
      setChips(await getChips(address));
    } catch {
      /* keep last value */
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { chips, house, refresh };
}

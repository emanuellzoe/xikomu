import { describe, expect, it } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";

const CONTRACT = "xikomu-flip";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!; // contract owner (tx-sender at deploy)
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

const MIN_BET = 10_000n;
const MAX_BET = 5_000_000n;
const STX = 1_000_000n; // 1 STX in microSTX

// --- helpers ---------------------------------------------------------------

function asUint(cv: any): bigint {
  return BigInt(cvToValue(cv));
}

function readUint(fn: string, args: any[] = []): bigint {
  const { result } = simnet.callReadOnlyFn(CONTRACT, fn, args, deployer);
  return asUint(result);
}

const chipsOf = (who: string) => readUint("get-chips", [Cl.principal(who)]);
const totalChips = () => readUint("get-total-chips");
const house = () => readUint("get-house-liquidity");
const backing = () => readUint("backing-required");
const contractStx = () => readUint("get-stx-balance");
const netWin = (bet: bigint) => (bet * 195n) / 100n - bet;

function buy(who: string, amount: bigint) {
  return simnet.callPublicFn(CONTRACT, "buy-credits", [Cl.uint(amount)], who);
}
function fundHouse(amount: bigint) {
  return simnet.callPublicFn(CONTRACT, "fund-house", [Cl.uint(amount)], deployer);
}
function flip(who: string, bet: bigint, heads: boolean) {
  return simnet.callPublicFn(CONTRACT, "flip", [Cl.uint(bet), Cl.bool(heads)], who);
}

// ---------------------------------------------------------------------------

describe("XikomuFlip — deploy", () => {
  it("deployer is the owner, not paused, empty pools", () => {
    const owner = simnet.callReadOnlyFn(CONTRACT, "get-owner", [], deployer).result;
    expect(owner).toBePrincipal(deployer);
    expect(simnet.callReadOnlyFn(CONTRACT, "is-paused", [], deployer).result).toBeBool(false);
    expect(totalChips()).toBe(0n);
    expect(house()).toBe(0n);
    expect(backing()).toBe(0n);
  });
});

describe("buy-credits", () => {
  it("credits chips 1:1 and custodies the STX", () => {
    const res = buy(alice, 2n * STX);
    expect(res.result).toBeOk(Cl.uint(2n * STX));
    expect(chipsOf(alice)).toBe(2n * STX);
    expect(totalChips()).toBe(2n * STX);
    expect(contractStx()).toBe(2n * STX);
    expect(contractStx()).toBe(backing());
  });

  it("reverts on zero amount", () => {
    expect(buy(alice, 0n).result).toBeErr(Cl.uint(101));
  });

  it("reverts while paused", () => {
    simnet.callPublicFn(CONTRACT, "pause", [], deployer);
    expect(buy(alice, STX).result).toBeErr(Cl.uint(105));
    simnet.callPublicFn(CONTRACT, "unpause", [], deployer);
  });
});

describe("cash-out", () => {
  it("returns STX, reduces chips, keeps backing in sync", () => {
    buy(alice, 3n * STX);
    const before = simnet.getAssetsMap().get("STX")!.get(alice)!;
    const res = simnet.callPublicFn(CONTRACT, "cash-out", [Cl.uint(STX)], alice);
    expect(res.result).toBeOk(Cl.uint(2n * STX));
    expect(chipsOf(alice)).toBe(2n * STX);
    expect(contractStx()).toBe(backing());
    const after = simnet.getAssetsMap().get("STX")!.get(alice)!;
    expect(after - before).toBe(STX);
  });

  it("reverts on zero / insufficient chips", () => {
    buy(alice, STX);
    expect(simnet.callPublicFn(CONTRACT, "cash-out", [Cl.uint(0n)], alice).result).toBeErr(Cl.uint(101));
    expect(
      simnet.callPublicFn(CONTRACT, "cash-out", [Cl.uint(100n * STX)], alice).result
    ).toBeErr(Cl.uint(103));
  });

  it("works even while paused (cash-out always allowed)", () => {
    buy(alice, STX);
    simnet.callPublicFn(CONTRACT, "pause", [], deployer);
    const res = simnet.callPublicFn(CONTRACT, "cash-out", [Cl.uint(STX)], alice);
    expect(res.result.type).toBe(ClarityType.ResponseOk);
    simnet.callPublicFn(CONTRACT, "unpause", [], deployer);
  });
});

describe("flip — guards", () => {
  it("reverts when bet is out of range", () => {
    buy(alice, 10n * STX);
    fundHouse(10n * STX);
    expect(flip(alice, MIN_BET - 1n, true).result).toBeErr(Cl.uint(102));
    expect(flip(alice, MAX_BET + 1n, true).result).toBeErr(Cl.uint(102));
  });

  it("reverts without enough chips", () => {
    fundHouse(10n * STX);
    expect(flip(bob, STX, true).result).toBeErr(Cl.uint(103));
  });

  it("reverts when the house can't cover the net win", () => {
    buy(alice, 10n * STX);
    // house empty -> any bet's net win is uncoverable
    expect(flip(alice, STX, true).result).toBeErr(Cl.uint(104));
  });
});

describe("flip — settlement & invariants", () => {
  it("a single flip settles correctly and conserves backing", () => {
    buy(alice, 10n * STX);
    fundHouse(10n * STX);
    const bet = STX;
    const nw = netWin(bet);
    const beforeChips = chipsOf(alice);
    const beforeHouse = house();
    const lockedBacking = backing();

    const res = flip(alice, bet, true);
    expect(res.result.type).toBe(ClarityType.ResponseOk);

    const afterChips = chipsOf(alice);
    const afterHouse = house();

    if (afterChips > beforeChips) {
      // won
      expect(afterChips - beforeChips).toBe(nw);
      expect(beforeHouse - afterHouse).toBe(nw);
    } else {
      // lost
      expect(beforeChips - afterChips).toBe(bet);
      expect(afterHouse - beforeHouse).toBe(bet);
    }
    // backing is conserved by a flip and matches custodied STX
    expect(backing()).toBe(lockedBacking);
    expect(contractStx()).toBe(backing());
  });

  it("backing invariant holds over many flips", () => {
    buy(alice, 50n * STX);
    fundHouse(50n * STX);
    const lockedBacking = backing();
    for (let i = 0; i < 40; i++) {
      const r = flip(alice, MIN_BET * 10n, i % 2 === 0);
      // chips may run dry only if alice loses a lot; tolerate insufficient-chips
      expect([ClarityType.ResponseOk, ClarityType.ResponseErr]).toContain(r.result.type);
      expect(backing()).toBe(lockedBacking);
      expect(contractStx()).toBe(backing());
    }
  });
});

describe("house liquidity — owner only, never player chips", () => {
  it("fund-house: non-owner reverts, owner succeeds", () => {
    expect(simnet.callPublicFn(CONTRACT, "fund-house", [Cl.uint(STX)], alice).result).toBeErr(
      Cl.uint(100)
    );
    expect(fundHouse(STX).result).toBeOk(Cl.uint(STX));
    expect(house()).toBe(STX);
  });

  it("withdraw-house: non-owner reverts; owner capped at house pool (can't touch chips)", () => {
    buy(alice, 5n * STX); // player chips now custodied alongside the house
    fundHouse(2n * STX);
    expect(
      simnet.callPublicFn(CONTRACT, "withdraw-house", [Cl.uint(STX)], alice).result
    ).toBeErr(Cl.uint(100));
    // owner cannot pull more than house-liquidity even though more STX is custodied
    expect(
      simnet.callPublicFn(CONTRACT, "withdraw-house", [Cl.uint(house() + 1n)], deployer).result
    ).toBeErr(Cl.uint(104));
    // exact house amount is withdrawable; player chips remain backed
    const h = house();
    expect(simnet.callPublicFn(CONTRACT, "withdraw-house", [Cl.uint(h)], deployer).result).toBeOk(
      Cl.uint(0)
    );
    expect(chipsOf(alice)).toBe(5n * STX);
    expect(contractStx()).toBe(backing());
  });
});

describe("admin — pause & 2-step ownership", () => {
  it("only owner can pause/unpause", () => {
    expect(simnet.callPublicFn(CONTRACT, "pause", [], alice).result).toBeErr(Cl.uint(100));
    expect(simnet.callPublicFn(CONTRACT, "pause", [], deployer).result).toBeOk(Cl.bool(true));
    expect(simnet.callPublicFn(CONTRACT, "unpause", [], deployer).result).toBeOk(Cl.bool(true));
  });

  it("ownership transfers in two steps", () => {
    expect(
      simnet.callPublicFn(CONTRACT, "transfer-ownership", [Cl.principal(alice)], bob).result
    ).toBeErr(Cl.uint(100)); // only owner nominates
    expect(
      simnet.callPublicFn(CONTRACT, "transfer-ownership", [Cl.principal(alice)], deployer).result
    ).toBeOk(Cl.bool(true));
    // a non-nominee cannot accept
    expect(simnet.callPublicFn(CONTRACT, "accept-ownership", [], bob).result).toBeErr(Cl.uint(107));
    // the nominee accepts and becomes owner
    expect(simnet.callPublicFn(CONTRACT, "accept-ownership", [], alice).result).toBeOk(Cl.bool(true));
    expect(simnet.callReadOnlyFn(CONTRACT, "get-owner", [], deployer).result).toBePrincipal(alice);
  });
});

describe("views", () => {
  it("preview-net-win and backing-required compute as expected", () => {
    expect(readUint("preview-net-win", [Cl.uint(STX)])).toBe(netWin(STX));
    buy(alice, 4n * STX);
    fundHouse(3n * STX);
    expect(backing()).toBe(7n * STX);
  });
});

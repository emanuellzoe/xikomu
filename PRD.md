# PRD — Xikomu Auto-Save

**Status:** v1 (MVP) · **Owner:** xikomu team · **Target:** Celo Proof of Ship S2 (deadline onchain 22 Jun 2026)

> Dokumen ini adalah **sumber kebenaran**. Saat coding, ikuti spec ini. Jangan menambah scope di luar "v1 (MVP)" tanpa update PRD. Nilai bertanda `⚠️ VERIFY` harus dikonfirmasi dari sumber resmi sebelum dipakai — jangan diasumsikan.

---

## 1. Ringkasan produk

Mini-app MiniPay untuk **menabung cUSD otomatis & berulang**. User set rencana (jumlah + interval) sekali; keeper bot mengeksekusi `executeSave` tiap jatuh tempo, memindahkan cUSD dari wallet user (via allowance) ke saldo per-user di vault. User bisa **withdraw kapan saja**.

**Bukan**: trading bot, prediksi harga, yield farming, swap/DCA ke koin lain (itu v2). Keeper **deterministik berbasis jadwal**, bukan AI.

---

## 2. Tujuan & non-tujuan

### Tujuan v1
1. `AutoSaveVault.sol` ter-deploy & **verified** di Celo Mainnet.
2. Keeper bot live mengeksekusi save terjadwal (1 user = 1 tx, no loop on-chain).
3. Next.js mini-app (web + MiniPay view): connect, createPlan, lihat progress, withdraw.
4. Terdaftar di talent.app + Proof of Ship campaign.

### Non-tujuan v1 (JANGAN dikerjakan dulu)
- Swap / DCA ke token lain (v2) · Yield routing (v2) · LLM/chat (opsional, paling akhir, free tier)
- Multi-token & multi-plan (v1: **cUSD saja, 1 plan/user**)
- Backend/indexer (riwayat dibaca dari events, no backend)
- Upgradeable/proxy (**ditolak** — immutable demi anti-rug)

---

## 3. Konstanta chain

| Item | Value |
|---|---|
| Celo Mainnet chainId | `42220` |
| Celo Mainnet RPC | `https://forno.celo.org` |
| Explorer (verify) | Celoscan `https://celoscan.io` |
| **cUSD (mainnet)** | `0x765DE816845861e75A25fCA122bb6898B8B1282a` (hardcoded di kontrak) |
| Testnet | Alfajores `44787` (cUSD `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`, RPC `https://alfajores-forno.celo-testnet.org`) ⚠️ VERIFY: Alfajores vs Celo Sepolia (sebagian repo referensi pakai Celo Sepolia). Untuk testnet, alamat cUSD beda → **set lewat constructor arg di deploy testnet**, mainnet pakai konstanta. |

> Untuk fleksibilitas testnet vs mainnet tanpa mengorbankan immutability: alamat cUSD di-set **sekali di `constructor` (immutable variable)**, default-nya alamat mainnet. Tetap tidak bisa diubah setelah deploy.

---

## 4. Smart Contract — `AutoSaveVault.sol`

### 4.1 Prinsip (LOCKED)
- **Immutable / non-upgradeable.** Tidak ada proxy, tidak ada fungsi upgrade.
- **No unbounded loop on-chain.** Keeper iterasi off-chain → panggil per-user. Hot path O(1).
- **Storage di-pack** (Plan = 1 slot). Custom errors. Events untuk riwayat.
- **CEI + ReentrancyGuard + SafeERC20** (OpenZeppelin).
- **Kuasa owner minimal & tidak bisa menyentuh dana:**
  - Owner cuma bisa `pause()/unpause()`.
  - `pause` memblokir **setoran baru** (`createPlan`, `executeSave`) saja.
  - **`withdraw` SELALU jalan, termasuk saat paused.** Owner tidak bisa mengunci dana.
  - Tidak ada fungsi yang mengubah `balanceOf` user / menarik dana user. Tidak ada `drain`.
  - `Ownable2Step` (transfer owner 2 langkah). Bisa dipindah ke multisig / renounce nanti.

### 4.2 Storage

```solidity
IERC20 public immutable cusd;          // di-set di constructor (default mainnet cUSD)

struct Plan {
    uint128 amount;    // jumlah per eksekusi (18 desimal)   ┐
    uint64  interval;  // detik antar save                   ├─ 1 slot (16+8+8 = 32 byte)
    uint64  nextRun;   // timestamp eligible berikutnya       ┘
}
mapping(address => Plan) public plans;        // 1 plan/user; "aktif" = amount != 0
mapping(address => uint256) public balanceOf; // saldo tabungan cUSD per user
```
> Tidak ada field `active` terpisah (hemat slot). Plan aktif jika `amount != 0`. `cancelPlan` = `delete plans[user]`.

### 4.3 Konstanta
```solidity
uint64 public constant MIN_INTERVAL = 60;        // 60 detik (demo cepat & banyak tx)
uint64 public constant MAX_INTERVAL = 365 days;  // batas atas wajar
```
> Hardcoded — **tidak ada setter**. Menghilangkan kuasa owner atas parameter ini.

### 4.4 Fungsi (interface final)

```solidity
// ---- User ----
function createPlan(uint128 amount, uint64 interval) external whenNotPaused;
//   require amount > 0 (ZeroAmount)
//   require MIN_INTERVAL <= interval <= MAX_INTERVAL (IntervalOutOfRange)
//   plans[msg.sender] = Plan(amount, interval, uint64(block.timestamp) + interval); // save pertama tunggu 1 interval
//   emit PlanCreated

function cancelPlan() external;
//   require plans[msg.sender].amount != 0 (NoActivePlan)
//   delete plans[msg.sender]; emit PlanCancelled   // boleh saat paused (tak menyentuh dana)

function withdraw(uint256 amount) external nonReentrant;   // TANPA whenNotPaused — selalu jalan
//   require balanceOf[msg.sender] >= amount (InsufficientBalance)
//   balanceOf[msg.sender] -= amount;                       // effect
//   cusd.safeTransfer(msg.sender, amount);                 // interaction
//   emit Withdrawn

// ---- Keeper / publik (permissionless) ----
function executeSave(address user) external nonReentrant whenNotPaused;
//   Plan memory p = plans[user];
//   require p.amount != 0 (NoActivePlan)
//   require block.timestamp >= p.nextRun (NotDue)
//   plans[user].nextRun = uint64(block.timestamp) + p.interval;  // effect (sebelum interaction)
//   balanceOf[user] += p.amount;                                 // effect
//   cusd.safeTransferFrom(user, address(this), p.amount);        // interaction (revert kalau allowance/saldo kurang → rollback)
//   emit Saved
//   AMAN permissionless: dana hanya pindah dari wallet user (yg sudah approve) ke SALDO user sendiri.

// ---- Views ----
function getPlan(address user) external view returns (Plan memory);
function previewDue(address user) external view returns (bool);
//   return plans[user].amount != 0 && block.timestamp >= plans[user].nextRun;

// ---- Admin (Ownable2Step) ----
function pause() external onlyOwner;
function unpause() external onlyOwner;
```

### 4.5 Events
```solidity
event PlanCreated(address indexed user, uint128 amount, uint64 interval, uint64 nextRun);
event PlanCancelled(address indexed user);
event Saved(address indexed user, uint128 amount, uint64 nextRun, uint256 newBalance);
event Withdrawn(address indexed user, uint256 amount);
```

### 4.6 Errors (custom)
`ZeroAmount, IntervalOutOfRange, NoActivePlan, NotDue, InsufficientBalance` (+ `EnforcedPause` dari OZ Pausable, revert SafeERC20).

### 4.7 Keputusan (RESOLVED — final)
- ✅ Immutable (bukan upgradeable) — anti-rug untuk kontrak pegang-dana.
- ✅ `executeSave` permissionless (aman karena dana ke saldo user sendiri).
- ✅ Save pertama tunggu 1 interval (tidak menarik dana saat create).
- ✅ 1 plan/user, cUSD saja (v1).
- ✅ Owner hanya `pause`; `withdraw` selalu jalan.

### 4.8 Checklist audit sebelum mainnet
- [ ] Tidak ada loop atas data dinamis (by design)
- [ ] CEI di `withdraw` & `executeSave`
- [ ] ReentrancyGuard di fungsi transfer
- [ ] SafeERC20 untuk transfer & transferFrom
- [ ] Owner tak bisa menyentuh dana (review semua fungsi onlyOwner)
- [ ] `withdraw` tidak ber-`whenNotPaused`
- [ ] Events di semua perubahan state
- [ ] Solidity 0.8+ (overflow check otomatis)
- [ ] `forge test` hijau (happy path + semua revert case)

---

## 5. Keeper Bot (`keeper/`)
**Tugas:** tiap interval cron, cari plan `due`, panggil `executeSave(user)` per user.
**Logika (off-chain, no on-chain loop):**
1. Kumpulkan user dari event `PlanCreated` minus `PlanCancelled` (baca log / set lokal).
2. Tiap user: cek `previewDue(user)` (view, gratis) → jika due, kirim tx `executeSave(user)`.
3. Wallet keeper sendiri (EOA) bayar gas. **Tidak** memegang dana user.
4. Idempotent: kalau belum due, kontrak revert `NotDue` → skip (tangani error).
**Config:** `KEEPER_PRIVATE_KEY`, `RPC_URL`, `VAULT_ADDRESS`, `CRON_INTERVAL`, `BATCH_SIZE`.
**Transparansi:** keeper = fitur produk, didokumentasikan. Melakukan kerja nyata (eksekusi rencana user), bukan no-op/spam, bukan menyamar jadi user manusia.

---

## 6. Frontend (`web/`) — Next.js (sederhana dulu)
2 tampilan: **MiniPay (mobile, prioritas)** + **Web (desktop)**.
- **MiniPay**: auto-connect injected provider (`window.ethereum.isMiniPay`), pasang MiniPay hook (booster).
- **Layar**: (1) Dashboard — saldo, plan aktif, progress, tombol Tambah/Tarik; (2) Create Plan — jumlah + interval (preset harian/mingguan + custom) → `approve` + `createPlan`; (3) Withdraw; (4) Riwayat dari events.
- **Web**: landing + dashboard responsive, connect via wagmi.
- **Teknis**: wagmi v2 + viem + Tailwind, chain Celo Mainnet (+ testnet dev), ABI dari output Foundry.

---

## 7. Alur data (E2E)
```
1. Buka mini-app di MiniPay → auto-connect
2. Create Plan: approve(vault, X) → createPlan(amount, interval)            [2 tx]
3. Tiap interval: keeper → executeSave(user) → transferFrom → balanceOf++   [1 tx/eksekusi]
4. Dashboard: saldo naik; Riwayat dari events
5. Withdraw: withdraw(amount) → cUSD kembali ke user                        [1 tx]
```

---

## 8. Strategi metrik Celo POS (sah)
- **Tx banyak**: interval kecil → tiap eksekusi 1 tx; tiap aksi user = tx. Keeper transparan menambah tx (kerja nyata).
- **DAU**: user cek progress tabungan; build-in-public (TG/X) cari 5–10 user asli.
- **Commit/PR**: kerja per-PR kecil (kontrak, test, keeper, tiap layar FE, docs).
- **Booster**: MiniPay hook + kontrak verified + open source.

---

## 9. Milestone (8–22 Jun 2026)
| Hari | Deliverable | PR |
|---|---|---|
| D1 | Foundry scaffold, `AutoSaveVault` + tests, deploy **testnet** | contracts |
| D2 | Keeper bot di testnet (cron jalan) | keeper |
| **D3–4** | **Deploy + verify MAINNET** (begitu test hijau) — biar aktivitas cepat kehitung | deploy-mainnet |
| D5–6 | FE: connect + createPlan + dashboard | web-core |
| D7–8 | MiniPay hook + withdraw + riwayat | minipay |
| D9–10 | Polish mobile, daftar talent.app + campaign | polish |
| D11–13 | Build-in-public, user asli, keeper live mainnet | — |
| D14 | Buffer + demo video + rapikan | — |

---

## 10. Definisi selesai (v1)
- [ ] Kontrak verified di Celoscan (mainnet)
- [ ] `forge test` hijau
- [ ] Keeper jalan & ada tx `Saved` di mainnet
- [ ] FE live (Vercel) jalan di MiniPay & web
- [ ] Repo publik + README + PRD
- [ ] Terdaftar di talent.app + Proof of Ship campaign

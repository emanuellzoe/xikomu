# PRD — Xikomu Frontend

**Status:** v1 (MVP) · **Lokasi:** `frontend/` (dalam monorepo `xikomu`) · **Backend:** `AutoSaveVault` (`contracts/`) + keeper (`keeper/`)

> Sumber kebenaran untuk frontend. Ikuti spec ini saat coding; jangan menambah scope di luar "v1" tanpa update PRD. Nilai bertanda `⚠️ VERIFY` dikonfirmasi sebelum dipakai.

---

## 1. Ringkasan
Mini-app **Xikomu Auto-Save**: UI untuk menabung cUSD otomatis di Celo. User membuat rencana nabung (jumlah + interval) sekali; keeper bot yang mengeksekusi. Frontend = tempat user **set plan, lihat progress tabungan, dan withdraw**.

**2 tampilan, satu codebase:**
- **MiniPay (mobile)** — prioritas. Jalan di dalam dompet MiniPay (Opera), auto-connect.
- **Web (desktop/browser)** — landing + dashboard responsive, connect via wallet biasa.

**Prinsip:** sederhana dulu. Mobile-first. Tiap aksi inti = 1 transaksi on-chain.

---

## 2. Tujuan & non-tujuan
### Tujuan v1
1. Connect wallet (auto di MiniPay, manual di web).
2. **Create Plan**: `approve` cUSD + `createPlan(amount, interval)`.
3. **Dashboard**: tampilkan saldo tabungan, plan aktif, jadwal save berikutnya.
4. **Withdraw**: tarik cUSD kapan saja.
5. **Riwayat**: dari events kontrak (`Saved`/`Withdrawn`), tanpa backend.
6. Deploy ke **Vercel** (live URL untuk submission + testing MiniPay).

### Non-tujuan v1
- Backend / database / indexer (baca langsung dari chain + events)
- LLM / chat (opsional, paling akhir)
- Multi-plan, multi-token, DCA UI (v2)
- Auth/login sosial, notifikasi push (v2)

---

## 3. Tech stack
| Bagian | Pilihan |
|---|---|
| Framework | **Next.js (App Router)** + TypeScript |
| Web3 | **wagmi v2 + viem** |
| Styling | **Tailwind CSS** (mobile-first) |
| State async | TanStack Query (dibawa wagmi) |
| Deploy | **Vercel** |
| Chain | Celo Mainnet (42220) + Alfajores (44787) untuk dev |

> Konsisten dengan keeper (`viem`) dan referensi Celo (Voxel/Trickle pakai Next.js + wagmi + viem).

---

## 4. Integrasi kontrak
- **ABI**: `AutoSaveVault` (impor subset; sumber dari output Foundry repo `xikomu`).
- **Token**: cUSD (`approve` + cek `allowance`/`balanceOf`).
- **Alamat per-chain** (di `lib/contracts.ts`):
  | Chain | Vault | cUSD |
  |---|---|---|
  | Celo Mainnet (42220) | `⚠️ VERIFY (isi setelah deploy)` | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
  | Alfajores (44787) | `⚠️ VERIFY (isi setelah deploy)` | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |

### Fungsi yang dipakai FE
- **Write**: `cusd.approve(vault, amount)`, `vault.createPlan(amount, interval)`, `vault.cancelPlan()`, `vault.withdraw(amount)`.
- **Read**: `vault.balanceOf(user)`, `vault.getPlan(user)`, `vault.previewDue(user)`, `cusd.allowance(user, vault)`, `cusd.balanceOf(user)`.
- **Events** (riwayat): `Saved(user, amount, nextRun, newBalance)`, `Withdrawn(user, amount)` via `getLogs`/`watchContractEvent`.

---

## 5. MiniPay integration (BOOSTER)
- Deteksi: `window.ethereum?.isMiniPay === true`.
- Di MiniPay: **auto-connect** injected connector, sembunyikan tombol "Connect", jangan tampilkan pemilihan wallet.
- MiniPay pakai **cUSD sebagai gas** & transaksi — pastikan flow `approve` + `createPlan` lancar di mobile.
- Test lokal: `ngrok` + MiniPay Developer Mode (Android). ⚠️ VERIFY langkah dari MiniPay Quickstart.
- Layout mobile-first, tombol besar, 1-tap.

---

## 6. Layar (screens)
### 6.1 Dashboard (Home)
- Kartu **Saldo Tabungan** (cUSD) — angka besar.
- Status **plan aktif**: jumlah/interval + "save berikutnya dalam …" (dari `getPlan.nextRun`).
- Tombol: **Tambah/Ubah Rencana**, **Tarik**.
- Kalau belum ada plan → CTA "Mulai Nabung Otomatis".

### 6.2 Create / Edit Plan
- Input **jumlah** (cUSD) + pilih **interval** (preset: Harian / Mingguan + custom detik untuk dev).
- Tampilkan ringkasan: "Nabung X cUSD tiap Y".
- Flow: cek `allowance` → kalau kurang, `approve` → `createPlan`. Tampilkan status tiap tx.
- Info kecil & jujur: "Bot otomatis akan memindahkan danamu sesuai jadwal. Kamu bisa tarik kapan saja."

### 6.3 Withdraw
- Tampilkan saldo, input jumlah (+ tombol "Tarik semua").
- `vault.withdraw(amount)` → update saldo.
- Catatan kepercayaan: "Penarikan selalu tersedia, termasuk saat sistem di-pause."

### 6.4 Riwayat
- List `Saved` & `Withdrawn` (tanggal, jumlah, link tx ke Celoscan).
- Dibaca dari events, tanpa backend.

---

## 7. Struktur folder (rencana)
```
frontend/
├── app/                # Next.js App Router (page, layout)
│   ├── page.tsx        # dashboard
│   ├── plan/           # create/edit plan
│   ├── withdraw/
│   └── history/
├── components/         # UI (cards, buttons, tx-status)
├── lib/
│   ├── wagmi.ts        # config chain + connector (+ MiniPay)
│   ├── contracts.ts    # alamat + ABI
│   └── format.ts       # util format cUSD/waktu
├── public/
├── PRD.md · README.md
```

---

## 8. UX & state penting
- **Loading/disabled** saat tx pending; tampilkan hash + link Celoscan.
- **Error friendly** (allowance kurang, saldo kurang, user reject).
- **Auto-refresh** saldo/plan setelah tx sukses (invalidate query).
- **Empty states** jelas (belum ada plan / belum ada riwayat).
- **Network guard**: kalau wallet di chain salah, minta switch ke Celo.

---

## 9. Strategi metrik (selaras Proof of Ship)
- Tiap aksi user (approve, createPlan, withdraw) = tx → kontribusi tx-count.
- UI sederhana & cepat → user balik tiap hari cek progress (DAU).
- Kerja per-**branch + PR** kecil (per layar) → metrik PR.
- MiniPay hook + live di Vercel = booster.

---

## 10. Milestone FE
| Hari | Deliverable | PR |
|---|---|---|
| 1 | Scaffold Next.js + Tailwind + wagmi config (Celo + Alfajores) | feat: scaffold |
| 2 | Connect wallet + deteksi/auto-connect MiniPay | feat: connect |
| 3 | Dashboard (read saldo + plan) | feat: dashboard |
| 4 | Create Plan (approve + createPlan) | feat: create-plan |
| 5 | Withdraw + Riwayat (events) | feat: withdraw-history |
| 6 | Polish mobile + deploy Vercel | chore: deploy |

---

## 11. Definisi selesai (v1)
- [ ] Live di Vercel, jalan di MiniPay & browser
- [ ] Bisa createPlan, lihat saldo/plan, withdraw, lihat riwayat
- [ ] Auto-connect di MiniPay
- [ ] Alamat kontrak mainnet terisi & benar
- [ ] Repo publik + README + PRD

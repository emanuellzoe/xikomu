# Xikomu — Auto-Save on Celo

> Celengan otomatis di MiniPay. Set sekali, nabung jalan sendiri.

Xikomu adalah **mini-app MiniPay** di Celo Mainnet untuk **menabung stablecoin (cUSD) secara otomatis & berulang**. User membuat rencana nabung sekali (jumlah + interval), lalu sebuah **keeper bot** mengeksekusi pemindahan dana sesuai jadwal — transparan, on-chain, non-kustodial.

Dibangun untuk **Celo Proof of Ship Season 2**.

---

## Kenapa ini

- **Non-kustodial & anti-rug** — kontrak **immutable** (non-upgradeable). Dana disimpan per-user, **withdraw selalu terbuka kapan saja** (bahkan saat paused). Tidak ada fungsi yang bisa menyentuh/menguras dana user.
- **Otomatis** — keeper bot deterministik (cron) mengeksekusi save terjadwal. Bukan AI prediksi harga, murni jadwal.
- **Hemat gas** — tanpa loop on-chain, storage di-pack 1 slot, custom errors, riwayat lewat events.
- **MiniPay-native** — jalan di dalam dompet MiniPay (Opera), plus tampilan web.

---

## Arsitektur singkat

```
User (MiniPay / Web)
   │  createPlan(amount, interval) + approve cUSD
   ▼
AutoSaveVault.sol  (Celo Mainnet, verified)
   ▲  executeSave(user)   ← dipanggil keeper, 1 user = 1 tx (O(1), no loop)
   │
Keeper Bot (Node + viem + cron)  ← iterasi user OFF-chain, poke yang jatuh tempo
```

Detail lengkap (interface kontrak, event, logika keeper, layar FE, alamat, milestone) ada di **[PRD.md](./PRD.md)** — itu sumber kebenaran saat development.

---

## Stack

| Layer | Tech |
|---|---|
| Smart Contract | Solidity 0.8.x + **Foundry** (forge/cast) + OpenZeppelin |
| Keeper Bot | Node.js + viem + node-cron |
| Frontend | Next.js + wagmi v2 + viem + Tailwind (2 tampilan: web & mobile/MiniPay) |
| Chain | Celo Mainnet (42220) · token: cUSD |

---

## Struktur repo (rencana)

```
xikomu/
├── contracts/        # Foundry project (AutoSaveVault.sol, tests, deploy script)
├── keeper/           # Keeper bot (cron executor)
├── web/              # Next.js mini-app (web + MiniPay views)
├── README.md
└── PRD.md            # Product Requirements — baca ini sebelum coding
```

---

## Quickstart (akan diisi saat scaffold)

```bash
# Smart contract
cd contracts && forge build && forge test

# Keeper
cd keeper && npm i && npm run dev

# Frontend
cd web && npm i && npm run dev
```

---

## Status

🚧 In development — target deploy SC + FE ke Celo sebelum 22 Juni 2026.

## Lisensi

MIT (open source — syarat Proof of Ship).

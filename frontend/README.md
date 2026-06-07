# Xikomu — Frontend

> Mini-app MiniPay untuk **Xikomu Auto-Save**: nabung cUSD otomatis di Celo.

UI tempat user membuat rencana nabung, melihat progress tabungan, dan menarik dana. Backend = smart contract `AutoSaveVault` + keeper bot (repo: [`xikomu`](https://github.com/emanuellzoe/xikomu)).

## Fitur (v1)
- Connect wallet — **auto-connect di MiniPay**, manual di web
- **Create Plan** — set jumlah + interval (approve cUSD + `createPlan`)
- **Dashboard** — saldo tabungan, plan aktif, jadwal save berikutnya
- **Withdraw** — tarik cUSD kapan saja (selalu tersedia)
- **Riwayat** — dari events kontrak, tanpa backend

## Stack
Next.js (App Router) · TypeScript · wagmi v2 + viem · Tailwind · Vercel · Celo (Mainnet 42220 + Alfajores 44787)

## Dua tampilan
- **MiniPay (mobile)** — prioritas, jalan di dompet Opera MiniPay
- **Web (desktop)** — landing + dashboard responsive

## Dokumen
Spesifikasi lengkap (layar, integrasi kontrak, MiniPay, milestone) di **[PRD.md](./PRD.md)**.

## Status
🚧 In development — bagian dari Celo Proof of Ship Season 2.

## Lisensi
MIT

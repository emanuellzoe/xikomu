;; XikomuFlip - Lucky Flip, a native-STX coin-flip game on Stacks.
;;
;; Clarity port of contracts/src/XikomuFlip.sol (Celo). Same idea, same rules:
;;   - Buy chips with native STX (1 chip unit = 1 microSTX), no token approval.
;;   - flip(bet, choice-heads): 1 on-chain tx, O(1), win ~1.95x your bet or lose
;;     the bet to the house.
;;   - cash chips back out to STX anytime - ALWAYS allowed, even while paused.
;;
;; It is NOT a savings/DeFi vault: chips are game credits, and the owner can only
;; ever touch `house-liquidity` - never a player's chips. The contract custodies
;; STX equal to (total-chips + house-liquidity); cash-out works while paused.
;;
;; RANDOMNESS: flip derives its result from the previous block's VRF seed mixed
;; with the sender, a monotonic nonce, the bet and the block height. This is fine
;; for a LOW-STAKES game but is NOT secure for high value - a miner can bias it.
;; Bets are capped by MAX-BET accordingly. v2 may move to commit-reveal.

;; ---------------------------------------------------------------------------
;; Constants
;; ---------------------------------------------------------------------------

;; Bets are denominated in microSTX (1 STX = 1_000_000 uSTX).
(define-constant MIN-BET u10000)     ;; 0.01 STX
(define-constant MAX-BET u5000000)   ;; 5 STX
(define-constant PAYOUT-NUM u195)    ;; 1.95x total return on a win
(define-constant PAYOUT-DEN u100)

;; Error codes
(define-constant err-not-owner (err u100))
(define-constant err-zero-amount (err u101))
(define-constant err-bet-out-of-range (err u102))
(define-constant err-insufficient-chips (err u103))
(define-constant err-insufficient-house (err u104))
(define-constant err-paused (err u105))
(define-constant err-no-pending-owner (err u106))
(define-constant err-not-pending-owner (err u107))

;; ---------------------------------------------------------------------------
;; Storage
;; ---------------------------------------------------------------------------

;; Ownable2Step: current owner + a pending owner that must explicitly accept.
(define-data-var contract-owner principal tx-sender)
(define-data-var pending-owner (optional principal) none)

(define-data-var paused bool false)

;; In-game chip balance per player (microSTX). Absent => u0.
(define-map chips principal uint)

;; Sum of all player chips (maintained at write - O(1), no loops).
(define-data-var total-chips uint u0)

;; Pool that pays out winnings; funded by the owner + losing bets.
(define-data-var house-liquidity uint u0)

;; Monotonic counter folded into the randomness so two flips in one block differ.
(define-data-var nonce uint u0)

;; ---------------------------------------------------------------------------
;; Read-only views
;; ---------------------------------------------------------------------------

(define-read-only (get-owner)
  (var-get contract-owner))

(define-read-only (get-pending-owner)
  (var-get pending-owner))

(define-read-only (is-paused)
  (var-get paused))

(define-read-only (get-chips (who principal))
  (default-to u0 (map-get? chips who)))

(define-read-only (get-total-chips)
  (var-get total-chips))

(define-read-only (get-house-liquidity)
  (var-get house-liquidity))

;; Net winnings (added to chips) if a `bet` wins. ~0.95 * bet.
(define-read-only (preview-net-win (bet uint))
  (- (/ (* bet PAYOUT-NUM) PAYOUT-DEN) bet))

;; STX the contract must custody to back all chips + the house pool.
(define-read-only (backing-required)
  (+ (var-get total-chips) (var-get house-liquidity)))

;; Actual STX held by the contract (should always equal backing-required).
(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender)))

;; ---------------------------------------------------------------------------
;; Player: buy chips / cash out
;; ---------------------------------------------------------------------------

;; Buy chips with native STX (1:1). Blocked while paused. No approval.
(define-public (buy-credits (amount uint))
  (begin
    (asserts! (not (var-get paused)) err-paused)
    (asserts! (> amount u0) err-zero-amount)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (let ((new-chips (+ (get-chips tx-sender) amount)))
      (map-set chips tx-sender new-chips)
      (var-set total-chips (+ (var-get total-chips) amount))
      (print {
        topic: "credits-bought",
        player: tx-sender,
        amount: amount,
        new-chips: new-chips
      })
      (ok new-chips))))

;; Cash chips back to STX. ALWAYS available - even while paused.
(define-public (cash-out (amount uint))
  (let ((player tx-sender)
        (bal (get-chips tx-sender)))
    (asserts! (> amount u0) err-zero-amount)
    (asserts! (>= bal amount) err-insufficient-chips)
    ;; effects
    (let ((new-chips (- bal amount)))
      (map-set chips player new-chips)
      (var-set total-chips (- (var-get total-chips) amount))
      ;; interaction
      (try! (as-contract (stx-transfer? amount tx-sender player)))
      (print {
        topic: "cashed-out",
        player: player,
        amount: amount,
        new-chips: new-chips
      })
      (ok new-chips))))

;; ---------------------------------------------------------------------------
;; Internal: randomness
;; ---------------------------------------------------------------------------

;; Returns true for heads. Derives a coin from the previous block's VRF seed,
;; the sender, a fresh nonce, the bet and the block height. Low-stakes only.
(define-private (coin-result (bet uint))
  (let ((n (+ (var-get nonce) u1)))
    (var-set nonce n)
    (let ((seed (default-to 0x0000000000000000000000000000000000000000000000000000000000000000
                  (get-block-info? vrf-seed (if (> block-height u0) (- block-height u1) u0))))
          (tail (unwrap-panic (to-consensus-buff? {
                  sender: tx-sender, n: n, bet: bet, h: block-height }))))
      (let ((digest (keccak256 (concat seed tail))))
        ;; parity of the first 16 bytes of the digest
        (is-eq u0 (mod (buff-to-uint-be
                         (unwrap-panic (as-max-len? (unwrap-panic (slice? digest u0 u16)) u16)))
                       u2))))))

;; ---------------------------------------------------------------------------
;; Game
;; ---------------------------------------------------------------------------

;; Flip a coin. Win -> chips grow by ~0.95*bet (1.95x total); lose -> bet goes to
;; the house. Pure internal accounting: no external calls, O(1).
(define-public (flip (bet uint) (choice-heads bool))
  (begin
    (asserts! (not (var-get paused)) err-paused)
    (asserts! (and (>= bet MIN-BET) (<= bet MAX-BET)) err-bet-out-of-range)
    (let ((bal (get-chips tx-sender))
          (net-win (- (/ (* bet PAYOUT-NUM) PAYOUT-DEN) bet)))
      (asserts! (>= bal bet) err-insufficient-chips)
      (asserts! (>= (var-get house-liquidity) net-win) err-insufficient-house)
      (let ((result-heads (coin-result bet)))
        (let ((player-won (is-eq result-heads choice-heads)))
          (if player-won
            (let ((new-chips (+ bal net-win)))
              (map-set chips tx-sender new-chips)
              (var-set total-chips (+ (var-get total-chips) net-win))
              (var-set house-liquidity (- (var-get house-liquidity) net-win))
              (print {
                topic: "flipped",
                player: tx-sender,
                bet: bet,
                choice-heads: choice-heads,
                result-heads: result-heads,
                won: true,
                payout: net-win,
                new-chips: new-chips
              })
              (ok { won: true, result-heads: result-heads }))
            (let ((new-chips (- bal bet)))
              (map-set chips tx-sender new-chips)
              (var-set total-chips (- (var-get total-chips) bet))
              (var-set house-liquidity (+ (var-get house-liquidity) bet))
              (print {
                topic: "flipped",
                player: tx-sender,
                bet: bet,
                choice-heads: choice-heads,
                result-heads: result-heads,
                won: false,
                payout: u0,
                new-chips: new-chips
              })
              (ok { won: false, result-heads: result-heads }))))))))

;; ---------------------------------------------------------------------------
;; Owner: house liquidity (can NEVER touch player chips)
;; ---------------------------------------------------------------------------

;; Seed the house pool with native STX. Owner only.
(define-public (fund-house (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-owner)
    (asserts! (> amount u0) err-zero-amount)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (var-set house-liquidity (+ (var-get house-liquidity) amount))
    (print {
      topic: "house-funded",
      amount: amount,
      house-liquidity: (var-get house-liquidity)
    })
    (ok (var-get house-liquidity))))

(define-public (withdraw-house (amount uint))
  (let ((owner (var-get contract-owner)))
    (asserts! (is-eq tx-sender owner) err-not-owner)
    (asserts! (> amount u0) err-zero-amount)
    (asserts! (<= amount (var-get house-liquidity)) err-insufficient-house)
    (var-set house-liquidity (- (var-get house-liquidity) amount))
    (try! (as-contract (stx-transfer? amount tx-sender owner)))
    (print {
      topic: "house-withdrawn",
      amount: amount,
      house-liquidity: (var-get house-liquidity)
    })
    (ok (var-get house-liquidity))))

;; ---------------------------------------------------------------------------
;; Owner: pause + 2-step ownership
;; ---------------------------------------------------------------------------

(define-public (pause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-owner)
    (var-set paused true)
    (print { topic: "paused", by: tx-sender })
    (ok true)))

(define-public (unpause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-owner)
    (var-set paused false)
    (print { topic: "unpaused", by: tx-sender })
    (ok true)))

;; Ownable2Step: owner nominates, nominee must accept.
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) err-not-owner)
    (var-set pending-owner (some new-owner))
    (print { topic: "ownership-transfer-started", from: tx-sender, to: new-owner })
    (ok true)))

(define-public (accept-ownership)
  (let ((pending (var-get pending-owner)))
    (asserts! (is-some pending) err-no-pending-owner)
    (asserts! (is-eq (some tx-sender) pending) err-not-pending-owner)
    (var-set contract-owner tx-sender)
    (var-set pending-owner none)
    (print { topic: "ownership-transferred", new-owner: tx-sender })
    (ok true)))

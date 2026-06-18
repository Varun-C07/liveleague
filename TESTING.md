# Manual test guide — today's build ($5 bundle backend)

How to exercise everything wired up so far: Google auth, Stripe subscriptions,
follow-teams, and the match predictor. Everything runs **locally** against your
real Supabase + Stripe **test mode** (no real charges).

## 0. Prerequisites — get the servers running

Two background processes need to be up. If you closed your terminal, restart them:

```bash
cd /Users/ayushch/Development/live-league

# 1) the app
npm run dev            # http://localhost:3000

# 2) (only needed for the subscription test) the Stripe webhook forwarder.
#    In a SECOND terminal:
stripe listen --api-key "$(grep '^STRIPE_SECRET_KEY=' .env.local | cut -d= -f2-)" \
  --forward-to localhost:3000/api/webhooks/stripe
```

`stripe listen` prints a `whsec_…` secret. If it differs from the one in
`.env.local` (`STRIPE_WEBHOOK_SECRET`), paste the new value in and restart `npm run dev`.

> All secrets live in `.env.local` (gitignored). Nothing here touches production.

---

## 1. Google sign-in  (Phase 1)

1. Open **http://localhost:3000**.
2. Top-right header → **Sign in** → pick your Google account.
3. ✅ Expect: header swaps to your **avatar + name + Sign out**.
4. Click your avatar → lands on **/account**. Click **Sign out** → back to "Sign in".

If the avatar is blank: that was the no-referrer bug — already fixed; hard-refresh.

---

## 2. Subscriptions + entitlements  (Phase 2)  — the money path

1. Signed in, go to **http://localhost:3000/account**.
2. You'll see **Personal / Pro** chips (off) and three plans.
3. Click **Subscribe** under **Personal ($5/mo)**.
4. On Stripe Checkout, use the test card:
   - **`4242 4242 4242 4242`**, exp any future date (`12/34`), CVC any 3 digits, ZIP any.
5. Complete → redirected to **/account?checkout=success**.
6. ✅ Expect: within ~1–2s the **Personal** chip flips to **on** (live via realtime;
   the Stripe webhook updated your entitlement). The "Subscribe" button shows **Active**.

To test **Pro** or **Combo**, repeat with those plans. Combo turns on both chips.

> Note: you already have an active **Personal trial** I created via API while testing,
> so Personal may already show **on**. Subscribing again is still safe in test mode.

---

## 3. Follow your teams  (Phase 3)

1. Go to **http://localhost:3000/soccer**.
2. Tap the **★** on a few teams/matches.
3. ✅ Signed in: stars persist to your account (DB), not just this browser.
   - Try following a **5th** team in the same sport → it should refuse (4-per-sport cap).
4. Cross-device check (optional): open an incognito window, sign in with the same
   Google account → your followed teams appear there too.
5. Signed out: stars still work but are device-local (localStorage) — and on your
   next sign-in they merge into your account once.

---

## 4. Match predictor  (Phase 4)

1. Go to **http://localhost:3000/predictions** (must be signed in **and** have the
   Personal plan — otherwise you'll see the "Unlock predictions" upsell, which is the
   intended gate).
2. For an upcoming match, type a scoreline (e.g. `2` – `1`) → **Save**.
3. ✅ Expect: the prediction saves (no error). Re-open the page → your pick is shown.
4. Locking + scoring run on a schedule in production (Supabase pg_cron). Locally I
   verified them directly: a prediction locks at kickoff, and after full-time it's
   auto-scored (3 pts exact / 1 pt right result), updating your points total.
   - **Caveat:** real World Cup *scores* need the paid data feed (Phase 7). On the free
     feed many matches show no score, so live auto-scoring is limited until then.

---

## 5. Friend leagues  (Phase 5)

1. Go to **http://localhost:3000/leagues** (signed in).
2. **Create** (needs Personal): type a name → **Create** → you land on the league page
   with a 6-char invite code (e.g. `K7QF9P`).
3. **Share + join**: from a second account (incognito window + a different Google
   login), open `/leagues` → enter the code under "Join with a code" → **Join**.
4. ✅ Both members appear on the leaderboard (updates live). Owner sees **Delete**;
   members see **Leave**.
5. **Per-league scoring**: only predictions you make *after* joining a league count
   toward that league's standings (verified at the DB level). Your global points can
   differ from your points in a league you joined late.
6. **Free-user funnel**: a member without the Personal plan can view the board and sees
   their own row with a "subscribe to compete" nudge — but can't submit predictions
   until they subscribe.

---

## 6. Deploy (optional)

The app auto-deploys from the dev machine:
```bash
npx vercel deploy --prod --token="$(grep '^VERCEL_TOKEN=' .env.local | cut -d= -f2-)"
```
Production auth isn't live yet (needs Vercel env vars + Google prod redirect +
turning off Vercel's deployment-protection 401) — that's a deliberate go-live step.

---

## Troubleshooting

- **Sign-in does nothing / redirect error** → Google OAuth client needs
  `https://mzsehihswaexqiuzajac.supabase.co/auth/v1/callback` as an authorized
  redirect URI, and your email added under the OAuth consent screen's Test users.
- **Subscribe button errors** → check the `stripe listen` terminal is running and
  `STRIPE_WEBHOOK_SECRET` in `.env.local` matches its `whsec_`.
- **Entitlement didn't flip after paying** → look at the `stripe listen` terminal for a
  `200 POST /api/webhooks/stripe` on `customer.subscription.created`.
- **Predictions page is empty** → it lists *upcoming* soccer matches; if the feed has
  none scheduled, there's nothing to predict right now.

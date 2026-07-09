# Meter Note Deployment Notes

App Name: Meter Note
Tagline: Score it fast
Description: Save a 1-10 score with a short note, wallet, and timestamp on Base for demos, reviews, and quick feedback.

## After Base Gives `base:app_id`

Copy the meta tag to Codex. The app id must be written to:

- `src/app/layout.tsx`
- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BASE_APP_ID`

Then deploy once with the project token in `Vercel.txt`, deploy the contract, and write the contract address to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_METER_NOTE_CONTRACT_ADDRESS`

## After Base Gives Builder Code

Write the Builder Code to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BUILDER_CODE`

Then run production deploy again.

## Required Vercel Production Env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0b28f9e317310c39c9c1fa
NEXT_PUBLIC_BUILDER_CODE=replace_with_builder_code
NEXT_PUBLIC_METER_NOTE_CONTRACT_ADDRESS=replace_with_meter_note_contract_address
```

## Contract

```bash
npm run deploy:contract
```

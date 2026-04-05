# Loop

Interactive choose-your-own-adventure stories with video.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Native**: Capacitor (iOS)
- **Auth**: Firebase (Apple, Google, Magic Link)
- **Backend**: Cloudflare Workers + D1 + R2
- **Admin**: Separate React dashboard

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
# Web
npm run build

# iOS
npx cap sync ios
# Then archive in Xcode

# API
cd api && npx wrangler deploy

# Admin
cd admin && npm run build && npx wrangler pages deploy dist --project-name=narrative-admin
```

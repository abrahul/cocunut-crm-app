This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Maintenance Scripts

These scripts live in `scripts/db` and are intended for one-off data cleanup.

Prerequisites:
- Ensure `MONGODB_URI` is set in `.env.local` for local runs, or in the environment where you execute the script for production.

Scripts:
1. Find duplicate mobile numbers:
```bash
npm run db:duplicates
```

2. Merge duplicate customers (keeps newest, reassigns tasks, deletes older records):
```bash
npm run db:merge-duplicates
```

3. Normalize customer mobile numbers (removes spaces/symbols):
```bash
npm run db:normalize-mobiles
```

Recommended order:
1. Run find duplicates.
2. Merge duplicates.
3. Normalize mobiles.
4. Create the unique index on `customers.mobile` in MongoDB.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

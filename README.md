# Szent László Gimnázium - Adományozás

A donation website for Szent László Gimnázium (Saint Ladislaus High School) to display information about contributing to school projects.

## Features

- Modern, minimalist design with the school's color palette
- Responsive layout for mobile and desktop
- Information about two foundations that support the school
- Vercel-ready deployment configuration

## Color Palette

- Background: `#FAFAFA` (white)
- Primary foreground: `#333C3E` (dark gray)
- Hover/accent: `#A86E43` (brown)

## Fonts

- Body text: Noto Sans
- Headers: Playfair Display (elegant serif)

## Development

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Logo

Replace the placeholder logo at `public/logo.svg` with the actual Szent László Gimnázium logo.

## Deployment on Vercel

1. Push this repository to GitHub
2. Import the project to Vercel
3. Add your custom domain `adomany.szlg.info` in the Vercel dashboard:
   - Go to Project Settings → Domains
   - Add `adomany.szlg.info`
   - Configure DNS records as instructed by Vercel

## Domain Configuration

The site is configured to run under the `adomany.szlg.info` domain. To set this up in Vercel:

1. Add the domain in Vercel dashboard
2. Update your DNS records with your domain registrar:
   - Add a CNAME record pointing `adomany.szlg.info` to `cname.vercel-dns.com`
   - Or follow Vercel's specific DNS instructions

## Project Structure

- `app/page.tsx` - Main donation information page
- `app/layout.tsx` - Root layout with font configuration
- `app/globals.css` - Global styles and color definitions
- `public/logo.svg` - School logo (placeholder)
- `vercel.json` - Vercel deployment configuration

## Future Features

This site is designed to be expanded with functionality to collect promises for contributions towards school projects.


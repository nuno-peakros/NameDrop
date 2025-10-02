# NameDrop

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and integrated with [GitHub Speckit](https://github.com/github/spec-kit) for spec-driven development.

## Spec-Driven Development

This project uses GitHub Speckit for specification-driven development. The development process follows these phases:

1. **Constitution** - Project principles and standards (`.specify/memory/constitution.md`)
2. **Specification** - Feature requirements and user scenarios
3. **Planning** - Technical implementation strategy
4. **Tasks** - Actionable development tasks
5. **Implementation** - Code execution with AI assistance

### Available Commands

Use these slash commands in your AI assistant (Cursor):

- `/constitution` - Establish or update project principles
- `/specify` - Create feature specifications
- `/plan` - Generate technical implementation plans
- `/tasks` - Break down plans into actionable tasks
- `/implement` - Execute implementation with AI assistance
- `/clarify` - Ask structured questions to de-risk ambiguous areas
- `/analyze` - Cross-artifact consistency and alignment report

### Project Structure

- `.specify/` - Speckit configuration and templates
- `.cursor/` - Cursor-specific command definitions
- `specs/` - Feature specifications (created as needed)

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

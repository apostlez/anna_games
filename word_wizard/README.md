# Word Wizard

Word Wizard is a Phaser 4 browser game for learning English words through three short lessons: speaking, writing, and choosing the correct word while flying.

## Run locally

```bash
npm install
npm run dev
```

The app uses the Supabase publishable key from `.env` when provided. The checked-in fallback is the public publishable key from the PRD; no `service_role` key is used. If the `words` table is unavailable, the extracted local JSON data keeps the lessons playable.

## Checks

```bash
npm run validate:words
npm test
npm run build
```

## Generate image assets

The recommended OpenAI Image Generation workflow is prepared for the gargoyle and broom assets. The API key is read only from the environment and is never committed.

```powershell
$env:OPENAI_API_KEY = 'your-key'
npm run generate:assets
```

Generated PNG files are written to `assets/generated/`. Review their license and visual quality before replacing the checked-in SVG assets.

The source audio files are not stored in this repository. Review the publisher's terms and derived-word accuracy before importing data into a public Supabase project.

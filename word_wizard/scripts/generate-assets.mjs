import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required. Set it in the environment and run npm run generate:assets.');
}

const assets = [
  {
    name: 'gargoyle-generated.png',
    prompt: `Create an original dark fantasy gargoyle image for the Word Wizard English learning game.
The gargoyle should look imposing and stylish rather than cute: angular weathered stone armor, large swept horns, sharp bat-like wings, glowing ember-red eyes, strong silhouette, dramatic three-quarter flying pose, deep charcoal and moss green stone with warm orange highlights.
Single isolated game asset, centered, transparent background, polished 2D illustration, no text, no logo, no recognizable franchise or existing character.`,
  },
  {
    name: 'broom-generated.png',
    prompt: `Create an original magical flying broom image for the Word Wizard English learning game.
Show a dramatic carved dark-wood handle, antique brass bands, dense swept bristles, subtle green and gold magical sparks, elegant three-quarter diagonal pose suggesting forward flight.
Single isolated game asset, centered, transparent background, polished 2D illustration, no text, no logo, no recognizable franchise or existing character.`,
  },
];

const outputDirectory = join(process.cwd(), 'assets', 'generated');
await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: asset.prompt,
      size: '1024x1024',
      quality: 'high',
      background: 'transparent',
      output_format: 'png',
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed for ${asset.name}: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const base64 = payload.data?.[0]?.b64_json;
  if (!base64) throw new Error(`No image data returned for ${asset.name}`);
  await writeFile(join(outputDirectory, asset.name), Buffer.from(base64, 'base64'));
  console.log(`Generated assets/generated/${asset.name}`);
}

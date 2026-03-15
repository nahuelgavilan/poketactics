import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const generatedPokemonPath = path.join(projectRoot, 'shared/src/generatedPokemon.ts');
const publicSpritesRoot = path.join(projectRoot, 'public/sprites');

const EXTRA_POKEMON_IDS = [1, 3, 4, 6, 7, 9, 25, 94, 448];
const ITEM_IDS = [
  'amulet-coin',
  'poke-ball',
  'full-restore',
  'max-elixir',
  'ultra-ball',
  'rare-candy',
  'max-potion',
  'elixir',
  'full-heal',
];

const pokemonSpriteJobs = [
  {
    variant: 'static',
    directory: 'pokemon/static',
    extension: 'png',
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
  },
  {
    variant: 'icon',
    directory: 'pokemon/icons',
    extension: 'png',
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`,
  },
  {
    variant: 'animated-front',
    directory: 'pokemon/animated/front',
    extension: 'gif',
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
  },
  {
    variant: 'animated-back',
    directory: 'pokemon/animated/back',
    extension: 'gif',
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/${id}.gif`,
  },
];

function parsePokemonIds(source) {
  const ids = [...source.matchAll(/id:\s*(\d+)/g)].map((match) => Number(match[1]));
  return [...new Set([...ids, ...EXTRA_POKEMON_IDS])]
    .filter((id) => Number.isInteger(id) && id > 0)
    .sort((a, b) => a - b);
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadToFile(url, destinationPath, force) {
  if (!force && await fileExists(destinationPath)) {
    return 'skipped';
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, bytes);
  return 'downloaded';
}

async function run() {
  const force = process.argv.includes('--force');
  const generatedPokemonSource = await readFile(generatedPokemonPath, 'utf8');
  const pokemonIds = parsePokemonIds(generatedPokemonSource);

  const jobs = [
    ...pokemonIds.flatMap((pokemonId) =>
      pokemonSpriteJobs.map((job) => ({
        label: `${job.variant}:${pokemonId}`,
        destination: path.join(publicSpritesRoot, job.directory, `${pokemonId}.${job.extension}`),
        url: job.url(pokemonId),
      }))
    ),
    ...ITEM_IDS.map((itemId) => ({
      label: `item:${itemId}`,
      destination: path.join(publicSpritesRoot, 'items', `${itemId}.png`),
      url: `https://play.pokemonshowdown.com/sprites/itemicons/${itemId}.png`,
    })),
  ];

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const result = await downloadToFile(job.url, job.destination, force);
      if (result === 'downloaded') {
        downloaded += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      console.warn(`[sprites] ${job.label} skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(
    `Sprite sync complete: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed, ${jobs.length} total assets.`
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

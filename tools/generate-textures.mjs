import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { deflateSync, inflateSync } from "node:zlib";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, "..", "assets", "textures");
const size = 512;
const channels = 3;
const tau = Math.PI * 2;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function smootherStep(value) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function fract(value) {
  return value - Math.floor(value);
}

function wrap(value, period) {
  return ((value % period) + period) % period;
}

function hash2(x, y, seed) {
  let value =
    Math.imul(x | 0, 0x1f123bb5) ^
    Math.imul(y | 0, 0x5f356495) ^
    Math.imul(seed | 0, 0x2c9277b5);
  value ^= value >>> 15;
  value = Math.imul(value, 0x45d9f3b);
  value ^= value >>> 13;
  value = Math.imul(value, 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

// Value noise on a wrapped grid: u=0/1 and v=0/1 are mathematically identical.
function periodicNoise(u, v, cells, seed) {
  const gridX = u * cells;
  const gridY = v * cells;
  const baseX = Math.floor(gridX);
  const baseY = Math.floor(gridY);
  const localX = smootherStep(gridX - baseX);
  const localY = smootherStep(gridY - baseY);
  const x0 = wrap(baseX, cells);
  const y0 = wrap(baseY, cells);
  const x1 = wrap(baseX + 1, cells);
  const y1 = wrap(baseY + 1, cells);

  const upper = mix(hash2(x0, y0, seed), hash2(x1, y0, seed), localX);
  const lower = mix(hash2(x0, y1, seed), hash2(x1, y1, seed), localX);
  return mix(upper, lower, localY);
}

function fractalNoise(u, v, baseCells, octaves, seed) {
  let value = 0;
  let weight = 0;
  let amplitude = 1;
  for (let octave = 0; octave < octaves; octave += 1) {
    const cells = baseCells * 2 ** octave;
    value += periodicNoise(u, v, cells, seed + octave * 1013) * amplitude;
    weight += amplitude;
    amplitude *= 0.52;
  }
  return value / weight;
}

function periodicDistance(value, target) {
  const direct = Math.abs(value - target);
  return Math.min(direct, 1 - direct);
}

function toroidalCellDistances(u, v, cellsX, cellsY, seed) {
  const gridX = Math.floor(u * cellsX);
  const gridY = Math.floor(v * cellsY);
  let nearest = Number.POSITIVE_INFINITY;
  let second = Number.POSITIVE_INFINITY;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const cellX = wrap(gridX + offsetX, cellsX);
      const cellY = wrap(gridY + offsetY, cellsY);
      const siteU = (cellX + 0.16 + hash2(cellX, cellY, seed) * 0.68) / cellsX;
      const siteV =
        (cellY + 0.16 + hash2(cellX, cellY, seed + 47) * 0.68) / cellsY;
      const deltaU = periodicDistance(u, siteU) * cellsX;
      const deltaV = periodicDistance(v, siteV) * cellsY;
      const distance = Math.hypot(deltaU, deltaV);

      if (distance < nearest) {
        second = nearest;
        nearest = distance;
      } else if (distance < second) {
        second = distance;
      }
    }
  }

  return { nearest, second };
}

function createRawTexture(shader) {
  const buffer = Buffer.alloc(size * size * channels);
  let index = 0;

  // Inclusive endpoints deliberately make opposing edges byte-identical.
  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const colour = shader(u, v);
      buffer[index] = Math.round(clamp(colour[0], 0, 255));
      buffer[index + 1] = Math.round(clamp(colour[1], 0, 255));
      buffer[index + 2] = Math.round(clamp(colour[2], 0, 255));
      index += channels;
    }
  }

  return buffer;
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = new Uint32Array(256);

for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  if (typeBuffer.length !== 4) throw new Error(`Type de chunk PNG invalide: ${type}`);

  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
  return chunk;
}

function encodePngRgb(rgbBuffer, width, height) {
  const stride = width * channels;
  if (rgbBuffer.length !== stride * height) {
    throw new Error("Taille du buffer RGB incompatible avec les dimensions PNG");
  }

  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (stride + 1);
    scanlines[scanlineOffset] = 0;
    rgbBuffer.copy(scanlines, scanlineOffset + 1, y * stride, (y + 1) * stride);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    pngSignature,
    createPngChunk("IHDR", header),
    createPngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    createPngChunk("IEND"),
  ]);
}

function inspectPng(pngBuffer) {
  if (
    pngBuffer.length < pngSignature.length ||
    !pngBuffer.subarray(0, pngSignature.length).equals(pngSignature)
  ) {
    throw new Error("Signature PNG invalide");
  }

  let offset = pngSignature.length;
  let metadata = null;
  const compressedParts = [];
  let reachedEnd = false;

  while (offset < pngBuffer.length) {
    if (offset + 12 > pngBuffer.length) throw new Error("Chunk PNG tronqué");
    const length = pngBuffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > pngBuffer.length) throw new Error("Données PNG tronquées");

    const typeBuffer = pngBuffer.subarray(typeStart, dataStart);
    const type = typeBuffer.toString("ascii");
    const data = pngBuffer.subarray(dataStart, dataEnd);
    const expectedCrc = pngBuffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(Buffer.concat([typeBuffer, data]));
    if (expectedCrc !== actualCrc) throw new Error(`CRC invalide pour ${type}`);

    if (type === "IHDR") {
      if (length !== 13) throw new Error("IHDR PNG invalide");
      metadata = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === "IDAT") {
      compressedParts.push(data);
    } else if (type === "IEND") {
      reachedEnd = true;
    }

    offset = chunkEnd;
  }

  if (!metadata || !reachedEnd || compressedParts.length === 0) {
    throw new Error("Structure PNG incomplète");
  }
  if (metadata.bitDepth !== 8 || metadata.colorType !== 2) {
    throw new Error("Le PNG généré n’est pas un RGB 8 bits");
  }

  const stride = metadata.width * channels;
  const decoded = inflateSync(Buffer.concat(compressedParts));
  if (decoded.length !== (stride + 1) * metadata.height) {
    throw new Error("Flux RGB PNG de taille inattendue");
  }
  for (let y = 0; y < metadata.height; y += 1) {
    if (decoded[y * (stride + 1)] !== 0) {
      throw new Error(`Filtre PNG inattendu à la ligne ${y}`);
    }
  }

  return metadata;
}

function hiveResin(u, v) {
  const macro = fractalNoise(u, v, 3, 6, 9101);
  const detail = fractalNoise(u, v, 15, 4, 9119);
  const warpU = u + (macro - 0.5) * 0.065;
  const warpV = v + (detail - 0.5) * 0.025;
  const tubeA =
    1 -
    Math.abs(
      Math.sin(tau * (3 * warpU + 2 * warpV + Math.sin(tau * 2 * v) * 0.18)),
    );
  const tubeB =
    1 -
    Math.abs(
      Math.sin(tau * (5 * warpV - 2 * warpU + Math.sin(tau * 3 * u) * 0.12)),
    );
  const resinRidge = Math.pow(clamp(Math.max(tubeA, tubeB)), 6);
  const wetGlint = Math.pow(clamp(detail * 0.72 + resinRidge * 0.52), 3.2);
  const cavity = Math.pow(1 - macro, 2.1);

  return [
    5 + macro * 12 + resinRidge * 11 + wetGlint * 23,
    13 + macro * 21 + resinRidge * 25 + wetGlint * 32 - cavity * 4,
    16 + macro * 24 + resinRidge * 32 + wetGlint * 43,
  ];
}

function carapace(u, v) {
  const macro = fractalNoise(u, v, 4, 5, 22003);
  const micro = fractalNoise(u, v, 24, 3, 22037);
  const verticalSeam = Math.pow(1 - Math.abs(Math.sin(Math.PI * 8 * u)), 14);
  const horizontalSeam = Math.pow(1 - Math.abs(Math.sin(Math.PI * 6 * v)), 16);
  const seam = clamp(Math.max(verticalSeam, horizontalSeam));
  const archedRib =
    0.5 +
    0.5 *
      Math.cos(
        tau * (8 * u + Math.sin(tau * 3 * v) * 0.24 + (macro - 0.5) * 0.14),
      );
  const ribHighlight = Math.pow(archedRib, 7);
  const pitting = Math.pow(1 - micro, 5);
  const plate = clamp(0.34 + macro * 0.72 + ribHighlight * 0.58 - seam * 0.83);
  const iridescence = 0.5 + 0.5 * Math.sin(tau * (2 * u - 3 * v + macro * 0.3));

  return [
    7 + plate * 25 + iridescence * 6 - pitting * 5,
    13 + plate * 35 + ribHighlight * 20 + iridescence * 8 - pitting * 6,
    18 + plate * 45 + ribHighlight * 31 + iridescence * 15 - pitting * 4,
  ];
}

function industrialPanels(u, v) {
  const panelsX = 4;
  const panelsY = 4;
  const localU = fract(u * panelsX);
  const localV = fract(v * panelsY);
  const edgeDistance = Math.min(localU, 1 - localU, localV, 1 - localV);
  const recessedSeam = Math.exp(-edgeDistance * 76);
  const bevel = Math.exp(-Math.abs(edgeDistance - 0.034) * 90);
  const broadNoise = fractalNoise(u, v, 5, 5, 33013);
  const brushed =
    0.5 +
    0.5 *
      Math.sin(tau * (96 * u + Math.sin(tau * 3 * v) * 0.28)) *
      (0.38 + fractalNoise(u, v, 32, 2, 33029) * 0.62);

  let rivet = 0;
  for (const cornerU of [0.09, 0.91]) {
    for (const cornerV of [0.09, 0.91]) {
      const distance = Math.hypot(localU - cornerU, localV - cornerV);
      rivet = Math.max(rivet, Math.exp(-distance * distance * 2100));
    }
  }

  const scratchA = Math.pow(
    clamp(1 - Math.abs(Math.sin(tau * (37 * u + 5 * v + broadNoise * 0.15)))),
    35,
  );
  const scratchB = Math.pow(
    clamp(1 - Math.abs(Math.sin(tau * (53 * v - 3 * u)))),
    48,
  );
  const scratches = clamp(scratchA * 0.65 + scratchB * 0.35);
  const metal =
    71 +
    broadNoise * 65 +
    brushed * 15 +
    bevel * 25 +
    rivet * 56 -
    recessedSeam * 62 -
    scratches * 28;

  return [metal * 0.84, metal * 0.91, metal + rivet * 8];
}

function organicBump(u, v) {
  const cells = toroidalCellDistances(u, v, 7, 7, 44017);
  const membrane = fractalNoise(u, v, 5, 6, 44041);
  const fine = fractalNoise(u, v, 28, 3, 44053);
  const cellBoundary = Math.exp(-Math.pow((cells.second - cells.nearest) * 7.5, 2));
  const cellCore = Math.exp(-cells.nearest * cells.nearest * 9);
  const sinew =
    Math.pow(
      1 -
        Math.abs(
          Math.sin(tau * (4 * u + 3 * v + (membrane - 0.5) * 0.34)),
        ),
      8,
    ) *
    (0.35 + cellCore * 0.65);
  const pores = Math.pow(1 - fine, 7);
  const height = clamp(
    0.2 +
      membrane * 0.46 +
      cellCore * 0.22 +
      sinew * 0.26 -
      cellBoundary * 0.3 -
      pores * 0.19,
  );
  const encodedHeight = 18 + height * 224;

  return [encodedHeight, encodedHeight, encodedHeight];
}

function assertTileableEdges(buffer, name) {
  for (let y = 0; y < size; y += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const left = (y * size) * channels + channel;
      const right = (y * size + size - 1) * channels + channel;
      if (buffer[left] !== buffer[right]) {
        throw new Error(`${name}: couture horizontale non périodique à y=${y}`);
      }
    }
  }

  for (let x = 0; x < size; x += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const top = x * channels + channel;
      const bottom = ((size - 1) * size + x) * channels + channel;
      if (buffer[top] !== buffer[bottom]) {
        throw new Error(`${name}: couture verticale non périodique à x=${x}`);
      }
    }
  }
}

const textures = [
  ["hive-resin.png", hiveResin],
  ["carapace.png", carapace],
  ["industrial-panels.png", industrialPanels],
  ["organic-bump.png", organicBump],
];

await fs.mkdir(outputDirectory, { recursive: true });

for (const [fileName, shader] of textures) {
  const buffer = createRawTexture(shader);
  assertTileableEdges(buffer, fileName);
  const outputPath = path.join(outputDirectory, fileName);
  await fs.writeFile(outputPath, encodePngRgb(buffer, size, size));

  const writtenPng = await fs.readFile(outputPath);
  const metadata = inspectPng(writtenPng);
  if (metadata.width !== size || metadata.height !== size) {
    throw new Error(`${fileName}: dimensions inattendues`);
  }
  console.log(
    `${fileName}: ${metadata.width}x${metadata.height}, PNG RGB 8 bits tileable, ${writtenPng.length} octets`,
  );
}

console.log("Encodeur utilisé: Node.js natif (zlib + CRC32), aucune dépendance externe");

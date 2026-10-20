import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { deflateSync, inflateSync } from "node:zlib";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, "..", "assets", "textures");
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

// Material fields share one authored height surface: albedo, microsurface
// roughness, occlusion and tangent-space normals describe the same features.
// Colour contains pigment only; specular highlights are produced by lighting.
function smoothRange(minimum, maximum, value) {
  return smootherStep(clamp((value - minimum) / (maximum - minimum)));
}

// Jittered follicles are defined in material space, with a bounded depression
// radius. They read as pores in close-ups instead of high-contrast white noise.
function poreField(u, v, cells, seed) {
  const gridX = Math.floor(u * cells);
  const gridY = Math.floor(v * cells);
  const localX = fract(u * cells);
  const localY = fract(v * cells);
  let pore = 0;
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const cx = wrap(gridX + ox, cells);
      const cy = wrap(gridY + oy, cells);
      const dx = localX - (ox + 0.18 + hash2(cx, cy, seed) * 0.64);
      const dy = localY - (oy + 0.18 + hash2(cx, cy, seed + 13) * 0.64);
      const radius = 0.075 + hash2(cx, cy, seed + 31) * 0.055;
      pore = Math.max(pore, Math.exp(-(dx * dx + dy * dy) / (radius * radius)));
    }
  }
  return pore;
}

function carapaceMaterial(u, v) {
  const macro = fractalNoise(u, v, 3, 3, 22003);
  const pigmentLayers = periodicNoise(u, v, 13, 22051);
  const grain = periodicNoise(u, v, 92, 22037);
  const pores = poreField(u, v, 58, 22071);
  const shellPhase = tau * (3 * u + Math.sin(tau * 2 * v) * 0.14);
  const shellRib = Math.pow(0.5 + 0.5 * Math.cos(shellPhase), 4);
  const suturePhase = Math.sin(tau * (2 * u - v + Math.sin(tau * 2 * v) * 0.08));
  const suture = Math.exp(-suturePhase * suturePhase * 220);
  const wornRim = Math.exp(-Math.pow(Math.abs(suturePhase) - 0.115, 2) * 850)
    * smoothRange(0.35, 0.68, pigmentLayers);
  const growthPhase = tau * (25 * u + 3 * v + Math.sin(tau * 3 * v) * 0.16);
  const lamella = Math.pow(0.5 + 0.5 * Math.sin(growthPhase), 5);
  const scratchPhase = Math.abs(Math.sin(tau * (23 * u + 7 * v + Math.sin(tau * 2 * v) * 0.09)));
  const scratch = (1 - smoothRange(0.018, 0.05, scratchPhase))
    * smoothRange(0.67, 0.86, pigmentLayers) * (0.4 + shellRib * 0.6);
  const pigment = (macro - 0.5) * 29 + (pigmentLayers - 0.5) * 11
    + lamella * 3 + wornRim * 15 - suture * 13 - pores * 4 + scratch * 6;
  const umber = (pigmentLayers - 0.5) * 5;
  return {
    color: [96 + pigment + umber, 89 + pigment, 78 + pigment - umber],
    height: 0.28 + shellRib * 0.0025 + lamella * 0.0016
      + grain * 0.0004 - suture * 0.0012 - pores * 0.0007 - scratch * 0.0004,
    roughness: clamp(0.46 + (pigmentLayers - 0.5) * 0.09 - shellRib * 0.015
      - suture * 0.12 + wornRim * 0.08 + pores * 0.03 + scratch * 0.04),
    ao: clamp(0.985 - suture * 0.15 - pores * 0.025),
  };
}

function resinMaterial(u, v) {
  const macro = fractalNoise(u, v, 3, 3, 9101);
  const warp = periodicNoise(u, v, 7, 9119) - 0.5;
  const pathA = Math.sin(tau * (3 * u + 2 * v + Math.sin(tau * 2 * v) * 0.16 + warp * 0.07));
  const pathB = Math.sin(tau * (5 * v - 2 * u + Math.sin(tau * 3 * u) * 0.12));
  const primary = Math.exp(-pathA * pathA * 22);
  const secondary = Math.exp(-pathB * pathB * 48);
  const tube = Math.max(primary, secondary * 0.58);
  const striae = Math.sin(tau * (58 * v + 7 * u + macro * 0.05));
  const pigment = (macro - 0.5) * 18 + tube * 8;
  return {
    color: [73 + pigment, 86 + pigment, 94 + pigment],
    height: 0.27 + tube * 0.27 + macro * 0.028 + striae * tube * 0.0015,
    roughness: clamp(0.42 - tube * 0.20 + (macro - 0.5) * 0.06),
    ao: clamp(0.74 + tube * 0.25),
  };
}

function industrialMaterial(u, v) {
  const localU = fract(u * 2);
  const localV = fract(v * 2);
  const panelX = Math.floor(u * 2) % 2;
  const panelY = Math.floor(v * 2) % 2;
  const edge = Math.min(localU, 1 - localU, localV, 1 - localV);
  const plate = smoothRange(0.006, 0.028, edge);
  const broad = periodicNoise(u, v, 7, 33013);
  const brushed = Math.sin(tau * (214 * u + Math.sin(tau * 2 * v) * 0.12));
  let screw = 0;
  let screwSlot = 0;
  let socket = 0;
  for (const x of [0.075, 0.925]) {
    for (const y of [0.075, 0.925]) {
      const dx = localU - x;
      const dy = localV - y;
      const radius = Math.hypot(dx, dy);
      screw = Math.max(screw, 1 - smoothRange(0.010, 0.016, radius));
      socket = Math.max(socket, 1 - smoothRange(0.016, 0.022, radius));
      const slit = 1 - smoothRange(0.001, 0.003, Math.abs(dx));
      screwSlot = Math.max(screwSlot, slit * (1 - smoothRange(0.009, 0.012, Math.abs(dy))));
    }
  }
  const inset = (1 - smoothRange(0.005, 0.011, Math.abs(localU - 0.5)))
    * smoothRange(0.16, 0.20, localV) * (1 - smoothRange(0.80, 0.84, localV));
  const scuff = Math.pow(periodicNoise(u, v, 38, 33029), 5);
  const panelTint = hash2(panelX, panelY, 731) * 8 - 4;
  const pigment = panelTint * plate + (broad - 0.5) * 8 + brushed * 0.8
    - (1 - plate) * 43 - socket * 14 + screw * 19 - screwSlot * 32 - inset * 15;
  return {
    color: [121 + pigment, 132 + pigment, 140 + pigment],
    height: 0.34 + plate * 0.075 - socket * 0.018 + screw * 0.032 - screwSlot * 0.012 - inset * 0.010 + brushed * 0.00018,
    roughness: clamp(0.53 + (1 - plate) * 0.18 + scuff * 0.06 - screw * 0.16),
    ao: clamp(0.67 + plate * 0.33 - socket * 0.09 - inset * 0.04),
    metalness: clamp(0.64 + screw * 0.28 - (1 - plate) * 0.38 - scuff * 0.10),
  };
}

function fabricMaterial(u, v) {
  // A 2-over/2-under diagonal twill. Six small plies within each yarn carry
  // controlled fibre normals while the yarn crossings remain the main shape.
  const column = Math.floor(u * 64);
  const row = Math.floor(v * 64);
  const localU = fract(u * 64);
  const localV = fract(v * 64);
  const warp = Math.pow(Math.sin(Math.PI * localU), 0.72);
  const weft = Math.pow(Math.sin(Math.PI * localV), 0.72);
  const warpOnTop = wrap(column - row, 4) < 2;
  const top = warpOnTop ? warp : weft;
  const under = warpOnTop ? weft : warp;
  const plies = (warpOnTop ? Math.sin(tau * 384 * u) : Math.sin(tau * 384 * v));
  const dye = periodicNoise(u, v, 5, 50021) - 0.5;
  const crossing = smoothRange(0, 0.15, Math.min(localU, 1 - localU, localV, 1 - localV));
  const thread = mix((warp + weft) * 0.5, top * 0.84 + under * 0.16, crossing);
  const pigment = dye * 9 + thread * 14 + plies * 0.9;
  return {
    color: [141 + pigment, 148 + pigment, 145 + pigment],
    height: 0.45 + thread * 0.012 + plies * top * 0.00014,
    roughness: 0.81 + (1 - thread) * 0.12,
    ao: 0.90 + thread * 0.10,
  };
}

function skinMaterial(u, v) {
  const tissue = fractalNoise(u, v, 3, 3, 44041);
  const perfusion = periodicNoise(u, v, 11, 44067) - 0.5;
  const fine = periodicNoise(u, v, 85, 44053);
  const pores = poreField(u, v, 74, 44083);
  const crease = Math.pow(0.5 + 0.5 * Math.sin(tau * (7 * u + 4 * v + tissue * 0.08)), 34)
    * smoothRange(0.57, 0.80, fine);
  const pigment = (tissue - 0.5) * 17;
  // Low-chroma perfusion changes red and green unequally, producing natural
  // skin mottling without orange paint or baked lighting/specular highlights.
  return {
    color: [179 + pigment + perfusion * 9 - pores * 2,
      150 + pigment * 0.78 + perfusion * 2.6 - pores * 2,
      139 + pigment * 0.68 + perfusion * 1.5 - pores * 1.8],
    height: 0.46 + tissue * 0.005 + fine * 0.0005 - pores * 0.00045 - crease * 0.0006,
    roughness: clamp(0.61 + perfusion * 0.06 - tissue * 0.035 - pores * 0.025),
    ao: 0.995 - pores * 0.035 - crease * 0.012,
  };
}

function encodeColor(value) {
  return Math.round(clamp(value, 0, 255));
}

function copyPeriodicEdges(buffer, size) {
  // The endpoint duplicates the start; copying avoids floating-point rounding
  // differences and leaves an exact matching border for every derived map.
  for (let y = 0; y < size - 1; y += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      buffer[(y * size + size - 1) * channels + channel] = buffer[y * size * channels + channel];
    }
  }
  buffer.copy(buffer, (size - 1) * size * channels, 0, size * channels);
}

function buildMaterial(shader, normalStrength, size) {
  const height = new Float32Array(size * size);
  const maps = {
    color: Buffer.alloc(size * size * channels),
    normal: Buffer.alloc(size * size * channels),
    roughness: Buffer.alloc(size * size * channels),
    ao: Buffer.alloc(size * size * channels),
  };
  let hasMetalness = false;
  const metalness = Buffer.alloc(size * size * channels);
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const sample = shader(x / (size - 1), y / (size - 1));
      const index = y * size + x;
      height[index] = sample.height;
      for (let channel = 0; channel < channels; channel += 1) {
        maps.color[index * channels + channel] = encodeColor(sample.color[channel]);
        maps.roughness[index * channels + channel] = encodeColor(sample.roughness * 255);
        maps.ao[index * channels + channel] = encodeColor(sample.ao * 255);
        if (sample.metalness !== undefined) metalness[index * channels + channel] = encodeColor(sample.metalness * 255);
      }
      hasMetalness ||= sample.metalness !== undefined;
    }
  }
  const period = size - 1;
  for (let y = 0; y < period; y += 1) {
    for (let x = 0; x < period; x += 1) {
      const dx = (height[y * size + (x + 1) % period] - height[y * size + wrap(x - 1, period)]) * period * 0.5 * normalStrength;
      const dy = (height[((y + 1) % period) * size + x] - height[wrap(y - 1, period) * size + x]) * period * 0.5 * normalStrength;
      const inverseLength = 1 / Math.hypot(dx, dy, 1);
      const index = (y * size + x) * channels;
      maps.normal[index] = encodeColor((-dx * inverseLength * 0.5 + 0.5) * 255);
      // Image rows run downwards; UV V runs upwards with Three.js flipY.
      // Positive green therefore encodes the OpenGL tangent +Y direction.
      maps.normal[index + 1] = encodeColor((dy * inverseLength * 0.5 + 0.5) * 255);
      maps.normal[index + 2] = encodeColor((inverseLength * 0.5 + 0.5) * 255);
    }
  }
  if (hasMetalness) maps.metalness = metalness;
  for (const buffer of Object.values(maps)) copyPeriodicEdges(buffer, size);
  return { maps, height };
}

function assertTileableEdges(buffer, name, size) {
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

const materials = [
  { name: "carapace", shader: carapaceMaterial, normalStrength: 0.13, size: 2048 },
  { name: "hive-resin", shader: resinMaterial, normalStrength: 0.12, size: 1024 },
  { name: "industrial-panels", shader: industrialMaterial, normalStrength: 0.11, size: 1024 },
  { name: "fabric-weave", shader: fabricMaterial, normalStrength: 0.11, size: 1024 },
  { name: "skin-tissue", shader: skinMaterial, normalStrength: 0.16, size: 2048 },
];

await fs.mkdir(outputDirectory, { recursive: true });

async function saveMap(name, buffer, size) {
  assertTileableEdges(buffer, name, size);
  const outputPath = path.join(outputDirectory, name);
  const png = encodePngRgb(buffer, size, size);
  await fs.writeFile(outputPath, png);
  const writtenPng = await fs.readFile(outputPath);
  const metadata = inspectPng(writtenPng);
  if (metadata.width !== size || metadata.height !== size) throw new Error(`${name}: dimensions inattendues`);
  console.log(`${name}: ${size}x${size}, RGB8, coutures exactes, CRC vérifiés, ${writtenPng.length} octets`);
}

for (const material of materials) {
  const size = material.size;
  const { maps, height } = buildMaterial(material.shader, material.normalStrength, size);
  for (const [kind, buffer] of Object.entries(maps)) {
    await saveMap(`${material.name}${kind === "color" ? "" : `-${kind}`}.png`, buffer, size);
  }
  if (material.name === "hive-resin") {
    // Compatibility with legacy callers that still use a scalar bump map.
    const legacyHeight = Buffer.alloc(size * size * channels);
    for (let index = 0; index < height.length; index += 1) {
      const value = encodeColor(height[index] * 255);
      legacyHeight.fill(value, index * channels, index * channels + channels);
    }
    copyPeriodicEdges(legacyHeight, size);
    await saveMap("organic-bump.png", legacyHeight, size);
  }
}

console.log("5 matériaux PBR / 22 cartes déterministes ; couleurs sRGB, normales et scalaires linéaires. Encodeur Node.js natif zlib + CRC32.");

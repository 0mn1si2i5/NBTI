import { axes, clamp } from "./scoring";
import type { QuizResult } from "../types/nbti";

type PosterInput = {
  result: QuizResult;
};

export async function downloadPoster({ result }: PosterInput) {
  const blob = await createPosterBlob({ result });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nbti-${result.primary.person.person}-${result.primary.person.title}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function createPosterBlob({ result }: PosterInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  const person = result.primary.person;
  const avatar = await loadImage(person.avatar);
  const owner = "我的人格切片";

  ctx.fillStyle = "#f5efe4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1440);
  gradient.addColorStop(0, "rgba(18, 63, 56, 0.12)");
  gradient.addColorStop(0.55, "rgba(255, 250, 241, 0.1)");
  gradient.addColorStop(1, "rgba(166, 64, 46, 0.12)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const margin = 74;
  const contentWidth = canvas.width - margin * 2;
  const avatarBox = { x: 736, y: 168, width: 250, height: 300, radius: 18 };
  const leftTextWidth = avatarBox.x - margin - 48;

  drawText(ctx, "NBTI · 乱世人格切片", margin, 90, 26, "#a6402e", "700");
  drawText(ctx, owner, margin, 148, 34, "#686d65", "700");

  drawImagePanel(ctx, avatar, avatarBox.x, avatarBox.y, avatarBox.width, avatarBox.height, avatarBox.radius);

  drawFittedText(ctx, person.person, margin, 286, leftTextWidth, 104, 60, "#171914", "800", "serif");
  drawWrappedText(ctx, person.title, margin + 4, 358, leftTextWidth, 44, 40, "#123f38", "800", 2);

  const quoteBottom = drawWrappedText(ctx, person.quote.text, margin, 548, contentWidth, 42, 30, "#3a392f", "500", 3, {
    borderLeft: true,
  });
  const whyTop = Math.max(672, quoteBottom + 36);
  const whyBottom = drawWrappedText(ctx, person.why, margin, whyTop, contentWidth, 38, 29, "#424940", "500", 7);

  const axesTop = Math.max(980, whyBottom + 52);
  drawText(ctx, "偏移量", margin, axesTop, 38, "#123f38", "800");
  drawAxes(ctx, result.vector, margin, axesTop + 62, contentWidth);

  drawText(ctx, "仅供自嘲，不供自首", margin, 1358, 25, "#686d65", "700");
  drawText(ctx, "NBTI", 892, 1358, 36, "#123f38", "900");

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Poster export failed."));
    }, "image/png");
  });
}

function drawAxes(ctx: CanvasRenderingContext2D, vector: number[], x: number, y: number, width: number) {
  axes.forEach((axis, index) => {
    const rowY = y + index * 48;
    const value = clamp(vector[index], -2, 2);
    const dotX = x + 106 + ((value + 2) / 4) * (width - 212);
    drawText(ctx, axis.left, x, rowY + 7, 24, "#686d65", "800");
    drawText(ctx, axis.right, x + width - 32, rowY + 7, 24, "#686d65", "800");

    roundRect(ctx, x + 106, rowY - 10, width - 212, 16, 8);
    ctx.fillStyle = "rgba(18, 63, 56, 0.16)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dotX, rowY - 2, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#123f38";
    ctx.fill();
  });
}

function drawImagePanel(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  roundRect(ctx, x - 10, y - 10, width + 20, height + 20, radius + 8);
  ctx.fillStyle = "rgba(255, 250, 241, 0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(37, 42, 34, 0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const scale = Math.max(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const sx = x + (width - scaledWidth) / 2;
  const sy = y + (height - scaledHeight) / 2;
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, sx, sy, scaledWidth, scaledHeight);
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = "400",
  family: "sans" | "serif" = "sans",
) {
  ctx.font = fontSpec(size, weight, family);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  color: string,
  weight = "400",
  family: "sans" | "serif" = "sans",
) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = fontSpec(size, weight, family);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  drawText(ctx, text, x, y, size, color, weight, family);
}

type WrappedTextOptions = {
  borderLeft?: boolean;
};

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  size: number,
  color: string,
  weight = "500",
  maxLines = Infinity,
  options: WrappedTextOptions = {},
) {
  const textX = options.borderLeft ? x + 16 : x;
  const textWidth = options.borderLeft ? maxWidth - 16 : maxWidth;
  ctx.font = fontSpec(size, weight, "sans");
  ctx.fillStyle = color;

  const lines: string[] = [];
  let line = "";
  Array.from(text).forEach((char) => {
    const next = line + char;
    if (ctx.measureText(next).width > textWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length) {
    const lastIndex = visibleLines.length - 1;
    let truncated = visibleLines[lastIndex];
    while (truncated && ctx.measureText(`${truncated}...`).width > textWidth) {
      truncated = truncated.slice(0, -1);
    }
    visibleLines[lastIndex] = `${truncated}...`;
  }

  if (options.borderLeft) {
    ctx.save();
    ctx.strokeStyle = "#b98741";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - size + visibleLines.length * lineHeight + 8);
    ctx.stroke();
    ctx.restore();
  }

  visibleLines.forEach((row, index) => {
    ctx.fillText(row, textX, y + index * lineHeight);
  });
  return y + Math.max(visibleLines.length, 1) * lineHeight;
}

function fontSpec(size: number, weight: string, family: "sans" | "serif") {
  const fontFamily =
    family === "serif"
      ? '"Songti SC", "Noto Serif CJK SC", "Times New Roman", serif'
      : 'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  return `${weight} ${size}px ${fontFamily}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image failed to load: ${src}`));
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

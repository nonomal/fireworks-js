export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1))
}

export function getDistance(
  x: number,
  y: number,
  dx: number,
  dy: number
): number {
  const pow = Math.pow
  return Math.sqrt(pow(x - dx, 2) + pow(y - dy, 2))
}

export function hsla(hue: number, brightness: number, alpha = 1): string {
  if (hue > 255 || hue < 0) {
    throw new Error(`Expected hue 0-255 range, got \`${hue}\``)
  }

  if (brightness > 100 || brightness < 0) {
    throw new Error(`Expected brightness 0-100 range, got \`${brightness}\``)
  }

  if (alpha > 1 || alpha < 0) {
    throw new Error(`Expected alpha 0-1 range, got \`${alpha}\``)
  }

  return `hsla(${hue}, 100%, ${brightness}%, ${alpha})`
}

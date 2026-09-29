export function drawSceneBackground(scene, accent = 0x82b29a) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x101b1d, 1);
  graphics.fillRect(0, 0, width, height);
  graphics.fillStyle(accent, 0.06);
  graphics.fillCircle(width * 0.82, height * 0.2, Math.min(width, height) * 0.28);
  graphics.fillStyle(0xf29a52, 0.05);
  graphics.fillCircle(width * 0.12, height * 0.85, Math.min(width, height) * 0.32);
  graphics.setDepth(-10);

  const stars = scene.add.group();
  for (let index = 0; index < 26; index += 1) {
    const x = (index * 193) % Math.max(width, 1);
    const y = (index * 83) % Math.max(height, 1);
    const radius = index % 3 === 0 ? 2 : 1;
    const star = scene.add.circle(x, y, radius, 0xf7f0db, 0.24);
    star.setDepth(-9);
    stars.add(star);
  }
  return graphics;
}

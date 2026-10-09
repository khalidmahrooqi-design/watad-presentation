import sharp from 'sharp';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  QRCodeReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
} = require('@zxing/library');
for (const size of [174, 180, 220, 256, 300, 512, 1024]) {
  const { data, info } = await sharp('public/brand/qr.svg')
    .resize(size, size)
    .flatten({ background: '#fff' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bitmap = new BinaryBitmap(
    new HybridBinarizer(
      new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height),
    ),
  );
  const result = new QRCodeReader().decode(bitmap);
  if (result.getText() !== 'https://www.aloulaidc.om/') throw Error('QR target mismatch');
  console.log(`Branded SVG QR decoded correctly at ${size}px.`);
}

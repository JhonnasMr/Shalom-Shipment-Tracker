import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function testOCR() {
  const imagePath = path.resolve('./test-fixtures/sample_shalom_receipt.png');
  console.log('Testing OCR on:', imagePath);
  
  // 1. Get image metadata
  const meta = await sharp(imagePath).metadata();
  console.log('Image dimensions:', meta.width, 'x', meta.height, 'format:', meta.format);
  
  // 2. Preprocess with Sharp: grayscale, normalize, threshold/sharpen
  const processedBuffer = await sharp(imagePath)
    .rotate() // auto-orient based on EXIF
    .grayscale()
    .normalize()
    .sharpen()
    .toBuffer();
    
  console.log('Preprocessed image buffer size:', processedBuffer.length);

  // 3. Run Tesseract with Spanish / English
  console.log('Starting Tesseract worker...');
  const worker = await createWorker('spa');
  const ret = await worker.recognize(processedBuffer);
  console.log('--- OCR RAW TEXT START ---');
  console.log(ret.data.text);
  console.log('--- OCR RAW TEXT END ---');
  await worker.terminate();
}

testOCR().catch(err => {
  console.error('OCR test error:', err);
});

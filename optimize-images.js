const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'Frontend', 'public', 'images');
const files = fs.readdirSync(imgDir);

(async () => {
  let totalSaved = 0;
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const filePath = path.join(imgDir, file);
      const tempPath = filePath + '.tmp';
      try {
        const metadata = await sharp(filePath).metadata();
        const originalSize = fs.statSync(filePath).size;
        
        let pipeline = sharp(filePath).resize(800, null, { withoutEnlargement: true });
        
        if (metadata.format === 'png') {
          pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
        } else {
          pipeline = pipeline.jpeg({ quality: 75, progressive: true });
        }

        await pipeline.toFile(tempPath);
        
        const newSize = fs.statSync(tempPath).size;
        if (newSize < originalSize) {
          fs.unlinkSync(filePath);
          fs.renameSync(tempPath, filePath);
          const saved = originalSize - newSize;
          totalSaved += saved;
          console.log(`Compressed ${file}: saved ${(saved / 1024 / 1024).toFixed(2)} MB`);
        } else {
          fs.unlinkSync(tempPath);
          console.log(`Skipped ${file} (already optimized)`);
        }
      } catch (err) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
  console.log(`Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
})();

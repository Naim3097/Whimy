// Cuts Concept B's campaign film from Mixkit clip 51002 (Mixkit Stock Video Free License).
// Usage: node scripts/encode-film.mjs <path to 51002-1080.mp4>   (needs ffmpeg on the PATH)
// Source: https://mixkit.co/free-stock-video/close-up-shot-of-a-satin-textured-blue-fabric-51002/
//
// Only the first 4.4 seconds (frames 0-104 at 23.976fps) are pale enough for ink type
// and controls over every frame; after that a darker fabric crosses the caption corner.
// They play forward, then back (frames 103-1), so the 8.7-second loop has no cut and no
// repeated frame at either turn. Writes a 16:9 file for wide screens, a 3:4 file cut
// from the left of the frame for phones, and the first frame as the poster. No audio.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/encode-film.mjs <path to 51002-1080.mp4>');
  process.exit(1);
}
const OUT = resolve('public/video');
const LOOP =
  '[0:v]trim=start_frame=0:end_frame=105,setpts=PTS-STARTPTS,split=2[f][b0];' +
  '[b0]trim=start_frame=1:end_frame=104,setpts=PTS-STARTPTS,reverse[b];' +
  '[f][b]concat=n=2:v=1:a=0';

function ffmpeg(args, options = {}) {
  const run = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', source, ...args], { maxBuffer: 64 * 1024 * 1024, ...options });
  if (run.error || run.status !== 0) throw new Error(run.error?.message ?? run.stderr.toString());
  return run.stdout;
}

const x264 = ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-movflags', '+faststart'];
ffmpeg(['-filter_complex', `${LOOP},scale=1280:720:flags=lanczos,format=yuv420p[v]`, '-map', '[v]', ...x264, `${OUT}/satin-sky-1280x720.mp4`]);
ffmpeg(['-filter_complex', `${LOOP},crop=810:1080:0:0,scale=720:960:flags=lanczos,format=yuv420p[v]`, '-map', '[v]', ...x264, `${OUT}/satin-sky-720x960.mp4`]);

const frame = ffmpeg(['-vf', 'select=eq(n\\,0),scale=1280:720:flags=lanczos', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-']);
const poster = await sharp(frame).webp({ quality: 80 }).toFile(`${OUT}/satin-sky-poster.webp`);
console.log('Film written: 1280x720 and 720x960 loops, poster', `${poster.width}x${poster.height}`);

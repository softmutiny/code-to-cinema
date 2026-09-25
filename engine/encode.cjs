// usage: node encode.cjs <projectDir> [--x] [--cover <seconds>]
//   default : film.mp4    1600×900, 24 fps, ~4.8 Mbps (for chat apps / local viewing)
//   --x     : film-x.mp4  1920×1080, CRF 17, light denoise; survives X/Twitter re-encoding far better
//   --cover : prepend 0.5 s of the frame at <seconds> so platforms that use frame 1 as the thumbnail show it
// Poses are rendered at 8 per second (hand-drawn "on threes"); ffmpeg holds each pose for 3 output frames.
// ffmpeg: on PATH, or set FFMPEG=<path to ffmpeg executable>.
const { execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const dir = path.resolve(process.argv[2] || '.');
const args = process.argv.slice(3), X = args.includes('--x');
const ci = args.indexOf('--cover'), cover = ci >= 0 ? +args[ci + 1] : null;
const FF = process.env.FFMPEG || 'ffmpeg';
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const hasAudio = fs.existsSync(path.join(dir, 'audio.wav'));
const out = path.join(dir, X ? 'film-x.mp4' : 'film.mp4');
// JPEG frames are full-range; convert to TV range or players/X show washed-out blacks
const RNG = 'in_range=pc:out_range=tv';
const scale = X ? `scale=1920:1080:flags=lanczos:${RNG},hqdn3d=1:1:2:2,` : `scale=${RNG},`;
const a = ['-y', '-loglevel', 'error', '-framerate', String(tl.fps), '-i', path.join(dir, 'frames', 'p%04d.jpg')];
if (hasAudio) a.push('-i', path.join(dir, 'audio.wav'));
// tpad holds the last pose for its full 1/fps; without it fps=24 ends the stream at the last pose's start time
let vf = `${scale}tpad=stop_mode=clone:stop_duration=${(1 / tl.fps).toFixed(4)},fps=24,format=yuv420p`;
if (cover != null) {
  const p = Math.round(cover * tl.fps), f = path.join(dir, 'frames', `p${String(p).padStart(4, '0')}.jpg`);
  a.push('-loop', '1', '-framerate', '24', '-t', '0.5', '-i', f);
  const ci2 = hasAudio ? 2 : 1;
  a.push('-filter_complex', `[0:v]${vf},setsar=1[m];[${ci2}:v]${scale}format=yuv420p,setsar=1[c];[c][m]concat=n=2:v=1:a=0[v]` + (hasAudio ? ';[1:a]adelay=500:all=1[a]' : ''), '-map', '[v]');
  if (hasAudio) a.push('-map', '[a]');
} else {
  a.push('-vf', vf);
}
// chat version: capped bitrate (boiling grain makes every frame unique, so CRF alone balloons the file: ~35MB/min)
// X version: CRF 17 at 1080p, big but it is what keeps the hatching from turning into mosaic after X re-encodes it
a.push('-c:v', 'libx264', '-preset', 'slow', ...(X ? ['-crf', '17'] : ['-b:v', '4800k', '-maxrate', '9000k', '-bufsize', '18000k']), '-r', '24', '-pix_fmt', 'yuv420p');
if (hasAudio) a.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
a.push('-color_range', 'tv', '-movflags', '+faststart', out);
execFileSync(FF, a, { stdio: 'inherit' });
console.log(path.basename(out), (fs.statSync(out).size / 1048576).toFixed(1) + 'MB');

const { execFile } = require('child_process');

async function test() {
  try {
    const args = [
      'https://youtu.be/h2o8lx_oal4?si=byw7pRyIpSZOIqOZ',
      '--output',
      './test2.m4a',
      '--format',
      'bestaudio[ext=m4a]/bestaudio/best',
      '--no-warnings',
      '--no-call-home'
    ];
    console.log("Running yt-dlp...");
    await new Promise((resolve, reject) => {
      execFile('yt-dlp', args, (error, stdout, stderr) => {
        if (error) {
          console.error("Error:", stderr);
          reject(error);
        } else {
          console.log("Success");
          resolve();
        }
      });
    });
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();

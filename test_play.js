const play = require('play-dl');
const fs = require('fs');

async function test() {
  try {
    const stream = await play.stream('https://youtu.be/h2o8lx_oal4?si=byw7pRyIpSZOIqOZ');
    console.log("Stream found, type:", stream.type);
    
    // just write a tiny bit to see if it works
    const w = fs.createWriteStream('./test.mp3');
    stream.stream.pipe(w);
    
    setTimeout(() => {
      stream.stream.destroy();
      w.end();
      console.log("Success");
      process.exit(0);
    }, 2000);
  } catch (e) {
    console.error("Failed:", e);
    process.exit(1);
  }
}

test();

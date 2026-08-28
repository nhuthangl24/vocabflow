require('ts-node').register();
const { fetchYouTubeCaptions } = require('./src/app/actions/youtube.ts');

async function test() {
  const r = await fetchYouTubeCaptions('https://www.youtube.com/watch?v=kYtGl1dX5qI');
  console.log("With manual CC:", r);

  const r2 = await fetchYouTubeCaptions('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Rick roll has manual CCs usually, let's try a generic video
  console.log("Generic:", r2);
}
test();

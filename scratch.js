const ytdl = require('@distube/ytdl-core');

async function checkCC() {
  const url = 'https://www.youtube.com/watch?v=kYtGl1dX5qI'; // sample video
  try {
    const info = await ytdl.getInfo(url);
    const tracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    console.log("Found tracks:", tracks.map(t => ({
      languageCode: t.languageCode,
      name: t.name.simpleText,
      kind: t.kind
    })));
  } catch(e) {
    console.error(e);
  }
}
checkCC();

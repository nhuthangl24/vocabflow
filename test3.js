
fetch('https://www.youtube.com/watch?v=wjMFlHUb894', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(res => res.text())
  .then(html => {
    const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
    console.log('Length:', lengthMatch ? lengthMatch[1] : 'NOT FOUND');
  }).catch(console.error);



fetch('https://www.youtube.com/watch?v=cNDG74IgUyA')
  .then(res => res.text())
  .then(html => {
    const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
    console.log(lengthMatch ? lengthMatch[1] : 'NOT FOUND');
  }).catch(console.error);


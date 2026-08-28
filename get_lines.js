const fs = require('fs');
const lines = fs.readFileSync('src/components/video/VideoWorkspaceClient.tsx', 'utf8').split('\n');

function findEndLine(startLineIndex) {
  let depth = 0;
  for (let i = startLineIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{selectedVocab?.id === vocab.id && (') || line.includes('{selectedGrammar?.id === item.id && (')) depth++;
    if (line.includes(')}')) {
      depth--;
      // Wait, there are other `)}` inside.
      // E.g. .map((ex: any, i: number) => ( ... ))}
      // A better heuristic: We know the indentation level of `)}` is 20 spaces.
      if (line.match(/^                    \)\}/)) {
        return i + 1;
      }
    }
  }
  return -1;
}

console.log('Modal 1 end at', findEndLine(176));
console.log('Modal 2 end at', findEndLine(291));
console.log('Modal 3 end at', findEndLine(415));

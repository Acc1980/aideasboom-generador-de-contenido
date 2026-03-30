const rl = require('readline').createInterface({ input: process.stdin });
rl.on('line', l => { if (!l.includes('debug')) console.log(l); });

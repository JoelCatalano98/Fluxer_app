const fs = require('fs');
const lines = fs.readFileSync('C:/Users/joelc/.gemini/antigravity-ide/brain/8823c43f-dcfd-4712-ab3a-7d73b64b39f1/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');

for (const l of lines) {
    if (!l) continue;
    const j = JSON.parse(l);
    if (j.step_index === 421) {
        const text = j.content;
        const idx = text.indexOf('54');
        console.log("Index of 54:", idx);
        if (idx !== -1) {
            console.log(text.slice(idx - 50, idx + 500));
        }
        break;
    }
}

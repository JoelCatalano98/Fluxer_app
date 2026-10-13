const fs = require('fs');
const readline = require('readline');

async function readStep422() {
    const fileStream = fs.createReadStream('C:\\Users\\joelc\\.gemini\\antigravity-ide\\brain\\8823c43f-dcfd-4712-ab3a-7d73b64b39f1\\.system_generated\\logs\\transcript_full.jsonl');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes('"step_index":422') || line.includes('"step_index":421') || line.includes('"step_index":428') || line.includes('"step_index":429') || line.includes('"step_index":430')) {
            const parsed = JSON.parse(line);
            console.log(`=== STEP ${parsed.step_index} (${parsed.type}) ===`);
            console.log(parsed.content);
        }
    }
}

readStep422().catch(console.error);

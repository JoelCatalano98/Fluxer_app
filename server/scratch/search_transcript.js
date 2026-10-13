const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
    const fileStream = fs.createReadStream('C:\\Users\\joelc\\.gemini\\antigravity-ide\\brain\\8823c43f-dcfd-4712-ab3a-7d73b64b39f1\\.system_generated\\logs\\transcript.jsonl');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        if (line.includes('161') || line.includes('54 clientes') || line.includes('evita el recargo')) {
            const parsed = JSON.parse(line);
            console.log(`Step ${parsed.step_index} (${parsed.type}):`, (parsed.content || '').slice(0, 300));
        }
    }
}

searchTranscript().catch(console.error);

import fs from "node:fs";
const KEY=(fs.readFileSync(".env.local","utf8").match(/GEMINI_API_KEY=(.*)/)||[])[1].trim();
const PROSE=["briefDescription","descriptionMd","benefitsMd","eligibilityMd","exclusionsMd","applicationMd"];
function figures(s){s=s||"";const out=new Set();for(const m of s.matchAll(/(?:₹|Rs\.?)\s?([\d,]+)/gi))out.add(m[1].replace(/,/g,""));for(const m of s.matchAll(/\b(\d[\d,]*(?:\.\d+)?)\b/g)){const c=m[1].replace(/,/g,"");if(c.replace(/\..*/,"").length>=2)out.add(c);}return out;}
const raw=JSON.parse(fs.readFileSync("data/schemes/_detail/apy.json","utf8"));
const schema={type:"object",properties:Object.fromEntries(PROSE.map(k=>[k,{type:"string"}])),required:PROSE};
const INSTR='Rewrite this Indian govt scheme text in plain ORIGINAL English. PRESERVE every number/₹ amount/%/date/limit/criterion/step/URL EXACTLY. Markdown. Return ONLY JSON keys: '+PROSE.join(", ");
const src=PROSE.map(k=>`### ${k}\n${raw[k]||"(empty)"}`).join("\n\n");
const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:INSTR+"\n\n"+src}]}],generationConfig:{temperature:0.4,responseMimeType:"application/json",responseSchema:schema}})});
const rw=JSON.parse((await r.json()).candidates[0].content.parts[0].text);
for(const k of ["benefitsMd","eligibilityMd","exclusionsMd","descriptionMd"]){const w=figures(raw[k]),g=figures(rw[k]);if(w.size===0)continue;const miss=[...w].filter(x=>!g.has(x));console.log(`${k}: src=${w.size} miss=${miss.length} (${(100-100*miss.length/w.size).toFixed(0)}% kept) -> ${JSON.stringify(miss.slice(0,20))}`);}
console.log("\nraw descriptionMd figs sample:",[...figures(raw.descriptionMd)].slice(0,20));

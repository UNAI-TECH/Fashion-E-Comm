import fs from 'fs';
import path from 'path';

const file = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/pages/ProductPage.tsx');
let content = fs.readFileSync(file, 'utf-8');

const regex = /\{\/\*\s*100-150 Word Detailed Description Paragraph\s*\*\/\}\s*<p className="text-gray-600 leading-relaxed text-sm my-4 font-normal">\s*\{details\.detailedDescription\}\s*<\/p>/;

const renderReplacement = `{/* Dynamic Product Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 my-5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#F5E6BE]/60 shadow-sm">
                      <div className="col-span-full mb-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Product Details
                        </h4>
                      </div>
                      {/* @ts-ignore */}
                      {details.attributes && details.attributes.map((attr, idx) => (
                        <div key={idx} className="flex flex-col border-b border-[#F5E6BE]/40 pb-2">
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">{attr.label}</span>
                          <span className="text-sm font-medium text-gray-800">{attr.value}</span>
                        </div>
                      ))}
                    </div>`;

if (regex.test(content)) {
  content = content.replace(regex, renderReplacement);
  fs.writeFileSync(file, content, 'utf-8');
  console.log("Successfully replaced JSX");
} else {
  console.log("Regex did not match!");
}

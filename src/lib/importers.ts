// Parsers that turn bank statements and UPI/bank SMS alerts into draft transactions.
import * as XLSX from 'xlsx';
import { cleanTitle, guessCategory, num, parseDate, type Draft } from './sms';
export { parseSms, guessCategory, type Draft } from './sms';

/** Reads CSV / XLS / XLSX statements, auto-detecting the header row and columns. */
export async function parseStatement(file: File, today: string): Promise<Draft[]> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
  const find = (cells: string[], re: RegExp) => cells.findIndex((c) => re.test(c));
  let h = -1, cols = { date: -1, desc: -1, debit: -1, credit: -1, amount: -1, drcr: -1 };
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const cells = (rows[i] || []).map((c) => String(c).toLowerCase().trim());
    const date = find(cells, /date/);
    const desc = find(cells, /narration|description|particular|details|remark|transaction/);
    if (date >= 0 && desc >= 0) {
      h = i;
      cols = {
        date, desc,
        debit: find(cells, /withdraw|debit|dr\.?\s*amount|paid out/),
        credit: find(cells, /deposit|credit|cr\.?\s*amount|paid in/),
        amount: find(cells, /^amount|amount \(|txn amount/),
        drcr: find(cells, /^(dr\s*\/\s*cr|cr\s*\/\s*dr|type)$/),
      };
      break;
    }
  }
  if (h < 0) throw new Error("Couldn't find Date and Description columns in this file");

  const out: Draft[] = [];
  rows.slice(h + 1).forEach((r, i) => {
    if (!r || !String(r[cols.desc] ?? '').trim()) return;
    let amount = 0, type: Draft['type'] = 'Expense';
    const debit = cols.debit >= 0 ? num(r[cols.debit]) : 0;
    const credit = cols.credit >= 0 ? num(r[cols.credit]) : 0;
    if (debit > 0) amount = debit;
    else if (credit > 0) { amount = credit; type = 'Income'; }
    else if (cols.amount >= 0) {
      const a = num(r[cols.amount]);
      const flag = cols.drcr >= 0 ? String(r[cols.drcr]).toLowerCase() : '';
      amount = Math.abs(a);
      type = flag.startsWith('cr') || (!flag && a > 0 && cols.debit < 0 && /cr/i.test(String(r[cols.amount]))) ? 'Income' : 'Expense';
    }
    if (!(amount > 0)) return;
    const raw = String(r[cols.desc]);
    out.push({ key: `f${i}`, include: true, title: cleanTitle(raw), amount, type, category: type === 'Income' ? 'Other' : guessCategory(raw), date: parseDate(r[cols.date], today) });
  });
  return out;
}


// SMS + shared parsing helpers (no heavy deps; safe for backend).

export type Draft = {
  key: string;
  include: boolean;
  title: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
  date: string; // YYYY-MM-DD
};

const RULES: [RegExp, string][] = [
  [/swiggy|zomato|domino|pizza|cafe|restaurant|food|blinkit|zepto|bigbasket|starbucks|mcdonald|kfc|chai|bakery/i, 'Food'],
  [/uber|ola|rapido|metro|irctc|railway|petrol|fuel|bus|redbus|fastag|auto/i, 'Transport'],
  [/netflix|spotify|prime|hotstar|bookmyshow|pvr|inox|steam|playstation|youtube|jio ?cinema|movie|game/i, 'Fun'],
  [/amazon|flipkart|myntra|ajio|meesho|nykaa|shop|store|mart|decathlon/i, 'Shopping'],
  [/recharge|airtel|jio|vodafone|vi |electricity|bill|rent|broadband|bescom|gas/i, 'Bills'],
  [/course|udemy|coursera|book|college|school|fee|exam|stationery/i, 'Education'],
  [/pharma|medic|hospital|clinic|apollo|1mg|pharmeasy|doctor|gym/i, 'Health'],
];
export const guessCategory = (text: string) => RULES.find(([r]) => r.test(text))?.[1] || 'Other';

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, '0');

/** Parses common Indian date formats (dd/mm/yyyy, dd-mm-yy, dd-Mon-yyyy, yyyy-mm-dd, Excel serials). */
export function parseDate(v: unknown, fallback: string): string {
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? '').trim();
  let m = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/(\d{1,2})[-/. ]([A-Za-z]{3})[A-Za-z]*[-/., ]+(\d{2,4})/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(+m[1])}`;
  }
  m = s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  return fallback;
}

export const num = (v: unknown) => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[₹,\sA-Za-z]/g, ''));
  return isNaN(n) ? 0 : n;
};
export const cleanTitle = (s: string) => {
  const t = s.replace(/\s+/g, ' ').trim();
  const upi = t.match(/UPI[/-][^/]*[/-]([^/]+?)[/-]/i);
  return (upi?.[1] || t).slice(0, 60) || 'Bank transaction';
};

/** Parses pasted SMS alerts — one message per line or blank-line separated. */
export function parseSms(text: string, today: string): Draft[] {
  const msgs = text.split(/\n\s*\n|\r?\n(?=\S)/).map((m) => m.trim()).filter(Boolean);
  const out: Draft[] = [];
  msgs.forEach((m, i) => {
    const amt = m.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amt) return;
    const amount = num(amt[1]);
    const isCredit = /credited|received|deposited|refund/i.test(m) && !/debited/i.test(m);
    const isDebit = /debited|paid|sent|spent|withdrawn|purchase|txn of/i.test(m);
    if (!isCredit && !isDebit) return;
    const who =
      m.match(/(?:to|at|towards)\s+(?:VPA\s+)?([A-Za-z0-9@._& -]{3,40}?)(?:\s+on|\s+ref|\s+upi|\.|,|$)/i)?.[1] ||
      m.match(/(?:from|by)\s+(?:VPA\s+)?([A-Za-z0-9@._& -]{3,40}?)(?:\s+on|\s+ref|\s+upi|\.|,|$)/i)?.[1] ||
      (isCredit ? 'Money received' : 'UPI payment');
    const dm = m.match(/\d{1,2}[-/ ][A-Za-z]{3}[A-Za-z]*[-/ ,]+\d{2,4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}-\d{2}-\d{2}/);
    const title = who.replace(/@.*/, '').replace(/\s+/g, ' ').trim() || 'UPI payment';
    out.push({
      key: `s${i}`, include: true, title: title.slice(0, 60), amount,
      type: isCredit ? 'Income' : 'Expense', category: isCredit ? 'Other' : guessCategory(m),
      date: dm ? parseDate(dm[0], today) : today,
    });
  });
  return out;
}

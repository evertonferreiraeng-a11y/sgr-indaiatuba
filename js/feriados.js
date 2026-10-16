// Feriados que não contam como dia útil (metas diárias/semanais de faturamento e das prensas).
// Nacionais fixos + Sexta-feira Santa (móvel, calculada pela Páscoa). Para incluir um feriado
// municipal ou um dia de ponto facultativo em que a unidade não abre, adicione em EXTRAS (AAAA-MM-DD ou MM-DD).
const FIXOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
const EXTRAS = [];

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher)
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

const pad = n => String(n).padStart(2, '0');
const _cache = {};
function feriadosDoAno(ano) {
  if (_cache[ano]) return _cache[ano];
  const set = new Set(FIXOS.map(md => `${ano}-${md}`));
  const sexta = pascoa(ano); sexta.setDate(sexta.getDate() - 2);
  set.add(`${ano}-${pad(sexta.getMonth() + 1)}-${pad(sexta.getDate())}`);
  EXTRAS.forEach(x => set.add(x.length === 5 ? `${ano}-${x}` : x));
  return (_cache[ano] = set);
}

// iso = 'AAAA-MM-DD'
export const ehFeriado = iso => feriadosDoAno(+iso.slice(0, 4)).has(iso.slice(0, 10));
// Dia útil = segunda a sexta e não feriado
export const ehDiaUtil = iso => { const w = new Date(iso.slice(0, 10) + 'T00:00:00').getDay(); return w !== 0 && w !== 6 && !ehFeriado(iso); };

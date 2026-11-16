// srpska latinica -> ćirilica
// strane riječi (sa q, w, x, y) i skraćenice (PDF, 2FA, LDAP) ostaju latinicom

const DIGRAPHS = {
  Lj: "Љ",
  LJ: "Љ",
  lj: "љ",
  Nj: "Њ",
  NJ: "Њ",
  nj: "њ",
  Dž: "Џ",
  DŽ: "Џ",
  dž: "џ"
};

const LETTERS = {
  A: "А", B: "Б", V: "В", G: "Г", D: "Д", Đ: "Ђ", E: "Е", Ž: "Ж", Z: "З", I: "И",
  J: "Ј", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "П", R: "Р", S: "С", T: "Т",
  Ć: "Ћ", U: "У", F: "Ф", H: "Х", C: "Ц", Č: "Ч", Š: "Ш",
  a: "а", b: "б", v: "в", g: "г", d: "д", đ: "ђ", e: "е", ž: "ж", z: "з", i: "и",
  j: "ј", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р", s: "с", t: "т",
  ć: "ћ", u: "у", f: "ф", h: "х", c: "ц", č: "ч", š: "ш"
};

const FOREIGN = /[qwxyQWXY]/;
const ACRONYM = /^[A-ZČĆŠĐŽ0-9]*[A-Z][A-ZČĆŠĐŽ0-9]*$/;

const convertWord = (word) => {
  if (FOREIGN.test(word) || (word.length > 1 && ACRONYM.test(word))) return word;

  let result = "";

  for (let index = 0; index < word.length; index++) {
    const pair = word.slice(index, index + 2);

    if (DIGRAPHS[pair]) {
      result += DIGRAPHS[pair];
      index++;
    } else {
      result += LETTERS[word[index]] ?? word[index];
    }
  }

  return result;
};

// {param}, email adrese i linkovi se ne diraju
const PROTECTED = /(\{\w+\}|\S+@\S+|https?:\/\/\S+)/;

export const toCyrillic = (text) =>
  text
    .split(PROTECTED)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replace(/[A-Za-zČĆŠĐŽčćšđž]+/g, convertWord)
    )
    .join("");

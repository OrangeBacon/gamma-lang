let t = {
  keywords: ["if", "then", "else", "fn", "->", "true", "false", "null", "let", "mut", "fn->"],
  is_whitespace(ch) {
    return " \t\n".indexOf(ch) >= 0;
  },
  is_digit(ch) {
    return /[0-9]/i.test(ch);
  },
  is_id_start(ch) {
    return /[a-z_]/i.test(ch);
  },
  is_id(ch) {
    return t.is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
  },
  is_keyword(x) {
    return t.keywords.indexOf(x) >= 0;
  },
  is_punc(ch) {
    return ",;[]{}()".indexOf(ch) >= 0;
  },
  is_op(ch) {
    return "+-*/%=&|<>!^".indexOf(ch) >= 0;
  }
};
export default t;
import c from 'lang/tokencommon';
export default function TokenStream(input) {
  let current = null;
  return {
    next,
    peek,
    eof,
    err: input.err
  };

  function read_while(pred) {
    let str = '';
    while (pred(input.peek(), input.peek(1)) && !input.eof()) {
      str += input.next().value;
    }
    return str;
  }

  function read_comment() {
    let next = input.next();
    let varient;
    if (next.value == "/") {
      input.next();
      varient = "//";
    } else {
      varient = "#";
    }
    let val = read_while(ch => ch !== '\n');
    return {
      type: "comment",
      varient: varient,
      value: val,
      line: next.line,
      col: next.col
    };
  }

  function read_comment_m() {
    let next = input.next();
    input.next();
    let val = read_while((ch1, ch2) => ch1 !== '*' && ch2 !== '/');
    input.next();
    input.next();
    return {
      type: "comment",
      varient: "multiline",
      value: val,
      line: next.line,
      col: next.col
    };
  }

  function read_escaped(end) {
    let escaped = false;
    let str = "";
    while (!input.eof()) {
      let next = input.next();
      let ch = next.value;
      if (escaped) {
        if (ch == "n") {
          str += "\n";
        } else {
          str += ch;
        }
        escaped = false;
      } else if (ch == "\\") {
        escaped = true;
      } else if (ch == end) {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }

  function read_string() {
    let next = input.next();
    let varient = next.value == "'" ? "'" : '"';
    let val = read_escaped(varient);
    return {
      type: "string",
      varient: varient,
      value: val,
      line: next.line,
      col: next.col
    };
  }

  function read_number() {
    let next = input.peekData();
    let has_dot = false;
    let number = read_while(function(ch) {
      if (ch == ".") {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }
      return c.is_digit(ch);
    });
    return {
      type: "number",
      value: number,
      line: next.line,
      col: next.col,
    };
  }

  function read_ident() {
    let next = input.peekData();
    let id = read_while(c.is_id);
    return {
      type: c.is_keyword(id) ? "kw" : "var",
      value: id,
      line: next.line,
      col: next.col
    };
  }

  function read_punc() {
    let next = input.next();
    return {
      type: "punc",
      value: next.value,
      line: next.line,
      col: next.col
    };
  }

  function read_op() {
    let next = input.peekData();
    return {
      type: "op",
      value: read_while(c.is_op),
      line: next.line,
      col: next.col
    };
  }

  function read_mod() {
    let next = input.next();
    return {
      type: "mod",
      value: next.value,
      line: next.line,
      col: next.col
    };
  }

  function read_next() {
    read_while(c.is_whitespace);
    if (input.eof()) return null;
    var ch = input.peek();
    var next = input.peek(1);
    if (ch == "#") {
      read_comment();
      return read_next();
    }
    if (ch == "/" && next == "*") {
      read_comment_m();
      return read_next();
    }
    if (ch == "/" && next == "/") {
      read_comment();
      return read_next();
    }
    if (ch == "'" || ch == '"') return read_string();
    if (c.is_digit(ch)) return read_number();
    if (c.is_id_start(ch) || (ch == "-" && next == ">")) return read_ident();
    if (c.is_punc(ch)) return read_punc();
    if (c.is_op(ch)) return read_op();
    if (ch == "?") return read_mod();
    input.err("Lexing Error", `Unexpected character "${ch}"`);
  }

  function peek() {
    return current || (current = read_next());
  }

  function next() {
    var tok = current;
    current = null;
    return tok || read_next();
  }

  function eof() {
    return peek() === null;
  }
}
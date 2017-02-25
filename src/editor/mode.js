import c from 'lang/tokencommon';
import makeEnv from 'editor/stdenv.js';
export default function mode(opt) {

  function token(stream, state) {
    function read_comment(next) {
      stream.eatWhile(ch => ch !== '\n');
      return "comment";
    }

    function read_comment_m(next) {
      stream.next();
      state.comment_m = true;
      while (!stream.eol()) {
        if (ch == "*" && next == "/") {
          state.comment_m = false;
          stream.next();
          return "comment";
        }
        ch = stream.next();
        next = stream.peek();
      }
      return "comment";
    }

    function read_string(ch) {
      state.string = ch;
      if (stream.peek() == ch) {
        stream.next();
        state.string = false;
        return "string";
      }
      if (stream.peek() == "\\") {
        state.escape = true;
        return "string";
      }
      while (!stream.eol()) {
        let ch = stream.next();
        let next = stream.peek();
        if (ch != "\\" && next == state.string) {
          stream.next();
          state.string = false;
          state.escape = false;
          return "string";
        }
        if (next == "\\") {
          state.escape = true;
          return "string";
        }
      }
      return "string";
    }

    function read_number(ch) {
      let has_dot = ch == ".";
      stream.eatWhile(function(ch) {
        if (ch == ".") {
          if (has_dot) return false;
          has_dot = true;
          return true;
        }
        return c.is_digit(ch);
      });
      return "number";
    }

    function read_ident() {
      stream.eatWhile(c.is_id);
      let curr = stream.current().trim();
      let cState = state.varState[state.varState.length - 1];
      if (c.is_keyword(curr)) {
        if (curr == "let" || curr == "mut") {
          state.context = "let";
        }
        if (curr == "fn") {
          state.context = "fn";
          state.varState.push(JSON.parse(JSON.stringify(cState)));
          cState = state.varState[state.varState.length - 1];
        }
        return "keyword";
      }

      if (state.context == "let") {
        state.context = null;
        if (!cState.includes(curr)) cState.push(curr);
        return "def";
      }
      if (state.context == "fn") {
        cState.push(curr);
        return "def";
      }
      if (cState.includes(curr)) return "variable-2";
      return "variable-1";
    }

    function read_punc() {
      let cState = state.varState[state.varState.length - 1];
      let curr = stream.current().trim();
      if (curr == "{") {
        if (state.context == "fn") {
          state.context = null;
        } else {
          state.varState.push(JSON.parse(JSON.stringify(cState)));
        }
      }
      if (curr == "}" && state.varState.length > 1) {
        state.varState.pop();
      }
      if ("(){}[]".indexOf(curr) >= 0) {
        return "bracket";
      }
      return;
    }

    function read_op() {
      stream.eatWhile(c.is_op);
      return "operator";
    }
    stream.eatSpace();
    let ch = stream.next();
    let next = stream.peek();
    if (state.comment_m) {
      while (!stream.eol()) {
        if (ch == "*" && next == "/") {
          state.comment_m = false;
          stream.next();
          return "comment";
        }
        ch = stream.next();
        next = stream.peek();
      }
      return "comment";
    }
    if (state.escape) {
      stream.next();
      state.escape = false;
      return "atom";
    }
    if (state.string) {
      if (ch == state.string) {
        state.string = false;
        return "string";
      }
      while (!stream.eol()) {
        if (ch != "\\" && next == state.string) {
          stream.next();
          state.string = false;
          return "string";
        }
        if (ch == "\\") {
          state.escape = true;
          return "string";
        }
        ch = stream.next();
        next = stream.peek();
      }
      return "string";
    }
    if (ch == "#") {
      return read_comment();
    }
    if (ch == "/" && next == "*") {
      return read_comment_m();
    }
    if (ch == "/" && next == "/") {
      return read_comment();
    }
    if (ch == "'" || ch == '"') return read_string(ch);
    if (c.is_digit(ch)) return read_number(ch);
    if (c.is_id_start(ch) || (ch == "-" && next == ">")) return read_ident();
    if (c.is_punc(ch)) return read_punc();
    if (c.is_op(ch)) return read_op();
    if (ch == "?") return "atom";
    stream.skipToEnd();
    return "error";
  }
  return {
    startState() {
      return {
        comment_m: false,
        string: false,
        context: null,
        escape: false,
        varState: [
          Object.keys(makeEnv().vars)
        ],
      };
    },
    copyState(state) {
      return JSON.parse(JSON.stringify(state));
    },
    indent(state, text) {
      let indent = state.varState.length - 1;
      if (text.includes("}")) indent = state.varState.length - 2;
      return opt.indentUnit * indent;
    },
    token
  };
}
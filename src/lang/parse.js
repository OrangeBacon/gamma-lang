export default function parse(input) {
  let FALSE = {
    type: "bool",
    value: false
  };
  let PRECEDENCE = {
    "=": 1,
    "*=":1,"/=":1,"+=":1,"-=":1,
    "||": 2,
    "&&": 3,
    "<": 7,
    ">": 7,
    "<=": 7,
    ">=": 7,
    "==": 7,
    "!=": 7,
    "+": 10,
    "-": 10,
    "*": 20,
    "/": 20,
    "%": 20,
    "|>": 30,
  };
  let is = type => ch => {
    let tok = input.peek();
    return tok && tok.type == type && (!ch || tok.value == ch) && tok;
  };
  let is_punc = is("punc");
  let is_kw = is("kw");
  let is_op = is("op");
  let is_var = is("var");
  let skip = type => ch => {
    if (is(type)(ch)) {
      input.next();
    } else {
      input.err("Parse Error", `Expecting ${type}: "${ch}"`);
    }
  };
  let skip_punc = skip("punc");
  let skip_kw = skip("kw");
  let skip_op = skip("op");
  let skip_var = skip("var");

  function parse_call(func) {
    return {
      type: "call",
      func: func,
      args: delimited("(", ")", ",", parse_expression),
    };
  }

  function maybe_call(expr) {
    expr = expr();
    return is_punc("(") ? parse_call(expr) : expr;
  }

  function delimited(start, stop, separator, parser) {
    var a = [],
      first = true;
    skip_punc(start);
    while (!input.eof()) {
      if (is_punc(stop)) break;
      if (first) first = false;
      else skip_punc(separator);
      if (is_punc(stop)) break;
      a.push(parser());
    }
    skip_punc(stop);
    return a;
  }

  function parse_block() {
    var prog = delimited("{", "}", ";", parse_expression);
    if (prog.length === 0) return FALSE;
    if (prog.length == 1) return prog[0];
    return {
      type: "block",
      prog: prog
    };
  }

  function parse_bool() {
    return {
      type: "bool",
      value: input.next().value == "true"
    };
  }

  function parse_if() {
    skip_kw("if");
    var cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    var then = parse_expression();
    var ret = {
      type: "if",
      cond: cond,
      then: then,
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }

  function parse_varname() {
    let name = input.next();
    let mod = "";
    if (name.type == "mod") {
      mod = '?';
      name = input.next();
    }
    if (name.type != "var") input.err("Parse Error", "Expecting variable name");
    return {
      value: name.value,
      mod: mod
    };
  }

  function parse_fn() {
    let next = input.next();
    let vars, name, ret;
    if (next.value == "fn") {
      if(input.peek().type=="var")name=input.next();
      vars = delimited("(", ")", ",", parse_varname);
      skip_kw("->");
    } else {
      vars = [];
      name = null;
    }
    ret = {
        type: "function",
        vars: vars,
        body: parse_expression()
      };
    if(name)ret = {
      type: "define",
      varient: "immutable",
      left: name,
      right: ret
    };
    return ret;
  }

  function parse_define() {
    input.next();
    let varient = "immutable";
    if (is_kw("mut")) {
      varient = "mutable";
      skip_kw("mut");
    }
    let left = is_var();
    if (left) {
      skip_var(left.value);
    } else {
      input.err("Parse Error", `Expecting variable name after ${varient=="immutable"?"let":"let mut"}`);
    }
    let right = {
      type: "number",
      value: 0
    };
    if (is_op("=")) {
      skip_op("=");
      right = parse_expression();
    }
    return {
      type: "define",
      varient,
      left,
      right,
    };
  }

  function parse_atom() {
    return maybe_call(function() {
      if (is_punc("(")) {
        input.next();
        let exp = parse_expression();
        skip_punc(")");
        return exp;
      }
      if (is_punc("{")) return parse_block();
      if (is_kw("if")) return parse_if();
      if (is_kw("true") || is_kw("false")) return parse_bool();
      if (is_kw("fn") || is_kw("fn->")) return parse_fn();
      if (is_kw("let")) return parse_define();
      let tok = input.next();
      if (tok.type == "var" || tok.type == "number" || tok.type == "string")
        return tok;
      input.err("Parse Error", `Unexpected token: ${JSON.stringify(tok)}`);
    });
  }

  function maybe_binary(left, my_prec) {
    let tok = is_op();
    if (tok) {
      let his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        let type;
        let assign = ["=", "*=", "+=", "-=", "/="];
        if (assign.indexOf(tok.value) >= 0) {
          type = "assign";
        } else {
          type = "binary";
        }
        return maybe_binary({
          type: type,
          operator: tok.value,
          left: left,
          right: maybe_binary(parse_atom(), his_prec)
        }, my_prec);
      }
    }
    return left;
  }

  function parse_expression() {
    return maybe_call(function() {
      return maybe_binary(parse_atom(), 0);
    });
  }

  function parse_prog() {
    let prog = [];
    while (!input.eof()) {
      prog.push(parse_expression());
      if (!input.eof()) skip_punc(';');
    }
    return {
      type: "block",
      prog: prog,
      global: true,
    };
  }

  return parse_prog();
}
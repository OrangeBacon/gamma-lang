/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GUARD = GUARD;
exports.cpsEvaluate = cpsEvaluate;
exports.Execute = Execute;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var STACKLEN = void 0;
function Continuation(f, args) {
  this.f = f;
  this.args = args;
}
function GUARD(f, args) {
  if (--STACKLEN < 0) throw new Continuation(f, args);
}
function cpsEvaluate(exp, env, callback) {
  function apply_op(op, a, b) {
    function num(x) {
      x = parseFloat(x);
      if (Number.isNaN(x)) throw new Error("Expected number but got " + x);
      return x;
    }

    function div(x) {
      if (num(x) == 0) throw new Error("Divide by zero");
      return x;
    }
    switch (op) {
      case "+":
        return num(a) + num(b);
      case "-":
        return num(a) - num(b);
      case "*":
        return num(a) * num(b);
      case "/":
        return num(a) / div(b);
      case "%":
        return num(a) % div(b);
      case "&&":
        return a !== false && b;
      case "||":
        return a !== false ? a : b;
      case "<":
        return num(a) < num(b);
      case ">":
        return num(a) > num(b);
      case "<=":
        return num(a) <= num(b);
      case ">=":
        return num(a) >= num(b);
      case "==":
        return a === b;
      case "!=":
        return a !== b;
    }
    throw new Error("Can't apply operator " + op);
  }
  function make_function(env, exp) {
    function fn(callback) {
      GUARD(fn, arguments);
      var names = exp.vars;
      var scope = env.extend();
      for (var i = 0; i < names.length; ++i) {
        scope.def(names[i].value, i + 1 < arguments.length ? arguments[i + 1] : false, {
          immutable: true,
          force: true
        });
      }cpsEvaluate(exp.body, scope, callback);
    }
    return fn;
  }
  GUARD(cpsEvaluate, arguments);
  switch (exp.type) {
    case "number":
    case "string":
    case "bool":
      callback(exp.value);
      return;
    case "var":
      callback(env.get(exp.value));
      return;
    case "define":
      if (exp.left.type != "var") throw new Error("Cannot assign to " + exp.left.type);
      cpsEvaluate(exp.right, env, function CC(right) {
        GUARD(CC, arguments);
        callback(env.def(exp.left.value, right, {
          immutable: exp.varient == "immutable",
          force: false
        }));
      });
      return;
    case "assign":
      if (exp.left.type != "var") throw new Error("Cannot assign to " + exp.left.type);
      cpsEvaluate(exp.right, env, function CC(right) {
        GUARD(CC, arguments);
        callback(env.set(exp.left.value, right));
      });
      return;
    case "binary":
      cpsEvaluate(exp.left, env, function CC(left) {
        GUARD(CC, arguments);
        cpsEvaluate(exp.right, env, function CC(right) {
          GUARD(CC, arguments);
          callback(apply_op(exp.operator, left, right));
        });
      });
      return;
    case "function":
      callback(make_function(env, exp));
      return;
    case "if":
      cpsEvaluate(exp.cond, env, function CC(cond) {
        GUARD(CC, arguments);
        if (cond !== false) cpsEvaluate(exp.then, env, callback);else if (exp.else) cpsEvaluate(exp.else, env, callback);else callback(false);
      });
      return;
    case "block":
      var scope = exp.global ? env : env.extend();
      (function loop(last, i) {
        GUARD(loop, arguments);
        if (i < exp.prog.length) {
          cpsEvaluate(exp.prog[i], scope, function CC(val) {
            GUARD(CC, arguments);
            loop(val, i + 1);
          });
        } else {
          callback(last);
        }
      })(false, 0);
      return;
    case "call":
      cpsEvaluate(exp.func, env, function CC(func) {
        GUARD(CC, arguments);
        (function loop(args, i) {
          GUARD(loop, arguments);
          if (i < exp.args.length) {
            cpsEvaluate(exp.args[i], env, function CC(arg) {
              GUARD(CC, arguments);
              args[i + 1] = arg;
              loop(args, i + 1);
            });
          } else {
            func.apply(undefined, _toConsumableArray(args));
          }
        })([callback], 0);
      });
      return;
    default:
      throw new Error("Cannot evaluate " + JSON.stringify(exp));
  }
}
function Execute(f, args) {
  while (true) {
    try {
      STACKLEN = 200;
      return f.apply(undefined, _toConsumableArray(args));
    } catch (e) {
      if (e instanceof Continuation) {
        f = e.f, args = e.args;
      } else {
        throw e;
      }
    }
  }
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = InputStream;
function InputStream(input) {
  var editor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var pos = 0;
  var line = 1;
  var col = 0;
  return {
    next: next,
    peek: peek,
    eof: eof,
    err: err,
    peekData: peekData
  };

  function next() {
    var ch = input.charAt(pos);
    var val = {
      value: ch,
      line: line,
      col: col,
      pos: pos
    };
    pos++;
    if (ch == "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }
    return val;
  }

  function peek() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    return input.charAt(pos + x);
  }

  function peekData() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var ch = input.charAt(pos + x);
    var val = {
      value: ch,
      line: line,
      col: col,
      pos: pos
    };
    for (var i = 0; i < x; i++) {
      if (input.charAt(val.pos) == "\n") {
        val.line++;
        val.col = 0;
      } else {
        val.col++;
      }
      val.pos++;
    }
    return val;
  }

  function eof() {
    return peek() === "";
  }

  function err(type, msg) {
    if (editor) {
      var el = document.createElement("span");
      el.setAttribute('class', 'cm-error');
      el.style.display = 'block';
      el.innerText = type + ": " + msg + " at line " + line + ":" + col;
      editor.widgets.push(editor.addLineWidget(line - 1, el, {
        noHScroll: true
      }));
    }
    throw new Error(type + ": " + msg + " at line " + line + ":" + col);
  }
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;
function parse(input) {
  var FALSE = {
    type: "bool",
    value: false
  };
  var PRECEDENCE = {
    "=": 1,
    "*=": 1, "/=": 1, "+=": 1, "-=": 1,
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
    "|>": 30
  };
  var is = function is(type) {
    return function (ch) {
      var tok = input.peek();
      return tok && tok.type == type && (!ch || tok.value == ch) && tok;
    };
  };
  var is_punc = is("punc");
  var is_kw = is("kw");
  var is_op = is("op");
  var is_var = is("var");
  var skip = function skip(type) {
    return function (ch) {
      if (is(type)(ch)) {
        input.next();
      } else {
        input.err("Parse Error", "Expecting " + type + ": \"" + ch + "\"");
      }
    };
  };
  var skip_punc = skip("punc");
  var skip_kw = skip("kw");
  var skip_op = skip("op");
  var skip_var = skip("var");

  function parse_call(func) {
    return {
      type: "call",
      func: func,
      args: delimited("(", ")", ",", parse_expression)
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
      if (first) first = false;else skip_punc(separator);
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
      then: then
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }

  function parse_varname() {
    var name = input.next();
    var mod = "";
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
    var next = input.next();
    var vars = void 0,
        name = void 0,
        ret = void 0;
    if (next.value == "fn") {
      if (input.peek().type == "var") name = input.next();
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
    if (name) ret = {
      type: "define",
      varient: "immutable",
      left: name,
      right: ret
    };
    return ret;
  }

  function parse_define() {
    input.next();
    var varient = "immutable";
    if (is_kw("mut")) {
      varient = "mutable";
      skip_kw("mut");
    }
    var left = is_var();
    if (left) {
      skip_var(left.value);
    } else {
      input.err("Parse Error", "Expecting variable name after " + (varient == "immutable" ? "let" : "let mut"));
    }
    var right = {
      type: "number",
      value: 0
    };
    if (is_op("=")) {
      skip_op("=");
      right = parse_expression();
    }
    return {
      type: "define",
      varient: varient,
      left: left,
      right: right
    };
  }

  function parse_atom() {
    return maybe_call(function () {
      if (is_punc("(")) {
        input.next();
        var exp = parse_expression();
        skip_punc(")");
        return exp;
      }
      if (is_punc("{")) return parse_block();
      if (is_kw("if")) return parse_if();
      if (is_kw("true") || is_kw("false")) return parse_bool();
      if (is_kw("fn") || is_kw("fn->")) return parse_fn();
      if (is_kw("let")) return parse_define();
      var tok = input.next();
      if (tok.type == "var" || tok.type == "number" || tok.type == "string") return tok;
      input.err("Parse Error", "Unexpected token: " + JSON.stringify(tok));
    });
  }

  function maybe_binary(left, my_prec) {
    var tok = is_op();
    if (tok) {
      var his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        var type = void 0;
        var assign = ["=", "*=", "+=", "-=", "/="];
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
    return maybe_call(function () {
      return maybe_binary(parse_atom(), 0);
    });
  }

  function parse_prog() {
    var prog = [];
    while (!input.eof()) {
      prog.push(parse_expression());
      if (!input.eof()) skip_punc(';');
    }
    return {
      type: "block",
      prog: prog,
      global: true
    };
  }

  return parse_prog();
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TokenStream;

var _tokencommon = __webpack_require__(4);

var _tokencommon2 = _interopRequireDefault(_tokencommon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function TokenStream(input) {
  var current = null;
  return {
    next: next,
    peek: peek,
    eof: eof,
    err: input.err
  };

  function read_while(pred) {
    var str = '';
    while (pred(input.peek(), input.peek(1)) && !input.eof()) {
      str += input.next().value;
    }
    return str;
  }

  function read_comment() {
    var next = input.next();
    var varient = void 0;
    if (next.value == "/") {
      input.next();
      varient = "//";
    } else {
      varient = "#";
    }
    var val = read_while(function (ch) {
      return ch !== '\n';
    });
    return {
      type: "comment",
      varient: varient,
      value: val,
      line: next.line,
      col: next.col
    };
  }

  function read_comment_m() {
    var next = input.next();
    input.next();
    var val = read_while(function (ch1, ch2) {
      return ch1 !== '*' && ch2 !== '/';
    });
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
    var escaped = false;
    var str = "";
    while (!input.eof()) {
      var _next = input.next();
      var ch = _next.value;
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
    var next = input.next();
    var varient = next.value == "'" ? "'" : '"';
    var val = read_escaped(varient);
    return {
      type: "string",
      varient: varient,
      value: val,
      line: next.line,
      col: next.col
    };
  }

  function read_number() {
    var next = input.peekData();
    var has_dot = false;
    var number = read_while(function (ch) {
      if (ch == ".") {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }
      return _tokencommon2.default.is_digit(ch);
    });
    return {
      type: "number",
      value: number,
      line: next.line,
      col: next.col
    };
  }

  function read_ident() {
    var next = input.peekData();
    var id = read_while(_tokencommon2.default.is_id);
    return {
      type: _tokencommon2.default.is_keyword(id) ? "kw" : "var",
      value: id,
      line: next.line,
      col: next.col
    };
  }

  function read_punc() {
    var next = input.next();
    return {
      type: "punc",
      value: next.value,
      line: next.line,
      col: next.col
    };
  }

  function read_op() {
    var next = input.peekData();
    return {
      type: "op",
      value: read_while(_tokencommon2.default.is_op),
      line: next.line,
      col: next.col
    };
  }

  function read_mod() {
    var next = input.next();
    return {
      type: "mod",
      value: next.value,
      line: next.line,
      col: next.col
    };
  }

  function read_next() {
    read_while(_tokencommon2.default.is_whitespace);
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
    if (_tokencommon2.default.is_digit(ch)) return read_number();
    if (_tokencommon2.default.is_id_start(ch) || ch == "-" && next == ">") return read_ident();
    if (_tokencommon2.default.is_punc(ch)) return read_punc();
    if (_tokencommon2.default.is_op(ch)) return read_op();
    if (ch == "?") return read_mod();
    input.err("Lexing Error", 'Unexpected character "' + ch + '"');
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

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TokenStreamCommon;

var TokenStreamCommon = {
  keywords: ["if", "then", "else", "fn", "->", "true", "false", "null", "let", "mut", "fn->"],
  is_whitespace: function is_whitespace(ch) {
    return " \t\n".indexOf(ch) >= 0;
  },
  is_digit: function is_digit(ch) {
    return (/[0-9]/i.test(ch)
    );
  },
  is_id_start: function is_id_start(ch) {
    return (/[a-z_]/i.test(ch)
    );
  },
  is_id: function is_id(ch) {
    return TokenStreamCommon.is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
  },
  is_keyword: function is_keyword(x) {
    return TokenStreamCommon.keywords.indexOf(x) >= 0;
  },
  is_punc: function is_punc(ch) {
    return ",;[]{}()".indexOf(ch) >= 0;
  },
  is_op: function is_op(ch) {
    return "+-*/%=&|<>!^".indexOf(ch) >= 0;
  }
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Environment;
function Environment(parent) {
  this.vars = Object.create(parent ? parent.vars : {});
  this.parent = parent;
}
Environment.prototype = {
  extend: function extend() {
    return new Environment(this);
  },
  lookup: function lookup(name) {
    var scope = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name)) return scope;
      scope = scope.parent;
    }
    return false;
  },

  get: function get(name) {
    if (name in this.vars) return this.vars[name].value;
    throw new Error("Undefined variable " + name);
  },
  set: function set(name, value) {
    var scope = this.lookup(name);
    if (!(scope || this).vars.hasOwnProperty(name)) throw new Error("Undefined variable " + name);
    var opt = (scope || this).vars[name];
    if (opt.immutable) {
      throw new Error("Cannot write to read-only variable " + name);
    }
    return opt.value = value;
  },
  def: function def(name, value) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { immutable: true, force: true },
        _ref$immutable = _ref.immutable,
        immutable = _ref$immutable === undefined ? true : _ref$immutable,
        _ref$force = _ref.force,
        force = _ref$force === undefined ? true : _ref$force;

    if (this.vars.hasOwnProperty(name) && !force) throw new Error("Variable " + JSON.stringify(name) + " is already defined");
    if (this.parent && !force) throw new Error("Cannot define value when not in global scope");
    return this.vars[name] = {
      value: value,
      immutable: immutable
    };
  }
};

/***/ }),
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _input = __webpack_require__(1);

var _input2 = _interopRequireDefault(_input);

var _token = __webpack_require__(3);

var _token2 = _interopRequireDefault(_token);

var _parse = __webpack_require__(2);

var _parse2 = _interopRequireDefault(_parse);

var _env = __webpack_require__(5);

var _env2 = _interopRequireDefault(_env);

var _evaluate = __webpack_require__(0);

var _evaluate2 = _interopRequireDefault(_evaluate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  input: _input2.default,
  token: _token2.default,
  parse: _parse2.default,
  environment: _env2.default,
  evaluate: _evaluate2.default
};

/***/ })
/******/ ]);
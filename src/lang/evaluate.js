let STACKLEN;
function Continuation(f, args) {
  this.f = f;
  this.args = args;
}
export function GUARD(f, args) {
  if (--STACKLEN < 0) throw new Continuation(f, args);
}
export function cpsEvaluate(exp,env,callback){
  function apply_op(op, a, b) {
    function num(x) {
      x = parseFloat(x);
      if (Number.isNaN(x))
        throw new Error("Expected number but got " + x);
      return x;
    }

    function div(x) {
      if (num(x) == 0)
        throw new Error("Divide by zero");
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
  function make_function(env,exp){
    function fn(callback){
      GUARD(fn,arguments);
      let names = exp.vars;
      let scope = env.extend();
      for(let i=0; i < names.length; ++i)
        scope.def(names[i].value,i+1 < arguments.length? arguments[i+1]: false, {
          immutable: true,
          force: true,
        });
      cpsEvaluate(exp.body,scope,callback);
    }
    return fn;
  }
  GUARD(cpsEvaluate,arguments);
  switch(exp.type){
    case "number":
    case "string":
    case "bool":
      callback(exp.value);
      return;
    case "var":
      callback(env.get(exp.value));
      return;
    case "define":
      if (exp.left.type != "var")
        throw new Error(`Cannot assign to ${exp.left.type}`);
      cpsEvaluate(exp.right,env,function CC(right){
        GUARD(CC,arguments);
        callback(env.def(exp.left.value, right, {
          immutable: exp.varient == "immutable",
          force: false
        }));
      });
      return;
    case "assign":
      if(exp.left.type != "var")
        throw new Error(`Cannot assign to ${exp.left.type}`);
      cpsEvaluate(exp.right,env,function CC(right){
        GUARD(CC,arguments);
        callback(env.set(exp.left.value,right));
      });
      return;
    case "binary":
      cpsEvaluate(exp.left,env,function CC(left){
        GUARD(CC,arguments);
        cpsEvaluate(exp.right,env,function CC(right){
          GUARD(CC,arguments);
          callback(apply_op(exp.operator,left,right));
        });
      });
      return;
    case "function":
      callback(make_function(env,exp));
      return;
    case "if":
      cpsEvaluate(exp.cond,env, function CC(cond){
        GUARD(CC,arguments);
        if(cond !== false) cpsEvaluate(exp.then,env,callback);
        else if(exp.else) cpsEvaluate(exp.else,env,callback);
        else callback(false);
      });
      return;
    case "block":
      let scope = exp.global?env:env.extend();
      (function loop(last,i){
        GUARD(loop,arguments);
        if(i<exp.prog.length){
          cpsEvaluate(exp.prog[i],scope,function CC(val){
            GUARD(CC,arguments);
            loop(val, i+1);
          });
        } else {
          callback(last);
        }
      })(false,0);
      return;
    case "call":
      cpsEvaluate(exp.func,env,function CC(func){
        GUARD(CC,arguments);
        (function loop(args,i){
          GUARD(loop,arguments);
          if(i < exp.args.length){
            cpsEvaluate(exp.args[i],env,function CC(arg){
              GUARD(CC,arguments);
              args[i+1] = arg;
              loop(args,i+1);
            });
          } else {
            func(...args);
          }
        })([callback],0);
      });
      return;
    default:
      throw new Error(`Cannot evaluate ${JSON.stringify(exp)}`);
  }
}
export function Execute(f, args) {
  while (true) try {
    STACKLEN = 200;
    return f(...args);
  } catch(e) {
    if (e instanceof Continuation){
      f = e.f, args = e.args;
    } else {
      throw e;
    }
  }
}
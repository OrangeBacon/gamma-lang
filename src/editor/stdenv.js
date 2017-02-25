import Environment from 'lang/env';
import {Execute} from 'lang/evaluate';
export default function makeEnv(output={}){
  let globalEnv = new Environment();
  globalEnv.def("print", function(callback,txt){
    if(typeof txt !== "string")txt = txt.toString();
    output.setValue(output.getValue() + txt);
    callback();
  });
  globalEnv.def("clear",function(callback){
    output.setValue('');
    callback();
  });
  globalEnv.def("time", function(callback,func){
    try {
      console.time("time");
      return func();
    } finally {
      console.timeEnd("time");
      callback();
    }
  });
  globalEnv.def("sleep", function(callback, milliseconds){
    setTimeout(function(){
      Execute(callback, [ false ]); // continuations expect a value, pass false
    }, milliseconds);
  });
  // globalEnv.def("callcc",function(callback,fn, ...args){
  //   fn(callback,function CC(discard,ret){
  //     callback(ret);
  //   }, ...args);
  // })
  return globalEnv;
}
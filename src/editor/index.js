import CodeMirror from 'codemirror';
import input from 'lang/input';
import token from 'lang/token';
import parse from 'lang/parse';
import makeEnv from 'editor/stdenv';
import {Execute,cpsEvaluate} from 'lang/evaluate';
import gamma from 'editor/mode.js';
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/lib/codemirror.css';

let editor = document.getElementById('editor');
CodeMirror.defineMode('gamma',gamma);
editor = CodeMirror(editor, {
  value: document.getElementById('example').innerText,
  lineNumbers: true,
  theme: "railscasts",
  lineWrapping: true,
  scrollbarStyle: "overlay",
  matchBrackets: true,
  autoCloseBrackets: true,
  styleActiveLine: true,
  mode: "gamma",
  tabSize: 2,
  extraKeys: {
    ["Ctrl-Enter"](){display()},
    ["Ctrl-L"](){output.setValue('')}
  }
});
editor.widgets = [];
let output = document.getElementById('output');
CodeMirror.defineMode("console", function() {
  return {
    token: function(stream) {
      if (stream.match("Error: ")) {
        stream.skipToEnd();
        return "error";
      } else if(stream.match("*** Result: ")){
        stream.skipToEnd();
        return "variable-2";
      }
      stream.skipToEnd();
      return "comment";
    }
  };
});
output = CodeMirror(output, {
  readOnly: "nocursor",
  theme: "railscasts",
  lineWrapping: true,
  scrollbarStyle: "overlay",
  mode: "console"
});
let run = document.getElementById('run');
function display() {
  // clear errors
  editor.widgets.forEach(w => w.clear());
  editor.widgets = [];

  // get Token stream
  let code = editor.getValue();
  code = input(code, editor);
  code = token(code);

  // define environment
  let globalEnv = makeEnv(output);
  function print(txt) {
    if(typeof txt !== "string")txt = txt.toString();
    output.setValue(output.getValue() + txt);
  }
  // make ast and eval
  if(!(output.getValue().endsWith('\n')||output.getValue()==""))print('\n');
  let x = parse(code);
  window.x = x;
  window.onerror = function(msg,source,line,col,e){
    print(e);
    window.e = e;
  };
  Execute(cpsEvaluate, [x, globalEnv,function(result){
    if(!(output.getValue().endsWith('\n')||output.getValue()==""))print('\n');
    print(`*** Result: ${result}\n`);
  }]);
}
run.addEventListener('click', display);
display();
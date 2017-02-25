export default function InputStream(input, editor=false) {
  let pos = 0;
  let line = 1;
  let col = 0;
  return {
    next,
    peek,
    eof,
    err,
    peekData
  };

  function next() {
    let ch = input.charAt(pos);
    let val = {
      value: ch,
      line,
      col,
      pos
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

  function peek(x = 0) {
    return input.charAt(pos + x);
  }

  function peekData(x = 0) {
    let ch = input.charAt(pos + x);
    let val = {
      value: ch,
      line,
      col,
      pos
    };
    for (let i = 0; i < x; i++) {
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
    if(editor){
      let el = document.createElement("span");
      el.setAttribute('class', 'cm-error');
      el.style.display = 'block';
      el.innerText = `${type}: ${msg} at line ${line}:${col}`;
      editor.widgets.push(editor.addLineWidget(line - 1, el, {
        noHScroll: true
      }));
    }
    throw new Error(`${type}: ${msg} at line ${line}:${col}`);
  }
}
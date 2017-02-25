export default function Environment(parent) {
  this.vars = Object.create(parent ? parent.vars : {});
  this.parent = parent;
}
Environment.prototype = {
  extend: function() {
    return new Environment(this);
  },
  lookup: function(name) {
    var scope = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name))
        return scope;
      scope = scope.parent;
    }
    return false;
  },

  get: function(name) {
    if (name in this.vars)
      return this.vars[name].value;
    throw new Error("Undefined variable " + name);
  },
  set: function(name, value) {
    let scope = this.lookup(name);
    if (!(scope || this).vars.hasOwnProperty(name))
      throw new Error("Undefined variable " + name);
    let opt = (scope || this).vars[name];
    if (opt.immutable) {
      throw new Error(`Cannot write to read-only variable ${name}`);
    }
    return opt.value = value;
  },
  def: function(name, value, {immutable=true,force=true}={immutable:true,force:true}) {
    if (this.vars.hasOwnProperty(name)&&!force)
      throw new Error(`Variable ${JSON.stringify(name)} is already defined`);
    if(this.parent&&!force)
      throw new Error("Cannot define value when not in global scope");
    return this.vars[name] = {
      value,
      immutable
    };
  }
};

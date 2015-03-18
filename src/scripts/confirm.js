// Confirmation script
// (c) 2012 Steve Butler

function Confirm(msg) {
    this.fun = null;
}

Confirm.prototype = new Executable();
Confirm.constructor = Confirm;

Confirm.prototype.process = function(data) {
    if (/^\s*y(es)?\s*$/i.test(data)) {
        if (this.funYes) {
            this.funYes();
        }
    } else {
        if (this.funNo) {
            this.funNo();
        }
    }
    this.exit();
}

Confirm.prototype.yesOrNo = function(msg, funYes, funNo) {
    this.funYes = funYes;
    this.funNo = funNo;
    this.run();
    terminal.print(msg + " Yes or No?");
}

Confirm.prototype.wait = function(msg, callback) {
    this.funYes = this.funNo = callback;
    this.run();
    terminal.print(msg);
} 

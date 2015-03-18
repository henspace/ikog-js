// Executable object.
// This mimics an program that might be executed by the iKog shell.

function Executable() {
   this.oldShell = null;
   this.caller = null;
}

Executable.prototype.setCaller = function(caller) {
    this.caller = caller;
}

Executable.prototype.run = function() {
  // set the terminal into execution mode.
  terminal.runningCommand(true);
  //this.callback = callback;
  this.oldShell = terminal.setShell(this);		
}

Executable.prototype.exit = function(data) {
    terminal.runningCommand(false);
    if (this.oldShell) {
        terminal.setShell(this.oldShell)
    }
    if (this.caller && this.caller.process) {
        this.caller.process(data);
    }
}


/** To implement
 * MyChild.prototype = new Executable();
 * MyChild.constructor = MyChild;
 * function MyChild() {
 * }
 * MyChild.prototype.process = function(data) {
 *   //handle the shell here
 * }
 *
 */

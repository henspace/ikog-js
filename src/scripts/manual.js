// Simple help commands for iKog
// (c) 2012 Steve Butler


var iKogAboutText = 
  "<p>iKog is a deceptively powerful task list manager. It is a rewrite of my "
+ "original Python application but now in Javascript to allow it to run in "
+ "your browser.</p>"
+ "<p>Tasks can either be stored locally using the HTML5 localStorage, or you "
+ "can use Dropbox to store your tasks. If you want to find out about me "
+ "or what I'm currently up to, just enter <b>WEB</b> or follow me on twitter "
+ "@henspace.<p>"
+ "<ul>"
+ "<li>To read up on how to use iKog, enter <b>HELP ONLINE</b>."
+ "<li>To list all commands, enter <b>COMMANDS</b>."
+ "<li>To get help on a particular command, enter <b>HELP</b> followed by the command."
+ "</ul>";

var iKogHelpIndex = {
"+" : "add",
"a" : "add",
"ab" : "abbrev",
"as" : "autosave",
"cls" : "clearscreen",
"console" : "console",
"d" : "down",
"e" : "extend",
"ed" : "edit",
"f" : "first",
"fi": "filter",
"g" : "go",
"i" : "immediate",
"k" : "kill",
"++": "immediate",
"list" :"list",
"ls": "dir",
"m" : "mod",
"modify" : "mod",
"notes": "note",
"n" : "next",
"rev" : "review",
"v0" : "review",
"v1" : "review",
"r" : "rep",
"replace" : "rep",
"sh" : "show",
"t" : "top",
"x" : "kill",
"." : "this",
"^" : "this",
"u" : "up",
"logoff" : "signout"

};

var iKogHelpText = {
"2" : "Start a two minute timer after which a flashing message will appear.",

"add": "Add a task using one of the following methods:"
    + "<ul>"
    + "<li>ADD Phone up John tonight"
    + "<li>A Phone up John tonight"
    + "<li>+ Phone up John tonight"
    + "</ul>",

"abbrev" : "Create your own abbreviations as follows:"
    + "<ul>"
    + "<li>ABBREV abbreviation replacement text"
    + "<li>AB abbreviation replacement text"
    + "<li>AB me Steve <em>replace me with Steve</em>"
    + "<li>AB ? <em>list all available abbreviations</em>"
    + "</ul>",

"autosave" : "Switch autosave on or off. Note that autosave is not efficient "
    + "when using Dropbox and it may be faster to switch it off and manually "
    + "save your tasks using the SAVE command."
    + "<ul>"
    + "<li>AUTOSAVE ON"
    + "<li>AS ON <em>switch autosave on</em>"
    + "<li>AUTOSAVE OFF"
    + "<li>AS OFF <em>switch autosave off</em>"
    +"</ul>",

"clear" : "Clear all tasks."
    + "<ul>"
    + "<li>CLEAR"
    + "</ul",

"clearscreen" : "Clear the screen"
    + "<ul>"
    + "<li>CLEARSCREEN"
    + "<li>CLS"
    + "</ul",

"commands" : "List all the available commands"
    + "<ul>"
    + "<li>COMMANDS"
    + "</ul>",
    
"console" : "Switch console mode on or off."
    + "In console mode, the display simulates a terminal. When console mode is "
    + "off, a more conventional display is used. Switching console mode off is "
    + "probably better for smaller screens."
    + "<ul>"
    + "<li>CONSOLE ON <em>console simulator</em>"
    + "<li>CONSOLE OFF <em>conventional display</em>"
    +"</ul>",
    
    
"del" : "Delete a local storage file"
    + "<ul>"
    + "<li>DEL steve <em>delete the task list with the name steve</em>"
    + "</ul>",

"down" : "Move a task down the priorities."
    + "<ul>"
    + "<li>DOWN 3 <em>move task 3 down</em>"
    + "<li>D 4 <em>move task 4 down</em>"
    + "<li>DOWN ^ <em>move the current task down</em>"
    + "<li>DOWN . <em>move the current task down</em>"
    + "</ul>",

"dump" : "Produce a JSON listing of your tasks. For debugging only."
    + "<ul>"
    + "<li>DUMP"
    + "</ul>",

"edit" : "Edit a task. If it contains a secret you will be prompted for your password."
    + "<ul>"
    + "<li>EDIT 3 <em>edit task 3</em>"
    + "<li>ED ^ <em>edit the current task</em>"
    + "<li>ED . <em>edit the current task</em>"
    + "</ul>",

"export" : "Export the tasks. If supported by your browser, allows you to "
    + "save your tasks to a file."
    + "<ul>"
    + "<li>EXPORT"
    + "</ul>",

"extend" : "Extend a task."
    + "The selected task will have the new entries appended."
    + "<ul>"
    + "<li>EXTEND 3 Phone Jackie <em> extend the content of task 3 with phone Jackie</em>"
    + "<li>E 4 @Computer <em>add a new context to task 4</em>"
    + "<li>EXTEND ^ @Work <em>extend the current task</em>"
    + "<li>EXTEND . @Work <em>extend the current task</em>"
    + "</ul>",

"first" : "Move a task to the top of the priorities."
    + "<ul>"
    + "<li>FIRST 3 <em>move task 3 to the top</em>"
    + "<li>FIRST ^ <em>move the current task to the top</em>"
    + "<li>FIRST . <em>move the current task to the top</em>"
    + "<li>F 7 <em>move the 7th task to the top</em>"
    + "</ul>",

"filter" : "Apply a filter to reduce the number of tasks that are shown."
    + "<ul>"
    + "<li>FILTER @Computer<em>only show those tasks with a context of @Computer</em>"
    + "<li>FI @Computer @Work <em>restrict to @Computer and @Work</em>"
    + "<li>FI @Computer not @work <em>restrict to @Computer but not @Work</em>"
    + "<li>FI :pPatio or :pGarden <em>show tasks in the Patio or Garden project.</em>"
    + "</ul>",

"go" : "Go to a particular task."
    + "<ul>"
    + "<li>GO 7 <em>jump to task 7</em>"
    + "<li>G 8 <em>jump to task 8</em>"
    + "</ul>",
"immediate" :" Add a task to the top of priorities."
    + "<ul>"
    + "<li>IMMEDIATE phone Jane today."
    + "<li>I phone Jane today."
    + "<li>++ phone Jane today."
    + "</ul>",

"import" :" Import a set of tasks and abbreviations from a local file."
    + " Note, these are merged with your current tasks."
    + "<ul>"
    + "<li>IMPORT"
    + "</ul>",

"list" :" List tasks."
    + " List task. An optional filter can also be applied."
    + "<ul>"
    + "<li>LIST <em>list all tasks</em>"
    + "<li>LIST @Computer <em>list tasks with context of @Computer</em>"
    + "</ul>",

"dir" : "Show the available iKog files. If you are using Dropbox, the files"
    + " in the ikog-js folder are listed. Otherwise the files in local"
    + " storage are shown."
    + "<ul>"
    + "<li>DIR"
    + "<li>LS"
    + "</ul>",

"kill" : "Delete a task or a cache. If you delete the local cache you may lose"
    + " data."
    + "<ul>"
    + "<li>KILL 6 <em>remove task 6</em>"
    + "<li>K 6 <em>remove task 6</em>"
    + "<li>X 6 <em>remove task 6</em>"
    + "<li>KILL ^ <em>remove the current task </em>"
    + "<li>KILL . <em>remove the current task </em>"
    + "<li>KILL CACHE <em>remove the cache for the current file</em>"
    + "<li>KILL ALL CACHES <em>remove all caches </em>"
    + "</ul>",

"this" : "The word <b>this</b>, <b>^</b> or <b>.</b> can be used to refer to"
    + " the current task."
    + "<ul>"
    + "<li> MOD this @Work <em>adds the @Work context to the current task.</em>"
    + "<li> KILL ^ <em>deletes the current task.</em>"
    + "<li> KILL . <em>deletes the current task.</em>"
    + "</ul>",

"terms" : "Displays the terms and conditions, acknowledgements and privacy"
    + "statements."
    + "<ul>"
    + "<li>TERMS <em>open terms and other legal stuff in a new window</em>"
    + "</ul>",

"mod" : "Modify a task."
    + "The selected task will have the selected entries replaced by your new entry."
    + "<ul>"
    + "<li>MOD 3 Phone Jackie <em> replace the content of task 3 with phone Jackie</em>"
    + "<li>M 4 @Computer <em>change the context of task 4</em>"
    + "<li>MOD ^ Order stationary <em>modify the current task</em>"
    + "<li>MOD . Order stationary <em>modify the current task</em>"
    + "</ul>",

"note" : "Create a task with the @Note context. This always appears at the"
    + " bottom of the priorities."
    + "<ul>"
    + "<li>NOTE This is a note."
    + "<li>NOTES This is a note."
    + "</ul>",

"next" : "Move to the next task in the list. Note that if you have a filter"
    + " applied, the next task will be the next visible task."
    + "<ul>"
    + "<li>NEXT"
    + "<li>N"
    + "</ul>",

"open" : "Open a new task list file. If your are using Dropbox, file will"
    + " will opened from the Dropbox ikog-js folder. Otherwise it will be"
    + " taken from the files in local storage."
    + "<ul>"
    + "<li>OPEN steve <em>Open a file called steve</em>"
    + "<li>O steve <em>Open a file called steve</em>"
    + "</ul>",

"prev" : "Move to the previoius task in the list. Note that if you have a filter"
    + " applied, the previous task will be the previous visible task."
    + "<ul>"
    + "<li>PREV"
    + "<li>P"
    + "</ul>",

"review" : "Switch review mode on and off. When review mode is on, just"
    + " pressing enter moves to the next task."
    + "<ul>"
    + "<li>REVIEW ON <em>switch review mode on</em>"
    + "<li>REVIEW OFF <em>switch review mode off</em>"
    + "<li>REV ON <em>switch review mode on</em>"
    + "<li>V0 <em>switch review mode off</em>"
    + "<li>V1 <em>switch review mode on</em>"
    + "</ul>",

"save" : "Save the task list. If you are using Dropbox, the file will"
    + " will saved to the Dropbox ikog-js folder. Otherwise it will be"
    + " saved to the files in local storage."
    + "<ul>"
    + "<li>SAVE <em>Save the tasks to the current file</em>"
    + "<li>SAVE steve <em>Save the tasks to a file called steve</em>"
    + "</ul>",

"show" : "Show the text that has been encrypted in a task. You will be"
    + " prompted to enter your password."
    + "<ul>"
    + "<li>SHOW 8 <em>reveal the secret text in task 8</em>"
    + "<li>S 7 <em>reveal the text in task 7</em>"
    + "<li>SHOW ^ <em>show the secret text for the current task</em>"
    + "<li>SHOW . <em>show the secret text for the current task</em>"
    + "</ul>",

"top" : "Show the top N tasks."
    + "<ul>"
    + "<li>TOP 8 <em>list the top 8 tasks</em>"
    + "<li>T 4 <em>list the top 4 tasks</em>"
    + "</ul>",

"up" : "Move a task up the priorities."
    + "<ul>"
    + "<li>UP 3 <em>move task 3 up</em>"
    + "<li>U 5 <em>move task 5 up</em>"
    + "<li>UP ^ <em>move the current task up</em>"
    + "<li>UP . <em>move the current task up</em>"
    + "</ul>",

"use" : "Select local storage or Dropbox."
    + "<ul>"
    + "<li>USE local <em>use local storage</em>"
    + "<li>USE dropbox <em>use dropbox</em>"
    + "</ul>",
"rep" : "Replace a task."
    + "The selected task will be replaced by your new entry."
    + "<ul>"
    + "<li>REP 3 Phone Jackie <em> replace task 3 with phone Jackie</em>"
    + "<li>R 4 Send report to head office <em>replace task 4</em>"
    + "<li>REP ^ Order stationary <em>replace the current task</em>"
    + "<li>REP . Order stationary <em>replace the current task</em>"
    + "</ul>",
"signout" : "This only applies to Dropbox. If you sign out you will need"
    + " reauthorise ikog-js next time you reload the web page."
    + "<ul>"
    + "<li>SIGNOUT"
    + "<li>LOGOUT"
    + "</ul>",

"web" : "Just a shortcut to go to my blog."
    + "<ul>"
    + "<li>WEB"
    + "</ul>",

"help" : "This help"
    + "<ul>"
    + "<li>HELP add <em>get help about the add command"
    + "<li>? top <em>get help about the top command"
    + "<li>HELP online <em>open the full online guide</em>"
    + "</ul>"
}

function iKogHelp() {
    this.index = iKogHelpIndex;
    this.text = iKogHelpText;
}

iKogHelp.prototype.render = function(data) {
    var html = "<div class='help'>";
    if (/^online$/i.test(data)) {
        window.open("http://henspace.com/wiki/pmwiki.php?n=Ikog-js.Ikog-js", "_blank");
        html += "Online help opened in new window.";
    } else  if (data && data != "") {
        data = data.toLowerCase();
        var i = data;
        if (data in this.index) {
            i = this.index[data]
        }
        if (i in this.text) {
            html += this.text[i];
        } else {
            html += "No help available for " + data;
        }
    } else {
        html += iKogVersion + iKogAboutText;
    }
    return html + "</div>";

}

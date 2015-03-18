// Script file
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-11-05

if (!window.console) {
	window.console = {};
	window.console.log = function() {};
}



// sort out IE issues
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
         for (var i = (start || 0), j = this.length; i < j; i++) {
             if (this[i] === obj) { return i; }
         }
         return -1;
    }
}


$(document).ready(function() {
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return $.trim(this);
        }
    }


    terminal.clear();
    //$('#commandLine').change(terminal.enter);
    $(window).click(function(){
        if (terminal.isPassword()) {
            $('#pwEntry').focus();
        } else {
            $('#commandLineEntry').focus();
        }
    });
    $('#commandLineEntry').focus();
    $('#commandLineEntry, #pwEntry').keypress(function(e) {

        if (e.keyCode == 13) {
            e.preventDefault();
            terminal.enter();
        }
    });
    terminal.setPrompt("root@ikog:~ > ");
    terminal.enterPassword(false);
    terminal.print(iKogBanner);                        
    terminal.print(iKogVersion);
    terminal.print("");
    $("#nonConsoleHeader").html("iKog-js");
    $("#nonConsoleFooter").html(iKogVersion);
    ikog.init();
 
    $(window).on('beforeunload', function(){
        if (ikog.isDirty()) {
            console.log("Reckon page is dirty.");
            return 'Are you sure you want to leave?';
        }
    });

    $(window).on("unload", function() {
        if (!ikog.isDirty()) {
            ikog.killCache();
        }
    });
});




var ikog = (function() {
    var nvm = {
        tasks : null, abbreviations: null
    };
    var dataStore, commandAliases, processors, contexts, projects, dates,
        filter, currentIndex, encryptor, decryptor, exporter;
    var configuration = {
        firstUse: true, 
        useDropbox: false,
        reviewMode: false,
        autosave: false,
        lastLocal: null,
        lastDropbox: null,
        console: true
    };
    var configDs;
    var isDirty = false;
    var autoShowCurrent = true; 

    function _init() {
        configDs = new DataStoreLocal("ikog-config");
        configDs.init();
        configDs.load("configuration", configuration,
          function(data) {
            configuration = data;
            _setConsole(configuration.console);
        });
        exporter = new Exporter('#importFile');
        encryptor = new Encryptor();
        encryptor.setCaller(this);
        decryptor = new Decryptor();
        contexts = new Collection();
        projects = new Collection();
        dates = new Collection();

        

        commandAliases = new Alias({
            '+':'ADD', 'A':'ADD', 'AB': 'ABBREV', 'AS' : 'AUTOSAVE',
            'CLS' : 'CLEARSCREEN', 'D' : 'DOWN',
            'E' : 'EXTEND', 'ED' : 'EDIT',
            'F' : 'FIRST',
            'FI' : 'FILTER',
            'G': 'GO', '++':'IMMEDIATE', 'I':'IMMEDIATE',
            'K' : 'KILL',
            'LS' : 'DIR',
            'L' : 'LIST', 'M' : 'MOD',
            'NOTES' : 'NOTE', 'N' : 'NEXT', 'O' : 'OPEN', 'P' : 'PREV',
            'R' : 'REP', 'REV' : 'REVIEW',
            'SH' : 'SHOW','T' : 'TOP',  'U' : 'UP',
            'SIGNOFF' : 'SIGNOUT', 'LOGOFF' : 'SIGNOUT', 'X' : 'KILL',
            '?' : 'HELP'
        });
        processors = {
            '@' : _cmdListByContext,
            ':D' : _cmdListByDate,
            ':P' : _cmdListByProject,
            "2" : _cmdTimer,
            'ABBREV': _cmdAbbrev, 
            'ADD': _cmdAdd,
            'AUTOSAVE' : _cmdAutosave,
            "CLEAR" : _cmdClearTasks,
            "CLEARSCREEN" : _cmdClear,
            "COMMANDS" : _cmdListCmd,
            "CONSOLE" : _cmdConsole,
            'DEL' : _cmdDel,
            'DIR' : _cmdDir,
            'DOWN' : _cmdDown,
            'DUMP': _cmdDump,
            "EDIT" : _cmdEdit,
            "EXTEND": _cmdExtend,
            "EXPORT": _cmdExport,
            'FILTER' : _cmdFilter,
            'FIRST' : _cmdFirst,
            'GO' : _cmdGo,
            'HELP': _cmdHelp,
            'IMMEDIATE': _cmdImmediate,
            'IMPORT': _cmdImport,
            'KILL': _cmdKill,
            'LIST':_cmdList,
            "MOD" : _cmdMod,
            'NEXT' : _cmdNext,
            'NOTE': _cmdNote,
            'OPEN' : _cmdOpen,
            'PREV' : _cmdPrev, 
            'REP' : _cmdRep,
            'REVIEW' : _cmdReview,
            'SAVE': _cmdSave,
            'SHOW' : _cmdShow,
            'SIGNOUT' : _cmdSignOut,
            "TERMS" : _cmdTerms,
            'TOP' : _cmdTop,
            'UP' : _cmdUp,
            'USE' : _cmdUse,
            'V0' : _cmdReviewOff,
            'V1' : _cmdReviewOn,
            "WEB" : _cmdWeb
        };
        filter = new Filter();
        currentIndex = 0;
       
        if (configuration.firstUse) { 
            _setConsole(false);
            terminal.print("As this is your first use, I need to know where to"
                    + " store your data.<br>If you choose Dropbox, then your"
                    + " data will be in the cloud and accessible wherever you"
                    + " are.<br>If you don't select Dropbox, your browser's"
                    + " local storage will be used.");
            
            new Confirm().yesOrNo( "Do you want to use Dropbox for online"
                    + " storage?",
                function(){
                    configuration.useDropbox = true;
                    configuration.firstUse = false;
                    configDs.save("configuration", configuration);
                    _initDataStores();    
                },
                function() {
                    configuration.useDropbox = false;
                    configuration.firstUse = false;
                    configDs.save("configuration", configuration);
                    _initDataStores();    
                }
            );
        } else {
            _initDataStores();
        }
    };

    function _warnAutosave() {
        if (configuration.autosave && dataStore.storeName == "Dropbox") {
            terminal.print("Autosave is on. When using Dropbox, this means "
              + "data is written to the local cache automatically. To save "
              + "back to Dropbox you will still need to use the <em>SAVE</em> "
              + "command.");
        }
    }

    function _initDataStores() {
        terminal.block(true);
        terminal.print("Configuring storage.");
        new DataStoreFactory(configuration.useDropbox).getDataStore(
          function(ds) {
            if (ds) {
                dataStore = ds;
                var fname = dataStore.getStoreName() == "Dropbox"
                    ? configuration.lastDropbox : configuration.lastLocal;
                if (!fname) {
                    fname = dataStore.getFileName();
                }
                _loadData(fname, function() {
                    _warnAutosave();
                    terminal.print("Enter <em>HELP ONLINE</em> to read the manual "
                        +"or enter <em>TERMS</em> to see the terms of use.");
                    if (configuration.console) {
                        terminal.print("Enter <em>console off</em> for conventional display.");
                    } else {
                        terminal.print("Enter <em>console on</em> for original console mode.");
                    }
                    terminal.setShell(ikog);
                    terminal.block(false);
                });
            } else {
                terminal.error("Dropbox not available and your browser does "
                    + "support local storage. There's nothing I can do. "
                    + " Sorry :(");
            }

        });
    }

    function _loadData(name, callback) {
        terminal.block(true);
        dataStore.load(name ||"default", null, function(ikogData) {
            var asave = configuration.autosave;
            configuration.autosave = false;
            _setDirty(dataStore.isCached());
            configuration.autosave = asave;
            var activeFile = dataStore.getFileName();
            if (dataStore.getStoreName() == "Dropbox") {
                if (activeFile != configuration.lastDropbox) {
                    configuration.lastDropbox = activeFile;
                    configDs.save("configuration", configuration);
                }
            } else {
                if (activeFile != configuration.lastLocal) {
                    configuration.lastLocal = activeFile;
                    configDs.save("configuration", configuration);
                }
            }
            if (ikogData) {
                nvm.tasks = new TaskList(ikogData.tasks);
                nvm.abbreviations = new Alias(ikogData.abbreviations);
            } else {
                nvm.tasks = new TaskList();
                nvm.abbreviations = new Alias({
                    '@C':'@Computer', '@D':'@Desk', '@E':'@Errand', '@H': '@Home',
                    '@I':'@Internet', '@L':'@Lunch', '@M':'@Meeting', '@N': '@Next',
                    '@O': '@Other', '@P':'@Phone', '@PW':'@Password',
                    '@S': '@Someday/maybe', '@W4': '@Waiting_for', '@W': '@Work' 
                });
            }
            nvm.tasks.sort();
            for (var con = 0; con < nvm.tasks.tasks.length; con++) {
                _updateListGroups(nvm.tasks.tasks[con]);
            }
            terminal.print("Using " + dataStore.getStoreName()
                + ":" + dataStore.getPath());
            _setPrompt();
            _showCurrent();
            terminal.block(false);
            if (callback) {
                callback();
            } 
        });
    }

    function _cacheData(name, callback) {
        var saved = false;
        terminal.block(true);
        dataStore.save(name || dataStore.getFileName(), nvm, function(ok) {
            if (!ok) {
                terminal.error("Problem caching data");
            } else {
                if (!dataStore.isCached) {
                    terminal.print("Save complete."); // in case store doesn't bother caching
                    _setDirty(false);
                } else {
                    terminal.print("Cached.");
                }
                saved = true;
            }
            terminal.block(false);
            if (callback) {
                callback(ok);
            }
        });
    }


    function _makeFileNameSafe(name) {
        return name.replace(/[^\w\.]/g,"_")
    }

    function _saveData(name, callback) {
        var saved = false;
        terminal.print("Saving data.")
        terminal.block(true);
        var filename = name || dataStore.getFileName();
        filename = _makeFileNameSafe(filename);
        dataStore.forcedSave(filename, nvm, function(ok) {
            if (!ok) {
                terminal.error("Problem saving data");
            } else {
                terminal.print(filename + " saved.")
                saved = true;
                _setDirty(false);
            }
            terminal.block(false);
            if (callback) {
                callback(ok);
            }
        });
    }

    function _setPrompt() {
        if (configuration.console) {
            if (dataStore && dataStore.getId) {
                terminal.setPrompt(dataStore.getId() + ":~ >");
            } else {
                terminal.setPrompt("root@ikog:~ >");
            }
        } else {
            terminal.setPrompt("Task/command:");
        }
    }
    
    function _getStyleSheet(path) {
        if (path === "") {
            $("#styleOverride").text(""); // default 
            terminal.scrollIntoView("");
        } else {
            $.get(path, function(response){
               $("#styleOverride").text(response); 
               terminal.scrollIntoView("");
            });
        }
    }
    function _setConsole(consoleMode) {
        if (consoleMode) {
            _getStyleSheet("styles/ikog.css");
            //$("link[href='styles/ikog_conventional.css']").attr('href', 'styles/ikog.css');
        } else {
            _getStyleSheet("styles/ikog_conventional.css");
            //$("link[href='styles/ikog.css']").attr('href', 'styles/ikog_conventional.css');
        }
        configuration.console = consoleMode;
        configDs.save("configuration", configuration);
        _setPrompt();
    }

    function _cmdConsole(data) {
        var con = false;
        if (data.match(/on/i)) {
            con = true;
        } else if (data.match(/off/i)) {
            con = false;
        } else {
            terminal.error("Bad command use Console on or Console off.");
            return;
        }
        
        if (configuration.console == con) {
            terminal.print("Already in that mode.");
        } else {
            _setConsole(con);
        }
    }
    
    function _cmdExport(data) {
        new Confirm().wait(
            "The export function should open up a dialog asking if you want "
            + "to open or save the file. Select save. Note that this probably "
            + "won't work with IE. Also Firefox seems not to save the file if "
            + "you don't include the file extension - browsers eh. :). Press "
            + "enter to give it a go.",
            function() {
                exporter.exportTasks(nvm);
            }
        );
    }

    function _cmdImport(data) {
        exporter.importTasks(nvm);
    }

    function _cmdAutosave(data) {
        var as = false;
        if (data.match(/on/i)) {
            as = true;
        } else if (data.match(/off/i)) {
            as = false;
        } else {
            terminal.error("Bad command use Autosave on or Autosave off.");
            return;
        }

        if (configuration.autosave == as) {
            terminal.print("Autosave is already " + (as ? "on" : "off"));
            return;
        }
        configuration.autosave = as;
        configDs.save("configuration", configuration);
        terminal.print("Autosave is now " + (as ? "on" : "off"));
        _warnAutosave();
        _setDirty(isDirty);
    }

    function _cmdClearTasks(data) {
        if (data && data.length > 0) {
            terminal.error("Incorrect use. CLEAR");
            return;
        }
        new Confirm().yesOrNo("Are you sure you want to delete all your tasks?",
            function() {
                nvm.tasks.clear();
                currentIndex = 0;    
            },
            function() {
                terminal.print("Your tasks have been left untouched.");
            }        
        );
    }

    function _cmdTerms(data) {
        window.open("terms.html", "_blank");
    }

    function _cmdWeb(data) {
        window.open("http://cuckooswearblack.com", "_blank");
    }

    function _cmdClear(data) {
        if (data && data.length > 0) {
            terminal.error("Incorrect use. CLEARSCREEN");
            return;
        }
        terminal.clear();
    }

    function _cmdTimer(data) {
        if (data && data.length > 0) {
            // not really a timer so try add
            _cmdAdd("2 " + data);
        } else {
            new GtdTimer(2).start();
        }
    }

    function _editTask(id, task, secret) {
        terminal.setInput(new TaskRenderer(id, task)
                .editable(secret));
    }
    
    function _cmdEdit(data) {
        var id = _getTaskId(data);
        if (id < 0) {
            terminal.error("Incorrect use. EDIT N");
        } else {
            var task = nvm.tasks.getAt(id);
            if (task.hasSecret()) {
                decryptor.setTask(id, task)
                decryptor.process(function(data) {
                    _editTask(id, task, data);
                });
            } else {
                _editTask(id, task, null);
            }
        }
    }

    function _cmdRep(data) {
        var match = data.match(/(.+?)\s+(.*)/);
        if (!match) {
            terminal.error("Incorrect use. REP N new task");
            return;
        }
        var id = _getTaskId(match[1], false);
        if (id >= 0) {
            var task = new Task(nvm.abbreviations.apply(match[2]));
            nvm.tasks.replace(task, id);
            _updateListGroups(nvm.tasks.tasks[id]);
            _setDirty(true);
        }
    }

    function _cmdExtend(data) {
        var match = data.match(/(.+?)\s+(.*)/);
        if (!match) {
            terminal.error("Incorrect use. EXTEND N modifications");
            return;
        }
        var id = _getTaskId(match[1]);
        if (id >= 0) {
            var task = new Task(nvm.abbreviations.apply(match[2]), true);
            nvm.tasks.extend(task, id);
            _updateListGroups(nvm.tasks.tasks[id]);
            _setDirty(true);
        }
    }

    function _cmdMod(data) {
        var match = data.match(/(.+?)\s+(.*)/);
        if (!match) {
            terminal.error("Incorrect use. MOD N modifications");
            return;
        }
        var id = _getTaskId(match[1]);
        if (id >= 0) {
            var task = new Task(nvm.abbreviations.apply(match[2]), true);
            nvm.tasks.modify(task, id);
            _updateListGroups(nvm.tasks.tasks[id]);
            _setDirty(true);
        }
    }

    function _cmdUse(data) {
        if (/^local$/i.test(data)) {
            if (!configuration.useDropbox) {
                terminal.error("The application is already configured to use"
                        + " local storage.");
            } else {
                _switchDatastoreConfirm(false);
            }    
        } else if (/^dropbox$/i.test(data)) {
            if (configuration.useDropbox) {
                terminal.error("The application is already configured to use"
                        + " Dropbox.");
            } else {
                _switchDatastoreConfirm(true);
            }    
        } else {
            terminal.error("Incorrect use. USE local | dropbox");
        }
    }

    function _switchDatastoreConfirm(useDropbox) {
        if (isDirty) {
            new Confirm().yesOrNo("You have unsaved changes. Save now?",
                function() {
                    _saveData(name, function(ok) {
                        if (ok) {
                            _switchDatastore(useDropbox);
                        }
                    })
                },
                function() {
                    _killCache();
                    _switchDatastore(useDropbox);
                }
            );
        } else {
            _switchDatastore(useDropbox);
        }
    }

    function _switchDatastore(useDropbox) {
        configuration.useDropbox = useDropbox;
        configDs.save("configuration", configuration);
        terminal.print("Reloading");
        var url = window.location.href.match(/[^#?]*/)[0];
        window.location.replace(url);
    }


    function _cmdHelp(data) {
        terminal.print(new iKogHelp().render(data));
    }

    function _cmdSignOut(data) {
        dataStore.signOut(function(ok) {
            terminal.print(ok ?
                "You have been logged out." : "You remain logged in.");
        });
    }
    
    function _cmdDel(data) {
        new Confirm().yesOrNo("Are you sure you want to delete store " + data,
            function(){
                if (dataStore.del(data)) {
                    terminal.print("Removed store " + data);
                }
        });
    }
    function _cmdDir(data) {
        new DataStoreRenderer().render(dataStore, function(html) {
            terminal.print(html);
        })
    }

    function _cmdOpen(data) {
        data = _makeFileNameSafe(data);
        if (dataStore.getFileName() == data) {
            terminal.print(data + " is already loaded.");
            return;
        }       
       autoShowCurrent = false; 
        if (isDirty) {
            new Confirm().yesOrNo("You have unsaved changes. Save now?",
                function() {
                    _saveData(name, function(ok) {
                        if (ok) {
                            _loadData(data);
                        }
                    })
                },
                function() {
                    _killCache();
                    _loadData(data);
                }
            );
        } else {
            _killCache();
            _loadData(data);
        }
    }

    function _moveTo(data, dir) {
        var id = _getTaskId(data);
        if (id >= 0) {
            var dest = dir == 0 ? 0 : id + dir
            nvm.tasks.move(dest, id);
            _setDirty(true);
        }
    }

    function _cmdFilter(data) {
        filter.setFilter(nvm.abbreviations.apply(data));
        _skipToViewable();
    }

    function _cmdFirst(data) {
        _moveTo(data, 0);
    }

    function _cmdUp(data) {
       _moveTo(data, -1);
    }

    function _cmdDown(data) {
        _moveTo(data, +1)
    }

    function _cmdReviewOn() {
        if (configuration.reviewMode) {
            terminal.print("You are already in review mode.");
        } else {
            terminal.print(
                "In review mode. Enter advances to next task.");
            configuration.reviewMode = true;
            configDs.save("configuration", configuration);
        }
    }

    function _cmdReviewOff() {
        if (!configuration.reviewMode) {
            terminal.print("Review mode is already off.");
        } else {
            terminal.print(
                "Review mode off. Enter does not advance to next task.");
            configuration.reviewMode = false;
            configDs.save("configuration", configuration);
        }
    }

    function _cmdReview(data) {
        if (data.match(/on/i)) {
            _cmdReviewOn();
        } else if (data.match(/off/i)) {
            _cmdReviewOff();
        } else {
            terminal.error("Bad command use Review on or Review off.");
        }
    }
    function _cmdNext() {
        _moveIndex(false);
        _skipToViewable(false);
    }

    function _cmdPrev() {
        _moveIndex(true);
        _skipToViewable(true);
    }

    function _cmdTop(lines) {
        lines = _getInt(lines, 0);
        if (lines > 0) {
            terminal.print(new TaskListRenderer(nvm.tasks, filter).render(lines));
        }
        currentIndex = 0;
        _skipToViewable(false);
    }

    function _cmdGo(data) {
        var id = _getTaskId(data);
        if (id <= 0 || nvm.tasks.getLength() == 0) {
            currentIndex = 0;
        } else if (id >= nvm.tasks.getLength()) {
            currentIndex = nvm.tasks.getLength() - 1;
        } else {
            currentIndex = id;
        }
    }

    function _moveIndex(backwards) {
        if (backwards) {
            if (currentIndex > 0) {
                currentIndex--;
            } else {
                currentIndex = nvm.tasks.getLength() - 1;
            }
        } else {
            if (currentIndex < nvm.tasks.getLength() - 1) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
        }
    }

    function _skipToViewable(backwards) {
        var startIndex = currentIndex;
        if (!filter) {
            return;
        }
        do {
            if (filter.isViewable(nvm.tasks.tasks[currentIndex])) {
                return;
            }
            _moveIndex(backwards);
        } while (startIndex != currentIndex);
        terminal.print("Failed to find anything matching your filter "
                + filter.getFilter());
    }

    function _cmdDump() {
        terminal.print(JSON.stringify(nvm.tasks));    
    }
    function _cmdSave(data) {
        _saveData(data);
    }

    function _cmdImmediate(data) {
        _cmdAddTask(data, true);
    }

    function _cmdListCmd(data) {
        var html = "<ul class='command-list bullet-free'>";
        for (cmd in processors) {
            html += "<li>" + cmd;
        }
        html += "</ul>";
        terminal.print(html);
    }

    function _cmdAbbrev(data) {
        var match = (/^\s*(\S+)\s*(.*)$/).exec(data)
        if (!match || match[1] == "") {
            terminal.error( "I didn't understand the abbreviation. "
                    + "Should be ABBREV short expanded");
            return;
        }
        if (match[1] == "?") {
            terminal.print(new AliasesRenderer(nvm.abbreviations).render());
            return;
        }
        if (match[2] == "") {
            nvm.abbreviations.remove(match[1]);
            terminal.print("Removed abbreviation " + match[1]);
        } else {
            nvm.abbreviations.add(match[1], match[2]);
        }
        _setDirty(true);
    }

    function _cmdNote(data) {
        _cmdAddTask("@Note #0 " + data);
    }
    function _cmdAdd(data) {
        _cmdAddTask(data, false);
    }
    function _cmdAddTask(data,top) {
        if (!data || data.length == 0) {
            terminal.print("Nothing to add.");
        } else { 
            var task = new Task(nvm.abbreviations.apply(data));
            _updateListGroups(task);
            if (top) {
                nvm.tasks.insert(task, 0)
            } else {
                nvm.tasks.add(task);
            }
            _setDirty(true);
        }
    }

    function _updateListGroups(task) {
        contexts.add(task.contexts);
        projects.add(task.projects);
        if (task.dueDate) {
            var dt = task.dueDate.toISOString().substring(0, 10);
            dates.add(dt);
        }
        contexts.sort();
        projects.sort();
        dates.sort(function(a,b) {
            return a.valueOf() - b.valueOf();
        });
    }

    function _cmdShow(data) {
        var id = _getTaskId(data);
        if (id >= 0) {
            decryptor.setTask(id, nvm.tasks.getAt(id))
            decryptor.process();
        }
    }


    function _getInt(data, def) {
        if (!/^\d+$/.test(data)) {
            return def;
        }
        return parseInt(data, 10);
    }

    function _getTaskId(data) {
        if (/^\s*(\^|this|\.)\s*$/i.test(data)) {
            return currentIndex;
        }
        var val = _getInt(data, -1);
        if (val == -1) {
            terminal.error("Unrecognised id");
        } else if (val >= nvm.tasks.length) {
            terminal.error("Task " + data + " does not exist.");
        }
        return val; 
    }

    function _doKill(id) {
        nvm.tasks.remove(id);
        terminal.print("Task "+ id + " removed.");
        _setDirty(true);
    }

    function _killCache() {
        dataStore.killCache();
        isDirty = false;
        console.log("Killed cache");
    }

    function _killAllCaches() {
        new Confirm().yesOrNo("Are you sure you want to delete all local "
            +"caches?",
            function() {
                dataStore.killAllCaches();
                isDirty = false;
                window.location.reload();
            },
            function() {
                terminal.print("All the caches have been left in place.");
            });
    }

    function _cmdKill(data) {
        if (/^\s*all caches\s*$/i.test(data)) {
            _killAllCaches();
            return;
        }
        if (/^\s*cache\s*$/i.test(data)) {
            _killCache();
            window.location.reload();
            return;
        }

        var id = _getTaskId(data);
        if (id >= 0) {
            if (id == currentIndex) {
                _doKill(id);
            } else {
                terminal.print(new TaskRenderer(id,
                    nvm.tasks.getAt(id)).verbose());
                new Confirm().yesOrNo("Are you sure you want to delete task " + id,
                    function() {
                        _doKill(id);
                        _showCurrent();
                });
            }
        }
    }

    function _cmdListByDate() {
        _cmdListByCollection(dates, ":d")
    }

    function _cmdListByProject(data) {
        _cmdListByCollection(projects, "");
    }

    function _cmdListByContext(data){
        _cmdListByCollection(contexts, "");
    }
    function _cmdListByCollection(collection, prefix) {
       var items = collection.getItems();
       for (var c = 0; c < items.length; c++) {
           console.log(items[c]);
           terminal.print(new TaskListRenderer(nvm.tasks,
                       new Filter(prefix + items[c], items[c]))
                .render(-1, true));
       } 
    }

    function _cmdList(data) {
        terminal.print(new TaskListRenderer(nvm.tasks,
                    data && data != ""
                    ? new Filter(nvm.abbreviations.apply(data))
                    : filter).render());
    }

    function _showCurrent() {
        if (nvm.tasks.getLength() > 0) {
            if (filter.isActive()) {
                terminal.print(new FilterRenderer(filter).render(false));
            }

            if (filter.isViewable(nvm.tasks.getAt(currentIndex))) {
                terminal.print(new TaskRenderer(currentIndex,
                    nvm.tasks.getAt(currentIndex)).verbose());
            } else {
                "No task matching filter";
            }
        }
    }

    function _applyAbbreviations(task) {
        nvm.abbreviations.apply(task.getContexts());
    }

    function _processCommand(rawentry) {
        rawentry = rawentry.trim();
        if (rawentry == "") {
            if (configuration.reviewMode) {
                _cmdNext();
                _showCurrent();
                return;
            }
        }
        
        entry = encryptor.process(rawentry);
        if (!entry) {
            return;
        }
        
        var match = (/^\s*(\S+)\s*(.*)$/).exec(entry)
        var fn = processors[commandAliases.get(match[1].toUpperCase())];
        if (fn) {
            fn(match[2]);
        } else if (entry && entry.length > 10) {
            _cmdAdd(entry); // auto add
        } else {
            terminal.print ("Unrecognised command");
        }
        if (!terminal.isRunningCommand() && autoShowCurrent) {
            _showCurrent();
        }
        autoShowCurrent = true; 
        return false;
    }

    function _isDirty() {
        return isDirty;
    }
    function _setDirty(state) {
        isDirty = state;
        if (configuration.autosave && isDirty) {
            if (dataStore.getStoreName() == "Dropbox") {
                _cacheData();
            } else {
                _saveData();
            }
        }
        terminal.setDirty(isDirty);
    }

    // initialisation
    return {
        init: _init,
        process: _processCommand,
        abbreviate: _applyAbbreviations,
        isDirty: _isDirty,
        setDirty: _setDirty,
        killCache: _killCache
    }
})();



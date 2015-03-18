// Script file
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-11-07

var terminal = (function() {
    var shell = null;
    var msgPrompt = ">>>";
    var cachedPrompt = "";
    var markedPos = -1;
    var passwordActive = false;
    var maxlength = 20000;
    var tag = "<!--#-->";

    function _scroll() {
        $('#mockScreenContainerEnd')[0].scrollIntoView(false);
        $('#commandEntryContainer')[0].scrollIntoView(false);
        if (passwordActive) {
            $('#pwEntry').focus();
        } else {
            $('#commandLineEntry').focus();
        }
    }    
    function _print(data) {
        var txt = $('#mockScreen').html();
        if (txt.length > maxlength) {
            txt = txt.substring(txt.indexOf(tag) + tag.length); 
        }
        $('#mockScreen').html(txt + data + "<br>" + tag);
        _scroll();
    }
    function _clear() {
        $('#mockScreen').html("");
        $('#commandLineEntry').val("");
    }

    function _setShell(cmdShell) {
        var oldShell = shell;
        shell = cmdShell;
        return oldShell;
    }

    function _setPrompt(msg) {
        msgPrompt = msg;
        $('#prompt-text').html(msg);
    }
	
    function _error(data) {
        _print("<span class='error'>" + data + "</span>");
    }
    
    function _enter() {
        var entry;
        if (passwordActive) {
            entry = $('#pwEntry').val();
            entry = new Parser().makeSafe(entry);
            var obf = new Array(entry.length + 1);
            terminal.print(msgPrompt + " " + obf.join('*'));
        } else {
            entry = $('#commandLineEntry').val();
            entry = new Parser().makeSafe(entry);
            terminal.print("<span class='prompt'>" + msgPrompt + "</span>" +  entry);
        }
        $('#commandLineEntry, #pwEntry').val("");
        if (shell) {
            shell.process(entry);
        }
    }

    function _running(state) {
        if (state) {
            $('#prompt').hide();
            cachedPrompt = msgPrompt;
            _setPrompt("");
        } else {
            $('#prompt').show();
            _setPrompt(cachedPrompt);
        }
    }

    function _isRunningCommand() {
        return msgPrompt == "";
    }

    function _mark() {
        markedPos = $('#mockScreen').html().length;
    }

    function _clearToMark() {
        if (markedPos >= 0) {
            $('#mockScreen').html($('#mockScreen').html()
                .substring(0, markedPos));
        }
        markedPos = -1;
    }

    function _isPassword() {
        return passwordActive;
    }

    function _password(state) {
        passwordActive = state;
        if (state) {
            $('#commandLineEntry').hide();
            $('#pwEntry').show();
            $('#pwEntry').focus();

        } else {
            $('#commandLineEntry').show();
            $('#pwEntry').hide();
            $('#commandLineEntry').focus();
        }
    }

    function _block(state) {
        $("#commandLineEntry, #pwEntry").prop("readonly",state);
    }

    function _setInput(data) {
        if (passwordActive) {
            $('#pwEntry').val(data);
        } else {
            $('#commandLineEntry').val(data);
        }
    }

    function _setDirty(state) {
        $('#dirty').html(state ? "!" : " ");
    }

    return {
        setShell: _setShell,
        print: _print,
        clear: _clear,
        enter: _enter,
        setPrompt: _setPrompt,
        error: _error,
        runningCommand: _running,
        isRunningCommand: _isRunningCommand,
        mark: _mark,
        clearToMark: _clearToMark,
        isPassword : _isPassword,
        enterPassword : _password,
        block: _block,
        setInput: _setInput,
        setDirty: _setDirty,
        scrollIntoView: _scroll
    }
})();

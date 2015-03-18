// Script file
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-11-07
//

function TaskList(data) {
    this.tasks = [];
    if (data && data.tasks) {
        for (var t = 0; t < data.tasks.length; t++) {
            this.tasks.push(new Task(data.tasks[t]));
        }
    }
}

TaskList.prototype.modify = function(task, index) {
    if (index >= 0 && index < this.tasks.length) {
        this.tasks[index].modifyExtend(task, false);
        this.sort();    
    }
}

TaskList.prototype.extend = function(task, index) {
    if (index >= 0 && index < this.tasks.length) {
        this.tasks[index].modifyExtend(task, true);
        this.sort();    
    }
}
TaskList.prototype.replace = function(task, index) {
    if (index >= 0 && index < this.tasks.length) {
        this.tasks[index] = task;
        this.sort();    
    }
}

TaskList.prototype.add = function(task) {
    this.tasks.push(task);
    this.sort();
}

TaskList.prototype.insert = function(task, index) {
    this.tasks.splice(index, 0, task);
    this.sort();
}

TaskList.prototype.remove = function(index) {
    if (index >= 0 && index < this.tasks.length) {
        this.tasks.splice(index, 1);
        this.sort();    
    }
}

TaskList.prototype.move = function(dest, source) {
    if (dest < 0 || dest >= this.tasks.length ||
            source < 0 || source >= this.tasks.length) {
        return;
    }
    var tmp = this.tasks[source];
    this.tasks.splice(source, 1);
    this.tasks.splice(dest, 0, tmp);
}

TaskList.prototype.getAt = function(index) {
    return this.tasks[index];
}

TaskList.prototype.getAll = function(index) {
    return this.tasks;
}

TaskList.prototype.getLength = function() {
    return this.tasks.length;
}

TaskList.prototype.sort = function() {
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    this.tasks.sort(function(a, b) {
        return b.effectivePriority(now) - a.effectivePriority(now);
    });
}

TaskList.prototype.clear = function() {
    this.tasks = [];
}

TaskList.prototype.addTasks = function(data) {
    for (var n = 0; n < data.length; n++) { 
        this.tasks.push(new Task(data[n])); 
        console.log("add " + data[n].content);
    }
    this.sort();
}

function Task(data, noAutoContext) {
    this.content = "";
    this.secret = "";
    this.contexts = [];
    this.projects = [];
    this.priority = 5;
    this.dueDate = null;
    this.created = new Date();
    this.isMeeting = false;
    if (typeof data === "string") {
        this._build(data, noAutoContext);
        this.created = new Date();
    } else {
        for (var el in data) {
            if (el == "dueDate" || el == "created") {
                this[el] = data[el] ? new Date(data[el]) : null;
            } else {
                this[el] = data[el];
            }
        }
    }
    if (this.contexts == null) {
        this.contexts = [];
    }
    if (this.projects == null) {
        this.projects = [];
    }
}

Task.prototype.modifyExtend = function(task, extend) {
    if (task.content && task.content.length > 0) {
        this.content = extend ? this.content + " " + task.content
            : task.content;
    }

    if (task.secret && task.secret.length > 0) {
        if (!extend || !this.hasSecret()) {
            this.secret = task.secret;
        } else {
            terminal.error("You cannot extend a secret text. Your new secret will be ignored.");
        }
    }

    if (task.priority) {
        this.priority = task.priority;
    }

    if (task.contexts && task.contexts.length > 0) {
        if (extend) {
            for (var con = 0; con < task.contexts.length; con++) {
                if (this.contexts.indexOf(task.contexts[con]) < 0) {
                    this.contexts.push(task.contexts[con]);
                } 
            }
        } else {
            this.contexts = task.contexts
        }
    }

    if (task.projects && task.projects.length > 0) {
        if (extend) {
            for (var prj = 0; prj < task.projects.length; prj++) {
                if (this.projects.indexOf(task.projects[prj]) < 0) {
                    this.projects.push(task.projects[prj]);
                } 
            }
        } else {
            this.projects = task.projects
        }
    }

    if (task.dueDate) {
        this.dueDate = task.dueDate;
    }

    if (!this.contexts) {
        this.contexts = noAutoContext ? [] : ['@Anywhere'];
    }
    if (this.contexts.indexOf("@Meeting") >= 0) {
        this.isMeeting = true;
    }
}

Task.prototype.effectivePriority = function(now) {
    var eff = this.priority;
    if (this.contexts.indexOf("@Note") >= 0) {
        return 0;
    }
    if (this.dueDate) {
        if (this.dueDate > now) {
            return 0;
        } else {
            eff += this.isMeeting ? 12 : 11;
        }
    }
    return eff;
}

Task.prototype._extract = function(expr) {
    var res = this.content.match(expr);
    var sub = "";
    if (res && res.length > 0) {
        for (var e = 0; e < res.length; e++) {
            if (/ $/.test(res[e])) {
                sub = " ";
            }
            res[e] = res[e].trim();
        }
        this.content = this.content.replace(expr, sub).trim();
    }
    return res;
}

Task.prototype.hasSecret = function() {
    return (this.secret && this.secret.length > 0);
}

Task.prototype.properCase = function(data, offset) {
    return data.substring(0, offset) + data.charAt(offset).toUpperCase()
                + data.substring(offset + 1).toLowerCase();
}

Task.prototype._build = function(data, noAutoContext) {
    var parts = data.split("<secret>");
    this.content = parts[0];
    this.secret = parts.length > 1 ? parts[1] : "";

    this.contexts = this._extract(/(?:^|\s)@\w+?\b/g);
    this.projects = this._extract(/(?:^|\s)\:p\w+?\b/g);
    var priority = this._extract(/(?:^|\s)#\d+?\b/);
    var dates = this._extract(/(?:^|\s)\:d[-+\/\d]+?(?:$|\s)/);

    if (!this.projects) {
        this.projects = [];
    } else {
        for (var p = 0; p < this.projects.length; p++) {
            this.projects[p] = this.properCase(this.projects[p], 2)
        }
    }
    if (!this.contexts) {
        this.contexts = noAutoContext ? [] : ['@Anywhere'];
    }
    if (this.contexts.indexOf("@Meeting") >= 0) {
        this.isMeeting = true;
    }
    for (var con = 0; con < this.contexts.length; con++) {
        this.contexts[con] = this.properCase(this.contexts[con], 1);
    }

    if (priority) {
        this.priority = parseInt(priority[0].substring(1), 10);
        if (this.priority < 0 ) {
            this.priority = 0;
        } else if (this.priority > 10) {
            this.priority = 10;
        }
    }
    if (dates) {
        this.dueDate = this.parseDate(dates[0].substring(2));
        this.dueDate.setHours(0, 0, 0, 0);
        if (this.contexts.indexOf('@Date') < 0) {
            this.contexts.push("@Date");
        }
    }
}

Task.prototype.parseDate = function(data) {
    var today = new Date();
    try {
        if (/^\+\d+/.test(data)) {
            return new Date(today.getTime()
                    + 24*3600000 * parseInt(data.substring(1)));
        } else {
            var match =
                data.match(/(\d+?)(?:(?:-|\/)(\d+?))?(?:(?:-|\/)(\d+))?$/);
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = today.getDate();
            if (match[3]) {
                day = parseInt(match[3], 10);
                month = parseInt(match[2], 10)- 1;
                year = parseInt(match[1], 10);
            } else if (match[2]) {
                day = parseInt(match[2], 10);
                month = parseInt(match[1], 10)- 1;
            } else {
                var reqday = parseInt(match[1], 10);
                if (reqday < day) {
                    month++;
                }    
                day = reqday;
            }
            return new Date(year, month, day);
        }
    } catch(err) {
        terminal.error("Unable to parse date " + data + ": " + err);
        return null;
    }
}

Task.prototype.toString = function() {
    var msg = this.content + " #" + this.priority;
	
    for (var n = 0; n < this.contexts.length; n++) {
	    msg += " " + this.contexts[n]
	}
    if (this.projects && this.projects.length >0) {
        msg += " Projects: ";
        for (var n = 0; n < this.projects.length; n++) {
            msg += " " + this.projects[n]
        }
    }
	return msg;
}

Task.prototype.toLine = function() {
    var line = "";
    for (var n = 0; n < this.contexts; n++) {
        line += this.contexts[n] + " "
    }
    line += this.content;
    return line;
}

Task.prototype.getContexts = function() {
    return this.contexts;
}

function TaskListRenderer(list, filter) {
    this.tasks = list.getAll();
    this.filter = filter;
}

TaskListRenderer.prototype.render = function (limit, terseFilter) {
    var html = "";
    html += new FilterRenderer(this.filter).render(terseFilter);
    html += "<ul class='task-list bullet-free'>"
    var lines = limit == undefined || limit < 0 ? this.tasks.length : limit;
    for (var n = 0; n < lines; n++) {
        var task = this.tasks[n];
        if (this.filter.isViewable(task)) {
            html += "<li>" + new TaskRenderer(n, task).terse();
        }
    }
    html += "</ul>";
    return html;
}
function TaskRenderer(id, task) {
    this.id = id;
    this.task = task;
}

TaskRenderer.prototype.editable = function(secret) {
    
    var txt = "M " + this.id;
    txt += " " + this.task.content;
    txt += " #" + this.task.priority;
    
    for (var c = 0; c < this.task.contexts.length; c++) {
        txt += " " + this.task.contexts[c];
    }
    for (var p = 0; p < this.task.projects; p++) {
        txt += " " + this.task.projects[p];
    }

    if (this.task.dueDate) {
        txt += " :d" + this.task.dueDate.toISOString().substring(0,10);
    }

    if (this.task.secret && secret) {
        txt += " <s>" + secret;
    }
    return txt;
}

TaskRenderer.prototype.terse = function(secret) {
   return this.render("terse-task", secret);
}

TaskRenderer.prototype.verbose = function(secret) {
    return this.render("verbose-task", secret);
}
TaskRenderer.prototype.render = function(clazz, secret) {
    var msg = "<div class = '" + clazz + "'>";
    msg += "<div class='task-id'>"  + (this.id < 10 ? "0" : "") + this.id
        + "</div>"
    msg += "<div class='description'>"
        + new Parser().enhance(this.task.content) + "</div>";

    msg += "<div class='secret'>";
    if (secret) {
        msg += new Parser().enhance(secret);
    } else {
        msg += this.task.secret ? "***" : ""
    }
    msg += "</div>";
    msg += "<div class='priority'>" + (this.task.priority < 10 ? "0": "")
        + this.task.priority + "</div>"; 
    msg += "<ul class='contexts bullet-free'>";
    for (var c = 0; c < this.task.contexts.length; c++) {
        msg += "<li>" + this.task.contexts[c] + " ";
    }
    msg += "</ul>"
    msg += "<ul class='projects bullet-free'>";
    for (var p = 0; p < this.task.projects.length; p++) {
        msg += "<li>" + this.task.projects[p].substring(2) + " ";
    }
    msg += "</ul>";
    if (this.task.dueDate) {
        msg += "<div class='due-date'>" + this.task.dueDate.toDateString()
            + "</div>";
    }
    msg += "<div class='created-date'>"+ this.task.created.toDateString()
        + "</div>";
    msg += "</div>";
    return msg;
}

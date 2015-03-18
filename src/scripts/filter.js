// Script file
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-11-08
function Filter(filter, name) {
    this.setFilter(filter, name);
}

Filter.prototype.getName = function() {
    return this.name;
}

Filter.prototype.getFilter = function() {
    return this.filter
}

Filter.States = {
    'AND' : 0,
    'OR' : 1,
    'NOT': 2
};

Filter.prototype._buildFilters = function(filter) {
    var words = filter.match(/(\S+)/g);
    var state = Filter.States.AND;
    var data = [[], [], []];
    for (var w = 0; w < words.length; w++) {
        var word = words[w].trim()
        if (/^and$/i.test(words[w])) {
            state = Filter.States.AND;
        } else if (/^or$/i.test(words[w])) {
            state = Filter.States.OR;
        } else if (/^not$/i.test(words[w])) {
            state = Filter.States.NOT;
        } else {
            data[state].push(words[w]); 
        } 
    }

    return data;
}
Filter.prototype.setFilter = function(filter, name) {
    this.filter = filter || "";
    this.name = name || filter;
    this.filterTask = null;
    this.filterNotTask = null;
    this.filterOrTask = null;
    if (this.filter == "") {
        return;
    }
    var data = this._buildFilters(this.filter);
    
    this.filterTask = data[Filter.States.AND].length > 0  ? new Task(data[Filter.States.AND].join(" "), true) : null;
    this.filterOrTask = data[Filter.States.OR].length > 0 ? new Task(data[Filter.States.OR].join(" "), true) : null;
    this.filterNotTask = data[Filter.States.NOT].length > 0 ? new Task(data[Filter.States.NOT].join(" "), true): null;
}

Filter.prototype.isActive = function() {
    return this.filterTask != null || this.filterOrTask != null 
        || this.filterNotTask != null;
}

Filter.prototype.isViewable = function(task) {
    return (this._testIsViewableAnd(this.filterTask, task, false) 
            && this._testIsViewableAnd(this.filterNotTask, task, true)) 
            || this._testIsViewableOr(this.filterOrTask, task);
}

Filter.prototype.test = function(state, negated) {
    return negated ? !state : state;
}

Filter.prototype.areDatesEqual = function(dt1, dt2) {
    var t1 = dt1 ? Math.round(dt1.getTime() / 1000) : 0;
    var t2 = dt2 ? Math.round(dt2.getTime() / 1000) : 0;
    return t1 == t2
}

Filter.prototype._testIsViewableOr = function(filterTask, task) {
    if (filterTask == null) {
        return false;
    }

    if (filterTask.dueDate) {
        if (this.areDatesEqual(task.dueDate, filterTask.dueDate)) {
            return true;
        } 
    }
    
    if (filterTask.contexts && filterTask.contexts.length > 0) {
        if (this.contains(task.contexts, filterTask.contexts)) {
            return true;
        }
    }

    if (filterTask.projects && filterTask.projects.length > 0) {
        if (this.contains(task.projects, filterTask.projects)) {
            return true;
        }
    }

    var wordsFilter = filterTask.content.match(/\S+/g);
    var wordsTask = task.content.match(/\S+/g);
    if (wordsFilter && wordsFilter.length >0 && wordsFilter[0].length > 0
            && this.contains(wordsTask, wordsFilter)) {
        return true;
    }
    return false;    
}

Filter.prototype._testIsViewableAnd = function(filterTask, task, negated) {
    if (filterTask == null) {
        return true;
    }

    if (filterTask.dueDate) {
        if (this.test(!(this.areDatesEqual(task.dueDate, filterTask.dueDate)),
                    negated)) {
            return false;
        } 
    }
    
    if (filterTask.contexts && filterTask.contexts.length > 0) {
        if (this.test(!this.contains(task.contexts, filterTask.contexts),
          negated)) {
            return false;
        }
    }

    if (filterTask.projects && filterTask.projects.length > 0) {
        if (this.test(!this.contains(task.projects, filterTask.projects),
          negated)) {
            return false;

        }
    }

    var wordsFilter = filterTask.content.match(/\S+/g);
    var wordsTask = task.content.match(/\S+/g);
    if (wordsFilter && wordsFilter.length >0 && wordsFilter[0].length > 0
            && this.test(!this.contains(wordsTask, wordsFilter), negated)) {
        return false;
    }
    return true;    
}

Filter.prototype.contains = function(target, filter) {
    for (var el = 0; el < filter.length; el++) {
        if (target.indexOf(filter[el]) < 0) {
            return false;
        }
    }
    return true;
}

function FilterRenderer(filter) {
    this.filter = filter;
}

FilterRenderer.prototype.render = function(terse) {
    var html = "";
    if (this.filter.getFilter()) {
        html +="<div class='"
            + (terse ? "terse-filter" : "filter") + "'>"
            + this.filter.getName() + "</div>";
    }
    return html;
}

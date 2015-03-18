// Script file
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-11-08
function Collection() {
    this.items =[];
}

Collection.prototype.add = function(collection) {
    if (typeof collection === "string") {
        if (this.items.indexOf(collection) < 0) {
            this.items.push(collection);
        }
    } else {
        for (var item = 0; item < collection.length; item++) {
            if (this.items.indexOf(collection[item]) < 0) {
                this.items.push(collection[item]);
            }
        }
    }
}

Collection.prototype.getItems = function() {
    return this.items;
}

Collection.prototype.get  = function(n) {
    return this.items[n];
}

Collection.prototype.sort = function(fun) {
    this.items.sort(fun);
}

function Alias(init) {
    if (init.aliases) {
        this.aliases = init.aliases;
    } else {
        this.aliases = init || {};
    }    
}

Alias.prototype.remove = function(key) {
    key = key.toUpperCase();
    if (key in this.aliases) {
        delete this.aliases[key];     
    } 
}

Alias.prototype.add = function(key, value) {
    key = key.toUpperCase();
    if (value == "" && (key in this.aliases)) {
        delete this.aliases[key];     
    } else {
        this.aliases[key] = value;
    }
}

Alias.prototype.get = function(key) {
    akey = key.toUpperCase();
    if (akey in this.aliases) {
        return this.aliases[akey];
    }
    return key;
}

Alias.prototype.apply = function(data) {
    if (typeof data === "string") {
        var obj = this;
        return data.replace(/\S+/g, function(txt) {
            return obj.get(txt);
        });
    } else {
        for (var el in data) {
            data[el] = this.get(data[el]);
        }
        return data;
    }
}

Alias.prototype.merge = function(data) {
    for (al in data) {
        this.add(al, data[al]);
    }
}

function AliasesRenderer(alias) {
    this.aliases = alias.aliases;
}    

AliasesRenderer.prototype.render = function() {
    var html = "<ul class = 'alias-list bullet-free'>"
    for (al in this.aliases) {
        html += "<li><span>" + al + "</span><span>" + this.aliases[al] + "</span></li>" 
    }
    html += "</ul>";
    return html;
}

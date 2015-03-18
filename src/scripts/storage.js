// Storage routines.
// Author Steve Butler
// Copyright (c) 2012 Steve Butler
// Created 2012-10-31


// DataStoreFactory
function DataStoreFactory(useDropbox) {
    this.useDropbox = useDropbox;
}

DataStoreFactory.prototype.getDataStore = function(callback) {
    if (!this.useDropbox) {
        ds = new DataStoreLocal();
        ds.init(function(ok){
            if (ok) {
                callback(ds);
            } else {
                return null;
            }
        });
        return null;
    }

    var ds = new DataStoreDropbox();
    ds.init(function(ok) {
        if (ok) {
            callback(ds);
        } else {
            ds = new DataStoreLocal();
            ds.init(function(ok){
                if (ok) {
                    callback(ds);
                } else {
                    return null;
                }
            })
        }
    });
}


/** Generic storage file.
 */
function DataStoreFile(name, size, path) {
    this.name = name;
    this.path = path;
    this.size = size;
}

/** Generic datastore. Children must implement
 */
function DataStore(root) {
    this.user = "anon";
    this.root = root || "ikog";
    this.storeName = null;
    this.available = false;
    this.fileName = "tasks";
    this.cached = false;
    this.cacheTag = "ikog-cache";
}

DataStore.prototype.signOut = function(callback) {
    // to override
}
DataStore.prototype.init = function(callback) {
    // to override
}

DataStore.prototype.load = function(item, def, callback) {
    // to override
}

DataStore.prototype.save = function(item, data, callback) {
    // to override
}

DataStore.prototype.del = function(name) {
    // to override
}

DataStore.prototype.getFiles = function() {
    // to override
}

DataStore.prototype.getUser = function() {
    return this.user;
}

DataStore.prototype.setUser = function(user) {
    this.user = user;
}

DataStore.prototype.getPath = function(item) {
    return this.root + "." + this.user + "." + (item ? item : this.fileName);
}

DataStore.prototype.getId = function() {
    return this.fileName + "@" + this.storeName;
}

DataStore.prototype.getStoreName = function() {
    return this.storeName;
}

DataStore.prototype.getFileName = function() {
    return this.fileName;
}

DataStore.prototype.isCached = function() {
    return this.cached;
}

DataStore.prototype.killCache = function() {
    return;
}

DataStore.prototype.forcedSave = function(item, data, callback) {
    this.save(item, data, callback);
}

DataStore.prototype.killAllCaches = function() {
    if (localStorage) {
        var reg = new RegExp("^" + this.cacheTag);
        for (item in localStorage) {
            if (reg.test(item)) {
                delete localStorage[item];
                terminal.print("Deleted cache " + item);
            }
        }
    }
}

function DataStoreLocal(root) {
    this.storeName = "localStorage";
    if (root) {
        this.root = root;
    }
}
DataStoreLocal.prototype = new DataStore();
DataStoreLocal.constructor = DataStoreLocal;


DataStoreLocal.prototype.init = function(callback) {
    this.available = typeof(Storage);
    if (callback) {
        callback(this.available);
    }
}

DataStoreLocal.prototype.signOut = function(callback) {
    terminal.print("Signing out is not applicable to local storage.");
    if (callback) {
        callback(false);
    }
}

DataStoreLocal.prototype.getFiles = function(callback) {
    // to override
    var files = [];
    for (var store in localStorage) {
        var match = /^(\S+)\.\S+\.(\S+)/.exec(store);
        
        if (match && match[1] == this.root) {
            var file = new DataStoreFile(match ? match[2] : "-",
                    localStorage[store].length, store);
            
            files.push(file);
        }
    }
    if (callback) {
        callback(files);
    }
}

DataStoreLocal.prototype.load = function(item, def, callback) {
    var data;
    this.fileName = item;
    try {
        data = localStorage[this.getPath(item)];
        if (data) {
            data = JSON.parse(data);
        } else {
            data = def;
        }
    } catch(err) {
        terminal.error("Unable to load " + item + ": " + err);
        terminal.error(data);
        data =def;
    }
    if (callback) {
        callback(data);
    }
}

DataStoreLocal.prototype.save = function(item, data, callback) {
    var retcode = false;
    if (this.available) {
        try {
            localStorage[this.getPath(item)] = JSON.stringify(data);
            retcode = true;
        } catch(err) {
            terminal.error("Error saving " + item + ": " + err);
        }    
    } 
    if (callback) {
        callback(retcode);
    }
}

DataStoreLocal.prototype.del = function(data) {
    var loc = this.getPath(data);
    if (!localStorage.hasOwnProperty(loc)) {
        terminal.error("local storage does not have store " + data);
        return false;
    }
    delete localStorage[loc];
    return true;
}

// Object does very little but is intended to provide an interface so that it can easily be extended.
function DataStoreDropbox(root) {
    this.storeName = "Dropbox";

    if (root) {
        this.root = root;
    }
    this.cache = new DataStoreLocal(this.cacheTag + "." + this.root);

    this.dropbox = new DropboxStore();
}
DataStoreDropbox.prototype = new DataStore();
DataStoreDropbox.constructor = DataStoreDropbox;


DataStoreDropbox.prototype.init = function(callback) {
    this.cache.init();
    if (!this.cache.available) {
        terminal.error("Unable to set up local storage which is required to cache Dropbox.");
        if (callback) {
            callback(false);
        }
    }

    if (!this.dropbox.init()) {
        if (callback) {
            callback(false);
        }
    }
    var ds = this;
    this.dropbox.auth(function(ok) {
        ds.available = ok;
        if (!ok) {
            callback(ok);
            return;
        } 
        ds.dropbox.getUserName(function(name) {
            ds.user = name;
            if (callback) {
                callback(ok);
            }
        });
    });
}

DataStoreDropbox.prototype.signOut= function(callback) {
    this.dropbox.signOut(callback);
}

DataStoreDropbox.prototype.getFiles = function(callback) {
    this.dropbox.readDir(function(entries) {
        var files = [];
        for (var n = 0; n < entries.length; n++) {
            var file = new DataStoreFile(entries[n], "", "ikog.js/"
                + entries[n]);
            files.push(file);
        }
        if (callback) {
            callback(files);
        }
    });
    return [];
}


DataStoreDropbox.prototype.load = function(item, def, callback) {
    console.log("Loading " + item);
    var ds = this;
    this.fileName = item;
    if (this.cached) {
        this.killCache();
    }
    this.cache.load(item, null, function(data) {
        if (data != null) {
            terminal.error("A cached entry has been found so data will not be "
                + "restored from Dropbox. If this is wrong, you will need to "
                + "delete the cache and reload. Enter <em>KILL CACHE</em> to "
                + "remove the cached entries.");
            ds.cached = true;
            if (callback) {
                callback(data);
            }
        } else {
            ds.dropbox.load(item, function(data) {
                if (data) {
                    data = JSON.parse(data);
                } else {
                    data = def;
                }
                // set the cache to null
                ds.cache.save(item, null, function() {
                    ds.cached = false;
                    if (callback) {
                        callback(data);
                    }
                });
                ds.cached = false;
            });
        }
    });
}

DataStoreDropbox.prototype.killCache = function() {
    if (this.cache) {
        this.cache.del(this.cache.getFileName());
        this.cached = false;
    }
    return;
}

DataStoreDropbox.prototype.save = function(item, data, callback) {
    this.cache.save(item, data, callback);
    this.cached = true;
}

DataStoreDropbox.prototype.forcedSave = function(item, data, callback) {
    var retcode = false;
    var ds = this;
    if (this.available) {
        try {
            this.dropbox.save(item, JSON.stringify(data),
              function(ok) {
                if (ok) {
                    ds.cache.save(item, null);
                    ds.cached = false;
                }
                if (callback) {
                    callback(ok);
                }
            });
            return;
        } catch(err) {
            terminal.error("Error saving " + item + ": " + err);
        }    
    } 
    if (callback) {
        callback(retcode);
    }
}

DataStoreDropbox.prototype.del = function(data) {
    terminal.error("Deleting Dropbox files is not supported.");
    return false;
}
/** Renderer for datastores */
function DataStoreRenderer() {
}


/** Renderer for a datastore. */
DataStoreRenderer.prototype.render= function(dataStore, callback) {
    var html ="<div class='storage-list-title'>"
        + "File list for " + dataStore.getStoreName()
        + "</div>"; 
    html += "<ul class='storage-list bullet-free'>";
    dataStore.getFiles(function(files) {
        for (var store = 0; store < files.length; store++) {
            html += "<li><span class='store-name'>" + files[store].name
                + "</span><span class='store-size'>" + files[store].size
                + "</span><span class='store-path'>" + files[store].path;
        }
        html += "</ul>";
        if (callback) {
            callback(html);
        }
    });
}

// Dropbox access for storage.
//

function DropboxStore() {
    this.userName = "anon";
    this.client = null;
}

DropboxStore.prototype.getUserName = function(callback) {
    var dbs = this;
    this.client.getUserInfo(function(error, userInfo) {
        if (error) {
            dbs.showError("Error retrieving user name.", error);  // Something went wrong.
            dbs.userName = "anon";
        } else {
            dbs.userName = userInfo.name;
        }
        if (callback) {
            callback(dbs.userName);
        }
    });
}

DropboxStore.prototype.init = function() {
    try {
        this.client = new Dropbox.Client({
            key: "!!!DROPBOX_CLIENT_KEY!!!",
            sandbox: true
        });
        this.client.authDriver(new Dropbox.Drivers.Redirect({
            rememberUser: true
        }));
    } catch (err) {
        terminal.error("Unable to initialise Dropbox. On IE you need to use https.");
        return false;
    }
    return true;
}

DropboxStore.prototype.auth= function(callback) {
    console.log("DropboxStore auth");
    var dbs = this;
    try {
        this.client.authenticate(function(error, thisclient) {
            if (error) {
                dbs.showError("Authentication error.", error);    
            } 
            if (callback) {
                callback(error ? false : true);
            }
        });
    } catch(err) {
        terminal.error("Unable to authenticate the application. Use Firefox or Chrome.");
        if (callback) {
            callback(false);
        }
    }
}

DropboxStore.prototype.showError = function(msg, error) {
  switch (error.status) {
  case 401:
      terminal.error(msg
              + " Looks like your user token expired. Refresh the page.");
    break;

  case 404:
    terminal.error(msg + " The file does not exist.");
    break;

  case 507:
    terminal.error(msg + " You are over your Dropbox quota. i.e it's full.");
    break;

  case 503:
    terminal.error(msg + " Too many api calls to Dropbox. Try again later.");
    break;

  case 400:  // Bad input parameter
  case 403:  // Bad OAuth request.
  case 405:  // Request method not expected
  default:
    terminal.error(msg + " Hmm.That's gone wrong. Try refreshing the page.");
  }
};

DropboxStore.prototype.load = function(item, callback) {
    var dbs = this;
    this.client.readFile(item, function(error, data) {
        if (error) {
            dbs.showError('Error loading ' + item + ".", error);
            data = null;
        }
        if (callback) {
            callback(data);
        }
    });
}

DropboxStore.prototype.save = function(item, data, callback) {
    var dbs = this;
    this.client.writeFile(item, data, function(error, stat){
        if (error) {
            dbs.showError('Error writing ' + item + ".",error);
        }
        if (callback) {
            callback(error ? false :true);
        }
    });
}

DropboxStore.prototype.signOut = function(callback) {
    var dbs = this;
    this.client.signOut(function(error) {
        if (error) {
            dbs.showError("Error signing out.", error);
        }
        if (callback) {
            callback(error ? false : true);
        }
    })
}

DropboxStore.prototype.readDir = function(callback) {
    var dbs = this;
    this.client.readdir("/", function(error, entries) {
        if (error) {
            dbs.showError(error);  
            entries = null;
        }
        if (callback) {
            callback(entries);
        }
    });
}

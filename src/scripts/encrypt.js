// Module for encrypting tasks.
// (c) 2012 Steve Butler except for JsonFormatter which 
// comes from the CryptoJS site © 2009–2012 by Jeff Mott
//

var JsonFormatter = {
    stringify: function (cipherParams) {
        // create json object with ciphertext
        var jsonObj = {
            ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
        };

        // optionally add iv and salt
        if (cipherParams.iv) {
            jsonObj.iv = cipherParams.iv.toString();
        }
        if (cipherParams.salt) {
            jsonObj.s = cipherParams.salt.toString();
        }

        // stringify json object
        return JSON.stringify(jsonObj);
    },

    parse: function (jsonStr) {
        // parse json string
        var jsonObj = JSON.parse(jsonStr);

        // extract ciphertext from json object, and create cipher params object
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
        });

        // optionally extract iv and salt
        if (jsonObj.iv) {
            cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
        }
        if (jsonObj.s) {
            cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
        }

        return cipherParams;
    }
};

function Encryptor() {
    this.match = null;
    this.state = Encryptor.States.IDLE;
    this.passphrase = null;
}

Encryptor.prototype = new Executable();
Encryptor.constructor = Encryptor;

Encryptor.TAG = "<secret>";

Encryptor.States = {
    IDLE : 0,
    WAITING_KEY : 1,
    WAITING_KEY_2 : 2
};

Encryptor.prototype.process = function(data) {
    switch (this.state) {
    case Encryptor.States.IDLE:
        if (this.match
          = data.match(/(.*)&lt;(?:private|p|secret|s)&gt;(.*)/i)) {
            this.state = Encryptor.States.WAITING_KEY;
            this.run(null);
            terminal.print("Enter your passphrase.");
            terminal.enterPassword(true);
            return null;
        }
        break;
    case Encryptor.States.WAITING_KEY:
        this.passphrase = data;
        this.state = Encryptor.States.WAITING_KEY_2;
        terminal.print("Re-enter your passphrase.")
        return null;
        break;
    case Encryptor.States.WAITING_KEY_2:
        if (data != this.passphrase) {
            terminal.print(
                "Passwords don't match. Try again. Enter your passphrase.");
            this.state = Encryptor.States.WAITING_KEY;
            return null;
        }
        this.state = Encryptor.States.IDLE;
        terminal.enterPassword(false);
        this.exit(this.match[1] + Encryptor.TAG
            + CryptoJS.AES.encrypt(this.match[2],
            this.passphrase, {format: JsonFormatter}).toString());
    }
    return data;
}

Decryptor.States = {
    IDLE : 0,
    WAITING_KEY : 1,
    WAITING_END :2
};

Decryptor.prototype = new Executable();
Decryptor.constructor = Decryptor;

function Decryptor() {
    this.state = Decryptor.States.IDLE;
    this.task = null;
    this.passphrase;
    this.index = 0;
    this.callback = null;
}

Decryptor.prototype.getTask = function() {
    return this.task;
}

Decryptor.prototype.getIndex = function() {
    return this.index;
}
Decryptor.prototype.getSecret = function() {
    if (this.task && this.task.secret) {
        return CryptoJS.AES.decrypt(this.task.secret,
            this.passphrase, {format : JsonFormatter})
            .toString(CryptoJS.enc.Utf8);
    } 
    return "No secrets";
}

Decryptor.prototype.setTask = function(id, task) {
    this.id = id;
    this.task = task;
}

Decryptor.prototype.show = function() {
    terminal.mark();
    terminal.print(new TaskRenderer(this.id, this.task)
        .verbose(this.getSecret()));
    terminal.print("Press Enter to clear the secret.");
}

Decryptor.prototype.process = function(data) {
    switch(this.state) {
    case Decryptor.States.IDLE:
        if(typeof(data) == "function") {
            this.callback = data;
            console.log("Set callback " + data);
        } else {
            console.log("Typeof data = " + typeof(data));
            this.callback = null;
        }

        if (this.task && this.task.secret) {
            this.state = Decryptor.States.WAITING_KEY;
            this.run(null);
            terminal.print("Enter your passphrase.");
            terminal.enterPassword(true);
            return null;
        } else {
            terminal.print("Nothing secret to show.");
        }
        break;
    case Decryptor.States.WAITING_KEY:
        this.state = Decryptor.States.WAITING_END;
        this.passphrase = data;
        terminal.enterPassword(false);
        console.log("Callback" + this.callback)
        if (this.callback) {
            console.log("Call the callback");
            this.callback(this.getSecret());
            this.task = null;
            this.passphrase = null;
            this.exit();
            this.state = Decryptor.States.IDLE;
        } else {
            this.show();
        }
        break;
    case Decryptor.States.WAITING_END:
        terminal.clearToMark();
        this.task = null;
        this.passphrase = null;
        this.exit();
        this.state = Decryptor.States.IDLE;
        break;
    }
    return data;
}



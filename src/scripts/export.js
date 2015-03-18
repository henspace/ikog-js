// Simple importer and exporter for tasks.
// (c)2013 Steve Butler


function Exporter(fileFieldSelector) {
    this.fileField = fileFieldSelector;
    var me = this;
    $(fileFieldSelector + "Cancel").click(function() {
        me._showImporter(false);
    });

    $(this.fileField).change(function(evt) {
        console.log(evt.target.files);
        if (evt.target.files.length < 1) {
            me._showImporter(false);
            terminal.error("No file selected for import.");
        } else {
            me.doImport(evt.target.files[0]);
        }
    });
}

Exporter.prototype.exportTasks = function(nvm) {
    var data = JSON.stringify(nvm);
    var uriContent = "data:application/x-ikog-js," + encodeURIComponent(data);
    window.open(uriContent, "_blank");   
    terminal.print("Export complete. NB. If you weren't presented with a " 
        +"download dialog, this probably hasn't worked. IE users beware ;)");
}

Exporter.prototype.importTasks = function(nvm) {
    if (!window.FileReader) {
        teminal.error("Sorry but your browser doesn't support this feature.");
        return;
    }
    this.nvm = nvm;
    this._showImporter(true);
    $(this.fileField).click();
}

Exporter.prototype.doImport = function(file) {
    terminal.print("Importing " + file.name);
    var exporter = this;
    var reader = new FileReader();
    reader.onload = function() {
        exporter._showImporter(false);
        console.log(reader.result);
        try {
            var data = JSON.parse(decodeURIComponent(reader.result));   
            if (!data || !data.tasks || !data.abbreviations) {
                terminal.error("Sorry. I couldn't understand the file.");
            } else {
                exporter.nvm.tasks.addTasks(data.tasks.tasks);              
                exporter.nvm.abbreviations.merge(data.abbreviations.aliases);
                ikog.setDirty(true);
                terminal.print("Tasks and abbreviations have been imported.");
            }
        } catch (err) {
            terminal.error("Sorry. I couldn't parse the imported file. "
                + err.message);
        }
    };
    reader.onerror =function() {
        terminal.error("Sorry. A problem occurred trying to import the file.");
        exporter._showImporter(false);
    }
    reader.readAsText(file);
}

Exporter.prototype._showImporter = function(state) {
    if (state) {
        terminal.block(true);
        $('#fileImportContainer').show();
    } else {
        terminal.block(false);
        $('#fileImportContainer').hide();
    }
    
}

Exporter.prototype.endImport = function() {
    $(this.fileField).hide();
}


// Simple gtd timer
// (c)2012 Steve Butler

function GtdTimer(min) {
    this.min = min;
}

GtdTimer.prototype.start = function(callback) {
    var txt = "iKog timeout. " + this.min + " minutes have elapsed.";
    window.setTimeout(function() {
        terminal.mark();
        terminal.print("<div class='timeout'>" + txt + "</div>");
        new Confirm().wait("Press any key to acknowledge.", function() {
            terminal.clearToMark();
        })
        if (callback) {
            callback();
        }
    }, this.min * 60000);
}


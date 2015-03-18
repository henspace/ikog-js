// Script to ensure no code injection or damaging formatting.
//  (c) 2012 Steve Butler
// Text parser
//

function Parser() {
}

Parser.prototype.makeSafe = function (data) {
    data = data.replace( /&/gi,"&amp;");
    data = data.replace( /</gi,"&lt;");
    data = data.replace( />/gi,"&gt;");
    data = data.replace( /"/gi,"&quot;");
    data = data.replace( /'/gi,"&apos;");
    return data;
}


Parser.prototype.enhance = function (data) {
    data = data.replace( /\[a\\\]/g, "&#224;");
    data = data.replace( /\[a\/\]/g, "&#225;");
    data = data.replace( /\[a\^\]/g, "&#226;");
    data = data.replace( /\[e\\\]/g, "&#232;");
    data = data.replace( /\[e\/\]/g, "&#233;");
    data = data.replace( /\[e\^]/g, "&#234;");
    data = data.replace( /\[e\.\.\]/g, "&#235;");
    data = data.replace( /\[i\.\.\]/g, "&#239;");
    data = data.replace( /\[o\/\]/g, "&#243;");
    data = data.replace( /\[u\.\.\]/g, "&#252;");
    data = data.replace( /\[\[(https?\:)\/\/(.+?)\]\]/g,
            "<a href='$1\\/\\/$2' target='_blank'>$2</a>");

    data = data.replace(/\[\[([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})\]\]/, 
            "<a href='mailto:$1' target='_blank'>Email $1</a>");

    data = data.replace( /\^(.+?)\^/gi, "<sup>$1</sup>" );
    data = data.replace( /,,(.+?),,/gi, "<sub>$1</sub>" );
    data = data.replace( /\*\*(.+?)\*\*/gi, "<strong>$1</strong>" );
    data = data.replace( /\/\/(.+?)\/\//gi, "<em>$1</em>" );
    data = data.replace( /__(.+?)__/gi, "<u>$1</u>" );
    
    data = data.replace( /(\d+?) (\d+?)/gi, "$1&thinsp;$2");       
    data = data.replace( /(\d+?) (\w)/gi, "$1&nbsp;$2");       
    data = data.replace( /\[(#?\w+);\]/g, "&$1;");
    data = data.replace( /\\(.)/g, "$1"); // escape character

    return data;
}

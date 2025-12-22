// jq-mode.js
(function(mod) {
    if (typeof exports == "object" && typeof module == "object")
        mod(require("codemirror"));
    else if (typeof define == "function" && define.amd)
        define(["codemirror"], mod);
    else mod(CodeMirror);
})(function(CodeMirror) {
    CodeMirror.defineMode("jq", function() {
        const KEYWORDS = /^(def|if|then|else|elif|end|reduce|foreach|try|catch|as|and|or|not|true|false|null)\b/;
        const BUILTINS = /^(map|select|length|keys|values|add|flatten|sort_by|split|join|tostring|tonumber|floor|ceil|type)\b/;
        const NUMBER = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/;
        const STRING = /^"([^"\\]|\\.)*"?/;
        const COMMENT = /^#.*$/;
        const OP = /^[+\-*/%<>=!&|]+/;

        return {
            startState: function() {
                return {};
            },
            token: function(stream) {
                if (stream.match(COMMENT)) return "comment";
                if (stream.match(STRING)) return "string";
                if (stream.match(NUMBER)) return "number";
                if (stream.match(KEYWORDS)) return "keyword";
                if (stream.match(BUILTINS)) return "builtin";
                if (stream.match(OP)) return "operator";
                if (stream.match(/[{}[\]().,:|]/)) return null;
                stream.next();
                return null;
            },
        };
    });

    CodeMirror.defineMIME("text/x-jq", "jq");
});
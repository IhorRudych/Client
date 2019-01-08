/**
 *  File: JSONfn.js
 * 
 *  JSONfn.js has the same methods as the default
 *  JSON object, however JSONfn (unlike JSON) can
 *  stringify/parse functions 
 */

let JSONfn;
if (!JSONfn) {
    JSONfn = {};
}

(function () {
    JSONfn.stringify = exports.stringify = function (obj, spaces = 0) {
        return JSON.stringify(obj, function (key, value) {
            return (typeof value === 'function') ? value.toString() : value;
        }, spaces);
    };

    JSONfn.parse = exports.parse = function (str) {
        return JSON.parse(str, function (key, value) {
            if (typeof value != 'string') return value;
            return (value.substring(0, 8) == 'function') ? eval('(' + value + ')') : value;
        });
    };
}());
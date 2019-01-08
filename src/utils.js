/**/

exports.Download = function (filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

exports.Stamp = function () {
    var stamp = new Date();
    var year = stamp.getFullYear();
    var month = stamp.getMonth() + 1;
    if (month < 10) { month = '0' + month; }
    var day = stamp.getDate();
    if (day < 10) { day = '0' + day; }
    var hours = stamp.getHours();
    if (hours < 10) { hours = '0' + hours; }
    var minutes = stamp.getMinutes();
    if (minutes < 10) { minutes = '0' + minutes; }
    var seconds = stamp.getSeconds();
    if (seconds < 10) { seconds = '0' + seconds; }
    return year + '-' + month + '-' + day + 'T' + hours + '' + minutes + '' + seconds;
}

var round = exports.round = function (value, places) {
    if (places < 0) {
        return value;
    }
    else {
        var factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
}

exports.secondsToMinutes = function (seconds, places = -1) {
    var minutes = seconds / 60.0;
    return round(minutes, places);
}

exports.minutesToSeconds = function (minutes, places = -1) {
    var seconds = minutes * 60.0;
    return round(seconds, places);
}
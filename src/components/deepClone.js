/**
 * File: deepClone.js
 * 
 * Written by Tyler Stevens
 * 
 * deepClone.js creates deep copies of
 * JavaScript objects and arrays.
 * 
 * Accessible Functions:
 *      getCloneOfObject
 *          Allows the user to create a deep
 *          copy of an object
 * 
 *      getCloneOfArray
 *          Allows the user to create a deep
 *          copy of an array
 * 
 *      getClone
 *          Allows the user to create a deep
 *          copy of an array or object
 *              if type is unknown getClone
 *              will determine type and call
 *              the proper method
 */

let deepClone;
if (!deepClone) {
    deepClone = {};
}

(function () {
    deepClone.getCloneOfObject = exports.getCloneOfObject = function (originalObject) {
        var clone = {};
        if (typeof (originalObject) == "object") {
            for (property in originalObject) {
                if (typeof originalObject[property] == "object" && Array.isArray(originalObject[property])) {
                    clone[property] = this.getCloneOfArray(originalObject[property]);
                } else if (typeof originalObject[property] == "object") {
                    clone[property] = this.getCloneOfObject(originalObject[property]);
                } else {
                    clone[property] = originalObject[property];
                }
            }
        }
        return clone;
    };

    deepClone.getCloneOfArray = exports.getCloneOfArray = function (originalArray) {
        var clone = [];
        for (var i = 0; i < originalArray.length; i++) {
            if (typeof originalArray[i] == "object") {
                clone.push(this.getCloneOfObject(originalArray[i]));
            } else {
                clone.push(originalArray[i]);
            }
        }
        return clone;
    };


    deepClone.getClone = exports.getClone = function (old) {
        if (Array.isArray(old)) {
            return this.getCloneOfArray(old);
        } else if (typeof old == "object") {
            return this.getCloneOfObject(old);
        } else {
            console.warn('getClone did not received proper input');
        };
    }
}());
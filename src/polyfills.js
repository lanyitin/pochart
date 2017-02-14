"use strict";
String.prototype.endsWith = String.prototype.endsWith || function(searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.lastIndexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
};

Array.prototype.find = Array.prototype.find || function(predicate) {
    'use strict';
    if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];

    for (var i = 0; i !== length; i++) {
        if (predicate.call(thisArg, this[i], i, list)) {
            return this[i];
        }
    }
    return undefined;
}

Array.prototype.map = Array.prototype.map || function(callback, thisArg) {
    var T, A, k;
    if (this == null) {
        throw new TypeError(' this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
    }
    if (arguments.length > 1) {
        T = thisArg;
    }
    A = new Array(len);
    k = 0;
    while (k < len) {
        var kValue, mappedValue;
        if (k in O) {
            kValue = O[k];
            mappedValue = callback.call(T, kValue, k, O);
            A[k] = mappedValue;
        }
        k++;
    }
    return A;
}

Array.prototype.some = Array.prototype.some || function(evaluator, thisArg) {
    'use strict';
    if (!this) {
        throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (typeof(evaluator) !== 'function') {
        if (typeof(evaluator) === 'string') {
            if ( ! (evaluator = eval(evaluator)) ){
                throw new TypeError();
            }
        } else {
            throw new TypeError();
        }
    }

    var i;
    if (thisArg===undefined){
        for (i in this) {
            if (evaluator(this[i], i, this)) {
                return true;
            }
        }
        return false;
    }
    for (i in this) {
        if (evaluator.call(thisArg, this[i], i, this)) {
            return true;
        }
    }
    return false;
}

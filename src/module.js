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

/** @namespace */
let Pochart = {
    priority: ["area", "column", "bar", "pie", "line", "spline", "scatter"]
}
/**
 * attach a chart to existed dom
 * @param {string} domElement - 目標的DOM或是該DOM的id
 * @param {json} dataTable - 從DataTable序列化出來的json資料
 */
Pochart.attachChart = function (domElement, dataTable) {
    if (typeof(domElement) === "string") {
        domElement = document.getElementById(domElement);
    }
    if (typeof domElement.nodeName === "undefined") {
        console.error(domElement, "is not a dom element");
        return;
    }
    let keys = arguments[2];
    if (keys === undefined) {
        keys = Object.keys(dataTable[0]);
    }
    if (!Array.isArray(keys)) {
        console.error(`keys should be a array, but we got ${JSON.stringify(keys)}`);
        keys = Object.keys(dataTable[0]);
    }
    let configs = arguments[3] || {};
    let series = [];

    keys.forEach(function (key) {
        let data = [];
        let config = configs[key] || {};
        for (let j = 0; j < dataTable.length; j++) {
            data.push(dataTable[j][key]);
        }
        let ser = {
            type: config.type || "line",
            data: data,
            name: config.name || key
        };
        if (typeof config.yAxis == "object") {
            config.yAxis.id = config.yAxis.id || key;
            ser.yAxis = config.yAxis.id;
        } else {
            ser.yAxis = `_pochart_default_yaxis_${ser.type}`;
        }
        series.push(ser);
    });

    let yAxis = [];
    for (let key in configs) {
        let config = configs[key];
        let exists_axises = yAxis.map((axis) => {return axis.id;});
        if (typeof config.yAxis == "object" && exists_axises.indexOf(config.yAxis.id) < 0) {
            yAxis.push(config.yAxis);
        }
    }
    series.forEach(function (ser) {
        let axisName = yAxis.map(function (axis) {return axis.id;});
        if (ser.yAxis.indexOf("_pochart_default_yaxis") === 0 && axisName.indexOf(ser.yAxis) < 0) {
            let newAxis = {id: ser.yAxis};
            if (ser.type.indexOf("line") > -1) {
                newAxis.opposite = true;
            }
            yAxis.unshift(newAxis);
        }
    });

    series = series.sort((ser, ser2) => {
        return this.priority.indexOf(ser.type) - this.priority.indexOf(ser2.type);
    });
    keys = series.map((ser) => {return ser.name});
    let chart_config = {
        series: series
    }
    if (yAxis.length > 0) {
        chart_config.yAxis = yAxis;
    }
    let chart = Highcharts.chart(domElement, chart_config);

    return new this.PochartController(chart, chart_config)
}

/**
 * PochartController
 * @constructor
 * @param {highchart} chart - Highchart物件
 * @param {object} config - 設定
 */
Pochart.PochartController = function (chart, config) {
    this.nameMap = {};
    let keys = config.series.map((ser) => {return ser.name;});
    /**
     * 取得Highchart物件
     * @return {object}
     */
    this.GetHighchart = function () {
        return chart;
    };
    this.setXAxis = function () {
        chart.xAxis[0].setCategories(arguments[0]);
    };

    /**
     * 依據DataTable的欄位名稱來找出相對應的y軸
     * @param {string} key - DataTable的欄位名稱
     * @return {object}
     */
    this.findYAxis = function (key) {
        let result = chart.yAxis.find((axis) => {
            return axis.series.some((ser) => {
                return ser.name === key || ser.name === this.nameMap[key];
            });
        });
        if (!result) {
            console.error(`can't find yAxis for "${key}", please make sure that input data has that colum"`);
        }
        return result;
    };

    this.updateAxisConfig = function (key, property_name, value) {
        let targetAxis = this.findYAxis(key);
        if (targetAxis) {
            let config = {};
            config[property_name] = value;
            targetAxis.update(config);
        }
    };

    this.setDataNames = function(key, values) {
        let target = chart.series.find((ser) => {
            return ser.name === key || ser.name === this.nameMap[key];
        });
        target.data.forEach((elem, idx) => {
            if (!values[idx]) {
                return;
            }
            elem.update({name: values[idx]});
        });
    }


    /**
    * 設定Y軸的標籤
    * @param {string} key - DataTable的欄位名稱
    * @param {string} title - 標籤的內容
    */
    this.setYAxisLabel = function (key, title) {
        this.updateAxisConfig(key, "title", {"text": title});
    };

    /**
    * 設定Y軸的最小值
    * @param {string} key - DataTable的欄位名稱
    * @param {number} value - 最小值
    */
    this.setYAxisMinValue = function (key, value) {
        this.updateAxisConfig(key, "min", value);
    };

    /** * 設定Y軸的最大值
    * @param {string} key - DataTable的欄位名稱
    * @param {number} value - 最大值
    */
    this.setYAxisMaxValue = function (key, value) {
        this.updateAxisConfig(key, "max", value);
    };
    this.setLegendTitle = function (key, title) {
        let idx = keys.indexOf(key);
        let target = chart.legend.allItems[idx];
        if (target) {
            target.update({name: title});
            this.nameMap[key] = title;
        }
    };

    // 設定圖表標題
    this.setTitle = function () {
        chart.setTitle({text: arguments[0]});
    };

    // @param {boolean} flag - 是否讓column chart進行堆疊
    this.toggleStackedColumn = function (flag = false) {
        if (flag) {
            flag = "normal";
        } else {
            flag = null;
        }
        chart.update({
            plotOptions: {
                column: {
                    stacking: flag
                }
            }
        });
    }
}

let PochartProxy = {};
PochartProxy.initialized = false;
PochartProxy.action_queue = [];
PochartProxy.load = function (url, callback) {
    var res = null;
    if (url.endsWith("css")) {
        res = document.createElement('link');
        res.rel = 'stylesheet';
        res.type = 'text/css';
    } else {
        res = document.createElement('script');
        res.type = 'text/javascript';
        res.async = true;
    }
    if (res.readyState) {
        res.onreadystatechange = function () {
            if (script.readyState == "loaded" || script.readyState == "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {
        res.onload = function () {
            if (callback) {
                callback();
            }
        };
    }
    if (url.endsWith("css")) {
        res.href = url;
        document.getElementsByTagName("head")[0].appendChild(res);
    } else {
        res.src = url;
        document.getElementsByTagName("body")[0].appendChild(res);
    }
}
PochartProxy.initialize = function () {
    if (!this.IsHcLoaded()) {
        this.load('http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/css/highcharts.css', () => {
            this.load('http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/highcharts.js');
        });
    }

    setInterval(() => {
        if (this.action_queue.length === 0 || !this.IsHcLoaded()) {
            return;
        }
        let action = this.action_queue.pop();
        if (action) {
            action();
        }
    }, 50);
    this.initialized = true;
}

PochartProxy.IsHcLoaded = function () {
    return typeof Highcharts !== "undefined" && typeof Highcharts !== "null"
}

PochartProxy.attachChart = function () {
    if (!this.initialized) {
        this.initialize();
    }
    let proxiedObject = null;
    this.action_queue.push(() => {
        proxiedObject = Pochart.attachChart.apply(Pochart, arguments);
    });
    let NullChartObj = new Pochart.PochartController({}, {series:[]});
    let properties = Object.getOwnPropertyNames(new Pochart.PochartController({}, {series:[]})).filter((p) => {
        return typeof NullChartObj[p] === "function";
    });
    let proxy = {};
    proxy.action_queue = [];
    setInterval(() => {
        if (proxy.action_queue.length == 0 || proxiedObject == null) {
            return;
        }
        let action = proxy.action_queue.pop();
        if (action) {
            action();
        }
    }, 50);
    properties.forEach((p) => {
        proxy[p] = function () {
            proxy.action_queue.push(() => {
                proxiedObject[p].apply(proxiedObject, arguments);
            });
        }
    });
    return proxy;
};

class Proxy {
    constructor(proxiedObj) {
        this.proxiedObj = proxiedObj;
        this.wrapFunc = arguments[1];

        let properties = Object.getOwnPropertyNames(proxiedObj).filter((p) => {
            return typeof proxiedObj[p] === "function";
        });
        properties.forEach((p) => {
            this[p] = this.makeWrappedFunction(this.wrapFunc, proxiedObj[p]);
        });
    }

    makeWrappedFunction (wrapFunc, beWrapFunc) {
        if (wrapFunc) {
            return function () {
                wrapFunc(this.proxiedObj, arguments, beWrapFunc);
            }
        } else {
            return function () {
                beWrapFunc.apply(this.proxiedObj, arguments);
            }
        }
    }
}

class ScopedProxy extends Proxy {
    constructor(scope, template, wrapFunc) {
        super(template, function () {
            if (scope.obj != null) {
                wrapFunc.apply(arguments);
            }
        });
    }
}

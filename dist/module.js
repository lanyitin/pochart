"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isFunction = function isFunction(arg) {
    return typeof arg === "function";
};

var Pochart = {
    initialized: false,
    autoLoadDeps: false,
    priority: ["area", "column", "bar", "pie", "line", "spline", "scatter"]
};

Pochart.initialize = function () {
    if (!this.initialized) {
        if (window.Highcharts != null) {
            this.initialized = true;
            console.log("current highchart version", Highcharts.version);
        } else {
            if (this.autoLoadDeps || arguments[0]) {
                (function () {
                    var newscript = document.createElement('script');
                    newscript.type = 'text/javascript';
                    newscript.async = true;
                    newscript.src = 'http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/highcharts.js';
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(newscript);
                })();
                (function () {
                    var fileref = document.createElement("link");
                    fileref.rel = "stylesheet";
                    fileref.type = "text/css";
                    fileref.href = "http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/css/highcharts.css";
                    document.getElementsByTagName("head")[0].appendChild(fileref);
                })();
            } else {
                window.alert("Pochart requires Highcharts");
            }
        }
    }
};
// Pochart.attachChart(domElement, dataTable[keys, configs]) // attach a chart to div or sort of
Pochart.attachChart = function (domElement, dataTable) {
    var _this = this;

    this.initialize();
    if (typeof domElement === "string") {
        domElement = document.getElementById(domElement);
    }
    if (domElement.constructor.name.indexOf("HTML") != 0) {
        console.log(domElement, "is not a dom element");
        return;
    }
    var keys = arguments[2];
    if (keys === undefined) {
        keys = Object.keys(dataTable[0]);
    }
    if (!Array.isArray(keys)) {
        console.error("keys should be a array, but we got " + JSON.stringify(keys));
        keys = Object.keys(dataTable[0]);
    }
    var configs = arguments[3] || {};
    var series = [];

    keys.forEach(function (key) {
        var data = [];
        var config = configs[key] || {};
        for (var j = 0; j < dataTable.length; j++) {
            data.push(dataTable[j][key]);
        }
        var ser = {
            type: config.type || "line",
            data: data,
            name: config.name || key
        };
        if (_typeof(config.yAxis) == "object") {
            config.yAxis.id = key;
            ser.yAxis = config.yAxis.id;
        } else {
            ser.yAxis = "_pochart_default_yaxis_" + ser.type;
        }
        series.push(ser);
    });

    var yAxis = [];
    for (var key in configs) {
        var config = configs[key];
        if (_typeof(config.yAxis) == "object") {
            yAxis.push(config.yAxis);
        }
    }
    series.forEach(function (ser) {
        var axisName = yAxis.map(function (axis) {
            return axis.id;
        });
        if (ser.yAxis.startsWith("_pochart_default_yaxis") && axisName.indexOf(ser.yAxis) < 0) {
            var newAxis = { id: ser.yAxis };
            if (ser.type.indexOf("line") > -1) {
                newAxis.opposite = true;
            }
            yAxis.unshift(newAxis);
        }
    });

    series = series.sort(function (ser, ser2) {
        return _this.priority.indexOf(ser.type) - _this.priority.indexOf(ser2.type);
    });
    keys = series.map(function (ser) {
        return ser.name;
    });
    var chart_config = {
        series: series
    };
    if (yAxis.length > 0) {
        chart_config.yAxis = yAxis;
    }
    var chart = Highcharts.chart(domElement, chart_config);
    return {
        nameMap: {},
        GetHighchart: function GetHighchart() {
            return chart;
        },
        setDataNames: function setDataNames(key, values) {
            var _this2 = this;

            var target = chart.series.find(function (ser) {
                return ser.name === key || ser.name === _this2.nameMap[key];
            });
            target.data.forEach(function (elem, idx) {
                if (!values[idx]) {
                    return;
                }
                elem.update({ name: values[idx] });
            });
        },
        setXAxis: function setXAxis() {
            chart.xAxis[0].setCategories(arguments[0]);
        },
        _findYAxis: function _findYAxis(key) {
            var _this3 = this;

            var result = chart.yAxis.find(function (axis) {
                return axis.series.some(function (ser) {
                    return ser.name === key || ser.name === _this3.nameMap[key];
                });
            });
            if (!result) {
                console.error("can't find axis for \"" + key + ", please make sure that input data has that colum\"");
            }
            return result;
        },
        _updateAxisConfig: function _updateAxisConfig(key, property_name, value) {
            var targetAxis = this._findYAxis(key);
            if (targetAxis) {
                var _config = {};
                _config[property_name] = value;
                targetAxis.update(_config);
            }
        },
        setYAxisTitle: function setYAxisTitle(key, title) {
            this._updateAxisConfig(key, "title", { "text": title });
        },
        setYAxisMinValue: function setYAxisMinValue(key, value) {
            this._updateAxisConfig(key, "min", value);
        },
        setYAxisMaxValue: function setYAxisMaxValue(key, value) {
            this._updateAxisConfig(key, "max", value);
        },
        setLegendTitle: function setLegendTitle(key, title) {
            var idx = keys.indexOf(key);
            var target = chart.legend.allItems[idx];
            if (target) {
                target.update({ name: title });
                this.nameMap[key] = title;
            }
        },
        setTitle: function setTitle() {
            chart.setTitle({ text: arguments[0] });
        },
        toggleStackedColumn: function toggleStackedColumn() {
            var flag = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

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
    };
};

// Pochart.createChart(dataTable[keys, configs])
Pochart.createElement = function (dataTable) {
    var dom = document.createElement("div");
    return {
        "dom": dom,
        "chart": this.attachChart(dom, dataTable, arguments[1], arguments[2])
    };
};
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isFunction = function isFunction(arg) {
    return typeof arg === "function";
};

var Pochart = {
    initialized: false,
    autoLoadDeps: false
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
// Pochart.attachChart(domElement, dataTable[, configs]) // attach a chart to div or sort of
Pochart.attachChart = function (domElement, dataTable) {
    this.initialize();
    if (typeof domElement === "string") {
        domElement = document.getElementById(domElement);
    }
    if (domElement.constructor.name.indexOf("HTML") != 0) {
        console.log(domElement, "is not a dom element");
        return;
    }
    var configs = arguments[2] || {};
    var keys = arguments[3] || Object.keys(dataTable[0]);
    var series = [];

    keys.forEach(function (key) {
        var data = [];
        var config = configs[key] || {};
        for (var j = 0; j < dataTable.length; j++) {
            data.push(dataTable[j][key]);
        }
        var ser = {
            type: config.type || "",
            data: data,
            name: config.name || key
        };
        if (_typeof(config.yAxis) == "object") {
            config.yAxis.id = new Date().getTime().toFixed();
            ser.yAxis = config.yAxis.id;
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
    if (yAxis.length > 0) {
        yAxis.unshift({});
    }
    var chart_config = {
        series: series
    };
    if (yAxis.length > 0) {
        chart_config.yAxis = yAxis;
    }
    var chart = Highcharts.chart(domElement, chart_config);

    return {
        GetHighchart: function GetHighchart() {
            return chart;
        },
        setXAxis: function setXAxis() {
            chart.xAxis[0].setCategories(arguments[0]);
        },
        setDefaultYAxisTitle: function setDefaultYAxisTitle() {
            chart.yAxis[0].setTitle({ "text": arguments[0] });
        },
        setTitle: function setTitle() {
            chart.setTitle({ text: arguments[0] });
        }
    };
};

// Pochart.createChart(dataTable[, configs])
Pochart.createElement = function (dataTable) {
    var dom = document.createElement("div");
    return {
        "dom": dom,
        "chart": this.attachChart(dom, dataTable, arguments[1])
    };
};
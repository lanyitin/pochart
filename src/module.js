"use strict";

let isFunction = function (arg) {
	return typeof arg === "function";
}

let Pochart = {
    initialized: false,
    autoLoadDeps: false
}

Pochart.initialize = function () {
    if (!this.initialized) {
        if (window.Highcharts != null) {
            this.initialized = true;
            console.log("current highchart version", Highcharts.version);
        } else {
            if (this.autoLoadDeps || arguments[0]) {
                (function(){
                    var newscript = document.createElement('script');
                    newscript.type = 'text/javascript';
                    newscript.async = true;
                    newscript.src = 'http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/highcharts.js';
                  (document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(newscript);
                })();
                (function(){
                    var fileref = document.createElement("link");
                    fileref.rel = "stylesheet";
                    fileref.type = "text/css";
                    fileref.href = "http://myvf.kh.asegroup.com/cdn/highcharts/5.0.2/code/css/highcharts.css";
                    document.getElementsByTagName("head")[0].appendChild(fileref)
                })();
            } else {
                window.alert("Pochart requires Highcharts");
            }
        }
    }
}
// Pochart.attachChart(domElement, dataTable[, configs]) // attach a chart to div or sort of
Pochart.attachChart = function (domElement, dataTable) {
    this.initialize();
    if (typeof(domElement) === "string") {
        domElement = document.getElementById(domElement);
    }
    if (domElement.constructor.name.indexOf("HTML") != 0) {
        console.log(domElement, "is not a dom element");
        return;
    }
    let configs = arguments[2] || {};
    let keys = arguments[3] || Object.keys(dataTable[0]);
    let series = [];

    keys.forEach(function (key) {
        let data = [];
        let config = configs[key] || {};
        for (let j = 0; j < dataTable.length; j++) {
            data.push(dataTable[j][key]);
        }
        let ser = {
            type: config.type || "",
            data: data,
            name: config.name || key
        };
        if (typeof config.yAxis == "object") {
            config.yAxis.id = (new Date()).getTime().toFixed();
            ser.yAxis = config.yAxis.id;
        }
        series.push(ser);
    });

    let yAxis = [];
    for (let key in configs) {
        let config = configs[key];
        if (typeof config.yAxis == "object") {
            yAxis.push(config.yAxis);
        }
    }
    if (yAxis.length > 0) {
        yAxis.unshift({});
    }
    let chart_config = {
        series: series
    }
    if (yAxis.length > 0) {
        chart_config.yAxis = yAxis;
    }
    let chart = Highcharts.chart(domElement, chart_config);

    return {
        GetHighchart: function () {
            return chart;
        },
        setXAxis: function () {
            chart.xAxis[0].setCategories(arguments[0]);
        },
        setDefaultYAxisTitle: function () {
            chart.yAxis[0].setTitle({"text": arguments[0]});
        },
        setTitle: function () {
            chart.setTitle({text: arguments[0]});
        }
    }
}


// Pochart.createChart(dataTable[, configs])
Pochart.createElement = function (dataTable) {
    let dom = document.createElement("div");
    return {
        "dom": dom,
        "chart": this.attachChart(dom, dataTable, arguments[1])
    };
}

"use strict";

let isFunction = function (arg) {
    return typeof arg === "function";
}

let Pochart = {
    initialized: false,
    autoLoadDeps: false,
    priority: ["area", "column", "bar", "pie", "line", "spline", "scatter"]
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
// Pochart.attachChart(domElement, dataTable[keys, configs]) // attach a chart to div or sort of
Pochart.attachChart = function (domElement, dataTable) {
    this.initialize();
    if (typeof(domElement) === "string") {
        domElement = document.getElementById(domElement);
    }
    if (domElement.constructor.name.indexOf("HTML") != 0) {
        console.log(domElement, "is not a dom element");
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
            config.yAxis.id = key;
            ser.yAxis = config.yAxis.id;
        } else {
            ser.yAxis = `_pochart_default_yaxis_${ser.type}`;
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
    series.forEach(function (ser) {
        let axisName = yAxis.map(function (axis) {return axis.id;});
        if (ser.yAxis.startsWith("_pochart_default_yaxis") && axisName.indexOf(ser.yAxis) < 0) {
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
    return {
        nameMap: {},
        GetHighchart: function () {
            return chart;
        },
        setDataNames: function(key, values) {
            let target = chart.series.find((ser) => {
                return ser.name === key || ser.name === this.nameMap[key];
            });
            target.data.forEach((elem, idx) => {
                if (!values[idx]) {
                    return;
                }
                elem.update({name: values[idx]});
            });
        },
        setXAxis: function () {
            chart.xAxis[0].setCategories(arguments[0]);
        },
        _findYAxis: function (key) {
            let result = chart.yAxis.find((axis) => {
                return axis.series.some((ser) => {
                    return ser.name === key || ser.name === this.nameMap[key];
                });
            });
            if (!result) {
                console.error(`can't find axis for "${key}, please make sure that input data has that colum"`);
            }
            return result;
        },
        _updateAxisConfig: function (key, property_name, value) {
            let targetAxis = this._findYAxis(key);
            if (targetAxis) {
                let config = {};
                config[property_name] = value;
                targetAxis.update(config);
            }
        },
        setYAxisTitle: function (key, title) {
            this._updateAxisConfig(key, "title", {"text": title});
        },
        setYAxisMinValue: function (key, value) {
            this._updateAxisConfig(key, "min", value);
        },
        setYAxisMaxValue: function (key, value) {
            this._updateAxisConfig(key, "max", value);
        },
        setLegendTitle: function (key, title) {
            let idx = keys.indexOf(key);
            let target = chart.legend.allItems[idx];
            if (target) {
                target.update({name: title});
                this.nameMap[key] = title;
            }
        },
        setTitle: function () {
            chart.setTitle({text: arguments[0]});
        },
        toggleStackedColumn: function (flag = false) {
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
}


// Pochart.createChart(dataTable[keys, configs])
Pochart.createElement = function (dataTable) {
    let dom = document.createElement("div");
    return {
        "dom": dom,
        "chart": this.attachChart(dom, dataTable, arguments[1], arguments[2])
    };
}

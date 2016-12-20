"use strict";

let isFunction = function (arg) {
	return typeof arg === "function";
}

class LayerConfig {
	constructor(typeLiteral) {
		this._plotOptions = null;
		this._literal = typeLiteral;
	}
	
	set plotOptions (options) {
		this._plotOptions = options;
	}
	
	get plotOptions () {
		return this._plotOptions;
	}
	
	get type () {
		return this._literal;
	}
	
	static get Pie() {
		return new LayerConfig("pie");
	}
	
	static get Bar() {
		return new LayerConfig("bar");
	}
	static get Spline() {
		return new LayerConfig("spline");
	}
}

class Layer {
	constructor(layerConfig, dataSource) {
		this._config = layerConfig;
		this._dataSource = dataSource;
	}
	
	get data() {
		if (isFunction(this._dataSource)) {
			return this._dataSource();
		} else {
			return this._dataSource;
		}
	}
	
	get config() {
		return this._config;
	}
	
}

class HCWrap {
	constructor (xLabelSource, yLabelSource) {
		this.layers = [];
		this.xLabelSource = xLabelSource;
		this.yLabelSource = yLabelSource;
	}
	
	add(layer) {
		this.layers.push(layer);
	}
	
	get hcconfig() {
		let self = this;
		return {
			xAxis: {categories: (() => {
				if (isFunction(self.xLabelSource)) {
					return self.xLabelSource();
				} else {
					return self.xLabelSource || {};
				}
			})()},
			yAxis: (() => {
				let result = [(() => {
					if (isFunction(self.yLabelSource)) {
						return self.yLabelSource();
					} else {
						return self.yLabelSource || {};
					}
				})()];
				for (let i = 0; i < self.layers.length; i++) {
					let yAxisCount = 0;
					let layer = self.layers[i];
					if (layer.config.yAxis) {
						yAxisCount++;
						layer.yAxisId = yAxisCount;
						result.push(layer.config.yAxis);
					} else {
						layer.yAxisId = 0;	
					}
				}
				return result;
			})(),
			series: (() => {
				let result = [];
				for (let i = 0; i < self.layers.length; i++) {
					let layer = self.layers[i];
					let ser = {
						type: layer.config.type,
						data: layer.data,
						yAxis: layer.yAxisId
					};
					for (var attrname in layer.config.plotOptions) {
						ser[attrname] = layer.config.plotOptions[attrname];
					}
					result.push(ser);
				}
				return result;
			})()			
		}
	}
}
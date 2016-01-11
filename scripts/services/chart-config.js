	/* Creating chart using flot API */

/* 1. registering modules, services and constants */
angular.module('chart_config', ['output_model', 'angular-flot'])
	.service('chartConfig', ['outputModel', chartCreate]);

/* 2. creating sub-methods as part of the function object that can be called */
function chartCreate(outputModel) {
	var chart = this;
	var output = outputModel;

	chart.dataset = output.RU_CompiledLabelPlotAll;
	
	chart.options = {
		grid: {
		    backgroundColor: { colors: [ "#151c28", "#1c2535" ] },
		    borderWidth: 0,
		    hoverable: true
		},
		legend: {
			backgroundOpacity: 0.75,
		},
		xaxis: {
			axisLabelUseCanvas: true,
			axisLabel: "time/s",
			position: "bottom",
			axisLabelFontFamily: "Work Sans",
			axisLabelFontSizePixels: 13,
			axisLabelColour: "#d2e3fd",
			axisLabelPadding: 10,
			color: "#344458",
		},
		yaxis: {
			axisLabelUseCanvas: true,
			axisLabel: "resonance/RU",
			position: "left",
			axisLabelFontFamily: "Work Sans",
			axisLabelFontSizePixels: 13,
			axisLabelColour: "#d2e3fd",
			axisLabelPadding: 10,
			color: "#344458",
		},
		tooltip: {
			show: true,
			content: "(%x, %y)"
		},
		selection: {
			mode: "xy"
		}
	};
/*
	$("#flot").bind("plotselected", function (event, ranges) {
			/ clamp the zooming to prevent eternal zoom
		if (ranges.xaxis.to - ranges.xaxis.from < 0.00001) {
			ranges.xaxis.to = ranges.xaxis.from + 0.00001;
		}
		if (ranges.yaxis.to - ranges.yaxis.from < 0.00001) {
			ranges.yaxis.to = ranges.yaxis.from + 0.00001;
		}
			// do the zooming
		plotObj = $.plot("#flot", chart.dataset,
			$.extend(true, {}, options, {
				xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to },
				yaxis: { min: ranges.yaxis.from, max: ranges.yaxis.to }
			})
		);
	});
*/
}
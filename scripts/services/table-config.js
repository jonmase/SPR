	/* Creating table using ui-grid API */

/* 1. registering modules, services and constants */
angular.module('table_config', ['output_model', 'experiment_status', 'ui.grid', 'ui.grid.selection', 'ui.grid.exporter'])
	.service('tableConfig', ['outputModel', 'experimentStatus', tableCreate]);

/* 2. creating sub-methods as part of the function object that can be called */
function tableCreate(outputModel, experimentStatus) {
	var table = this;
	var output = outputModel;
	var experiment = experimentStatus;
	table.data = [];

	table.options = {
			data: table.data,
				// defining header name
			columnDefs: [
					{
						field: "trial",
						displayName: "trial no.",
						width: '90'
					},
					{
						field: "fLC",
						displayName: "free ligand conc.",
						width: '145'
					},
					{
						field: "units",
						displayName: "units",
						width: '70'
					},
					{
						field: "timeOn",
						displayName: "association time/s",
						width: '160'
					},
					{
						field: "maxRU_reached",
						displayName: "max RU reached",
						width: '170'
					},
					{
						field: "kOff",
						displayName: "kOff",
						width: '85'
					}
				],
				// exporting
			enableGridMenu: true,
			exporterMenuCsv: true,
			exporterMenuPdf: false,
			exporterEnableExporting: true,
    		exporterCsvFilename: 'SPR_Data.csv'
		};

	table.compileData = function(experiment_steps, out_fLC, out_timeOn, out_RU_On_Output) {
		table.compiledSetOn = {
			"trial": experiment_steps,
			"fLC": out_fLC,
			"units": output.unitAdjust,
			"timeOn": out_timeOn,
			"maxRU_reached": out_RU_On_Output,
			"kOff": "hello"
		};
		table.data.push(angular.copy(table.compiledSetOn));
	};
}
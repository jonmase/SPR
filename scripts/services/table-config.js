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
						displayName: "trial",
						width: "51"
					},
					{
						field: "fLC",
						displayName: "free ligand conc.",
						width: "120",
						enableSorting: false // ui-grid have sort column issue when different columns have both strings and text, so currently allow only sort by trial number
					},
					{
						field: "units",
						displayName: "units",
						width: "55",
						enableSorting: false
					},
					{
						field: "timeOn",
						displayName: "association time/s",
						width: "129",
						enableSorting: false
					},
					{
						field: "maxRU_value",
						displayName: "max RU",
						width: "90",
						enableSorting: false
					},
					{
						field: "fLC_standard",
						displayName: "free ligand conc./M",
						width: "120",
						enableSorting: false
						// visible: false
					},
					{
						field: "inefficiency_display",
						displayName: "efficiency lost",
						width: "120",
						enableSorting: false
						// visible: false
					}
				],
				// miscellaneous
			enableHorizontalScrollbar: 0,
			enableColumnMenus: false,
				// exporting
			enableGridMenu: true,
			exporterMenuCsv: true,
			exporterMenuPdf: false,
			exporterEnableExporting: true,
    		exporterCsvFilename: 'SPR_Data.csv'
		};

	table.compileData = function(experiment_steps, out_fLC, out_timeOn, out_RU_On_Output, out_fLC_standard, out_inefficiency_display) {
		table.compiledSet = {
			"trial": experiment_steps,
			"fLC": out_fLC,
			"units": output.unitAdjust,
			"timeOn": out_timeOn,
			"maxRU_value": out_RU_On_Output,
			"fLC_standard": out_fLC_standard,
			"inefficiency_display": out_inefficiency_display
		};
		table.data.push(angular.copy(table.compiledSet));
	};
}
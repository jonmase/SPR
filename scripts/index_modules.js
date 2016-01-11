	/* Module Compiler: Compiled modules will be inserted into index_controllers */

/* 1. compilation of modules for mathematical model */
angular.module('model', ['system_model', 'output_model', 'experiment_status']);

/* system_model = mathematical model of ligand and receptor pair parameters */
/* output_model = mathematical model of graphs and statistics output */
/* experiment_status = mathematical model of time spent on experiment */

/* 2. compilation of modules for display */
angular.module('display', ['time_filter', 'mw_filter', 'uM_filter', 'chart_config', 'table_config']);

/* time_filter = converting values for time of day to digital time display */
/* mw_filter = remove a 1000 from molecular weight and put a 'k' in display */
/* uM_filter = converting values for at M to uM in display */
/* chart_config = plot results in flot chart */
/* ui.grid = display calculated result in a table */

/* 3. cookies generation module */
angular.module('cookies', ['ngCookies']);
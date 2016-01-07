	/* Converting values for at M to uM in display */

/* 1. registering modules, services and constants */
angular.module('uM_filter', [])
	.filter('uM_Filter', microMol);

/* 2. creating sub-methods as part of the function object that can be called */

function microMol() {
	return function(uM_input){
		M_output = uM_input*1000000;
		return M_output;
	};
}
	/* Converting values for time of day to digital time display */

/* 1. registering modules, services and constants */
angular.module('time_filter', [])
	.filter('timeFilter', timeOfDay);

/* 2. creating sub-methods as part of the function object that can be called */

function timeOfDay() {
	return function(timeInput){
		var hours = Math.floor(timeInput); // get the hour
		var minutes = '00';
		var checkMinutes = timeInput%1;	// check if its 0.5
		if (checkMinutes !== 0) {
			minutes = '30'; // if it is return 30
		}
		timeOutput = hours+':'+minutes;
		return timeOutput;
	};
}
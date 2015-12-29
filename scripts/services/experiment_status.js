	/* Experimental Status: contain functions to ouput values for state of experiment */

/* 1. registering modules, services and constants */
angular.module('experiment_status', [])
	.service('experimentStatus', [experimentTrack]);

function experimentTrack() { 
	var experiment = this;
/* creating concept for time of day to alter output standard deviation */
	experiment.timePerRun = 0.5;
	experiment.timePerBreak = 1.5;
	experiment.startOfDay = 9.5; // 5 runs available
	experiment.startOfLunch = 12.0; // 9 runs available
		// total runs with good SD per day = 14
	experiment.startOfDinner = 17.0; // 7 runs available
	experiment.startOfSupper = 21.0; // 5 runs available
		// total runs with good SD per day = 12
	experiment.endOfDay = 24.0;
		// total runs per day = 26
/* creating tracked variables */
	experiment.steps = 0;
	experiment.timeOfDay = experiment.startOfDay;
	experiment.daysAllowed = 1; 
	experiment.daysLeft = 1;
	experiment.endOfExperimentTime = 0;
		// total runs with good SD per simulation = 28
		// total runs per simulation = 52
	experiment.stdErr_Default = 0.000000001; // Need to figure out the right level of variation for concentration; currently default at nM level (otherwise result could become negative)
	experiment.stdErr_Now = experiment.stdErr_Default; // starting with default level and increase as it passes different time point
	experiment.stdErr_Gaussian = 0; // Normal distribution is generated around input standard error and randomly picked as the final standard error to use

/* 2. creating sub-methods as part of the function object that can be called */

/* a) track steps taken */
	experiment.stepsCounter = function() {
		experiment.steps++;
	};

/* b) track time of day */
	experiment.timeOfDayCounter = function() {
		if (experiment.timeOfDay == experiment.startOfLunch || experiment.timeOfDay == experiment.startOfDinner || experiment.timeOfDay == experiment.startOfSupper) {
			experiment.timeOfDay += experiment.timePerBreak;
		} else {
			experiment.timeOfDay += experiment.timePerRun;
		}
	};

/* c) track day of experiment counter */
	experiment.dayOfExperimentCounter = function() {
		experiment.daysLeft--;
	};

/* d) evaluating standard error to use base on time of day */
	experiment.evalStdErr = function() {
		if(experiment.timeOfDay < experiment.startOfDinner) {
			experiment.stdErr_Now = experiment.stdErr_Default;
		} else if(experiment.timeOfDay >= experiment.startOfDinner && experiment.timeOfDay < experiment.startOfSupper){
			experiment.stdErr_Now = experiment.stdErr_Default*2;
		} else {
			experiment.stdErr_Now = experiment.stdErr_Default*3;
		}
	};

/* e) generating Gaussian error at random */
		// credit: http://www.protonfish.com/random.shtml
	experiment.measurementError = function(out_fLC) {
			// adjusting stdErr against normal distribution
		experiment.stdErr_Gaussian = ((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*experiment.stdErr_Now;
			// deciding if stdErr will add or subtract the mean
		experiment.flip_plusOrMinus = Math.random()*2;
		if (experiment.flip_plusOrMinus > 1) {
			experiment.plusOrMinus = 1;
		} else {
			experiment.plusOrMinus = -1;
		}
			// modify final result with the measurement error
		return out_fLC+experiment.plusOrMinus*experiment.stdErr_Gaussian;
	};

}
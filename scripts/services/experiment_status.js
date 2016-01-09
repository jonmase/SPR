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
/* creating variables for error generation module */
		// for absolute error
	experiment.stdDev_Default = 0.000000001; // Need to figure out the right level of variation for concentration; currently default variation is at nM level
	experiment.stdDev_Absolute = experiment.stdDev_Default; // starting with default level and increase as it passes different time point
	experiment.stdDev_Gaussian_absolute = 0; // Normal distribution is generated around input standard error and randomly picked as the final standard deviation to use
		// for relative error
	experiment.CV_Default = 0.05; // CV means the size of stdDev relative to the mean (thus stdDev error generated from CV is dependent on size of mean, not absolute)
	experiment.CV_Now = experiment.CV_Default;
	experiment.stdDev_relative = 0;
	experiment.stdDev_Gaussian_relative = 0; // Normal distribution is generated around input standard error and randomly picked as the final standard deviation to use

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

/* d) evaluating standard deviation to use base on time of day */
	experiment.evalStats = function() {
		if(experiment.timeOfDay < experiment.startOfDinner) {
			experiment.stdDev_Absolute = experiment.stdDev_Default;
			experiment.CV_Now = experiment.CV_Default;
		} else if(experiment.timeOfDay >= experiment.startOfDinner && experiment.timeOfDay < experiment.startOfSupper){
			experiment.stdDev_Absolute = experiment.stdDev_Default*2;
			experiment.CV_Now = experiment.CV_Default*4;
		} else {
			experiment.stdDev_Absolute = experiment.stdDev_Default*5;
			experiment.CV_Now = experiment.CV_Default*10;
		}
	};

/* e) generating absolute error at random by sampling from a normal distribution */
		// credit: http://www.protonfish.com/random.shtml
	experiment.absoluteError = function(out_fLC) {
			// adjusting stdDev against normal distribution
		experiment.stdDev_Gaussian_absolute = Math.abs(((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*experiment.stdDev_Absolute);
			// modify final result with the measurement error (note: absolute error is never negative since it is an error as a result of loss in solution during transfer by pipetting)
		if (out_fLC === 0) {
			return out_fLC; // if user is creating output for background, no absolute error is suffered
		} else {
			return out_fLC+experiment.stdDev_Gaussian_absolute;
		}
	};

/* e) generating relative error at random by sampling from a normal distribution */
		// credit: http://www.protonfish.com/random.shtml
	experiment.relativeError = function(out_fLC) {
			// calculating standard deviation of relative error from coefficient of variance
		experiment.stdDev_relative = experiment.CV_Now*out_fLC; // CV = coefficient of variance; CV = stdDev/mean, taking mean as the input value (out_fLC)
			// adjusting stdDev against normal distribution
		experiment.stdDev_Gaussian_relative = ((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*experiment.stdDev_relative;
			// deciding if stdDev will add or subtract the mean
		experiment.flip_plusOrMinus = Math.random()*2;
		if (experiment.flip_plusOrMinus > 1) {
			experiment.plusOrMinus = 1;
		} else {
			experiment.plusOrMinus = -1;
		}
			// modify final result with the measurement error (note: relative error can be negative since it is an error as a result of inaccurate measure of volume of solute)
		if (out_fLC === 0) {
			return out_fLC; // if user is creating output for background, no relative error is suffered
		} else {
			return out_fLC+experiment.plusOrMinus*experiment.stdDev_Gaussian_relative;
		}
	};
}
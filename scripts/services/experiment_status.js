	/* Experimental Status: contain functions to ouput values for state of experiment and gamification elements */

/* 1. registering modules, services and constants */
angular.module('experiment_status', ['system_model'])
	.service('experimentStatus', ['systemModel', experimentTrack]);

function experimentTrack(systemModel) { 
	var experiment = this;
	var system = systemModel;

		// creating concept for time of day to alter output standard deviation
	experiment.timePerRun = 0.5;
	experiment.timePerBreak = 1.5;
	experiment.startOfDay = 9.5;
	experiment.startOfLunch = 12.0; // total runs with good SD per day = 13
	experiment.startOfDinner = 17.0;
	experiment.startOfSupper = 21.0;
	experiment.endOfDay = 24.0; // total runs per day = 23
		// creating tracked variables
	experiment.steps = 0;
	experiment.timeOfDay = 9.5;
	experiment.daysAllowed = 2; 
	experiment.daysLeft = 2;
	experiment.endOfExperimentTime = 0; // total runs with good SD per simulation = 26; total runs per simulation = 46
		// creating variables for error generation module
			// for absolute error
	experiment.stdDev_Default = 0.000000004; // Need to figure out the right level of variation for concentration; currently default variation is at nM level
	experiment.stdDev_Absolute = experiment.stdDev_Default; // starting with default level and increase as it passes different time point
	experiment.stdDev_Gaussian_absolute = 0; // Normal distribution is generated around input standard error and randomly picked as the final standard deviation to use
			// for relative error
	experiment.CV_Default = 0.12; // CV means the size of stdDev relative to the mean (thus stdDev error generated from CV is dependent on size of mean, not absolute)
	experiment.CV_Now = experiment.CV_Default;
	experiment.stdDev_relative = 0;
	experiment.stdDev_Gaussian_relative = 0; // Normal distribution is generated around input standard error and randomly picked as the final standard deviation to use
		// gamification combo tracked variables
	experiment.comboStreak = 0;
	experiment.comboStreakMax = 7;
	experiment.isDisabled_comboOne = false;
	experiment.isDisabled_comboTwo = false;
	experiment.isDisabled_comboThree = false;
	experiment.isDisabled_comboFour = false;
	experiment.isDisabled_comboFive = false;
	experiment.isDisabled_comboSix = false;
	experiment.isDisabled_comboSeven = false;
	experiment.isDisabled_comboOne_msg = true;
	experiment.isDisabled_comboTwo_msg = true;
	experiment.isDisabled_comboThree_msg = true;
	// combo four uses view.EqTimeReachedOnce
	experiment.isDisabled_comboFive_msg = true;
	experiment.isDisabled_comboSix_msg = true;
	// combo seven uses view.isDisabled_background
		// values for efficiency calculator
	experiment.inefficiency = 0;
	experiment.efficiencyRating = 100;
	experiment.bufferTimeAllowed = 5; // seconds
	experiment.optimum_steps = 26;
	experiment.min_inefficiency = 100/experiment.optimum_steps; // 100 = total efficiency points, 26 = optimum steps

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

/* f) generating relative error at random by sampling from a normal distribution */
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
			return Math.abs(out_fLC+experiment.plusOrMinus*experiment.stdDev_Gaussian_relative);
		}
	};


/* l) efficiency calculator */
	experiment.efficiencyCalculator = function(new_fLC, new_timeOn) {
		if (new_fLC === 0) { // user are not penalise for running to obtain background
			experiment.inefficiency = 0; 
		} else {
			experiment.checkTimeInefficiency = (new_timeOn-experiment.bufferTimeAllowed)/system.min_timeOn; // check proportion of how much time on input (with 5 seconds buffer allowed) is over minimum time on necessary for 1 nM to reach equilibrium
			if (experiment.checkTimeInefficiency > 1) { // if user time input is above limit allowed, then efficiency points starts deducting
				experiment.inefficiency = (experiment.min_inefficiency)*experiment.checkTimeInefficiency; // minimum inefficiency per step is scaled by how much over time user input above minimum time on;
			} else {
				experiment.inefficiency = 0;
			}
		}
		experiment.efficiencyRating = Math.max(((Math.round(100*(experiment.efficiencyRating-experiment.inefficiency)))/100), 0); // Math.max is set such that efficiencyRating cannot get below 0
		experiment.inefficiency_display = (Math.round(experiment.inefficiency*100))/100;
	};

/* g) game combo 1: check 3 replicates for outlier */
	experiment.check_outlier_Replicates = function(out_fLC_input) {
		experiment.fLC_sorted = (angular.copy(out_fLC_input)).sort();
		for (var i = 0; i < experiment.fLC_sorted.length; i++) {
			if ((experiment.fLC_sorted[i] == experiment.fLC_sorted[i+2]) && (experiment.isDisabled_comboOne === false)) {
				experiment.comboStreak++;
				experiment.isDisabled_comboOne = true;
				experiment.isDisabled_comboOne_msg = false;
			}
		}
	};

/* h) game combo 2: check 6 replicates for statistics */
	experiment.check_statistics_Replicates = function(out_fLC_input) {
		experiment.fLC_sorted = (angular.copy(out_fLC_input)).sort();
		for (var i = 0; i < experiment.fLC_sorted.length; i++) {
			if ((experiment.fLC_sorted[i] == experiment.fLC_sorted[i+5]) && (experiment.isDisabled_comboTwo === false)) {
				experiment.comboStreak++;
				experiment.isDisabled_comboTwo = true;
				experiment.isDisabled_comboTwo_msg = false;
			}
		}
	};

/* i) game combo 3: check 6 different fLC input made */
	experiment.check_six_unique_fLC = function(out_fLC_input) {
		experiment.fLC_sorted = (angular.copy(out_fLC_input)).sort();
		for (var i = 0; i < experiment.fLC_sorted.length; i++) {
			if (experiment.fLC_sorted[i] !== experiment.fLC_sorted[i+1] && experiment.fLC_sorted[i] !== 0) {
				experiment.unique_fLC++;
			}
		}
		if (experiment.unique_fLC == 6 && experiment.isDisabled_comboThree === false) {
			experiment.comboStreak++;
			experiment.isDisabled_comboThree = true;
			experiment.isDisabled_comboThree_msg = false;
		} else {
			experiment.unique_fLC = 0;
		}
	};

/* j) game combo 4: check universal equilibrium time found */
	experiment.check_univEqFound = function(out_timeOn) {
		if (system.min_timeOn <= out_timeOn && experiment.isDisabled_comboFour === false) {
			experiment.comboStreak++;
			experiment.isDisabled_comboFour = true;
		}
	};

/* k) game combo 5: check confirm saturation reached */
	experiment.check_confirmSaturation = function(out_RU_On_Output_table, out_RU_saturation) {
		experiment.saturation_round = (Math.round(out_RU_saturation/10)*10);
		experiment.out_sorted = (angular.copy(out_RU_On_Output_table)).sort();
		experiment.out_sorted_round = [];
		for (var i = 0; i < experiment.fLC_sorted.length; i++) {
			experiment.out_sorted_round.push((Math.round((experiment.out_sorted[i]+10)/10))*10); // buffer of 10 RU allowed
			if ((experiment.out_sorted_round[i] >= experiment.saturation_round) && (experiment.out_sorted_round[i] == experiment.out_sorted_round[i-1]) && experiment.isDisabled_comboFive === false) { // -1 = similar to the one behind, since there is no number in front yet
				experiment.comboStreak++;
				experiment.isDisabled_comboFive = true;
				experiment.isDisabled_comboFive_msg = false;
			}
		}
	};

/* l) game combo 6: check broad sampling strategy used */
	experiment.check_broadSampling = function(out_fLC_input) {
		if (experiment.isDisabled_comboSix === false) {
			experiment.check_nM_sampling = false;
			experiment.check_mM_sampling = false;
			for (var i = 0; i < out_fLC_input.length; i++) {
				if (out_fLC_input[i] < 0.000001) {
					experiment.check_nM_sampling = true;
				}
				if (out_fLC_input[i] >= 0.001) {
					experiment.check_mM_sampling = true;
				}
				if (experiment.check_nM_sampling === true && experiment.check_mM_sampling === true){
					experiment.comboStreak++;
					experiment.isDisabled_comboSix = true;
					experiment.isDisabled_comboSix_msg = false;
				}
			}
		}
	};

/* m) game combo 7: check if background is set */
	experiment.check_backgroundSet = function(view_background) {
		if (view_background !== 0 && experiment.isDisabled_comboSeven === false) {
			experiment.comboStreak++;
			experiment.isDisabled_comboSeven = true;
		}
	};
}
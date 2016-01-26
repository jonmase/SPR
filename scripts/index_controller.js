	/* Main Controller: executes all Services onto the View */

/* 1. master module to compile in all sub-modules for embedding ng-app in HTML */
var app = angular.module('SPR', ['model', 'display', 'cookies'])
	.constant('vol', 0.000001) // volume inside chip
	.constant('RPUM', 5000000000) // response per unit mass (RU/g)
	.controller('viewCtrl', viewMethod);

/* 2. setting up controller */
viewMethod.$inject = ['systemModel', 'outputModel', 'experimentStatus', 'chartConfig', 'tableConfig', '$location',  '$cookies', 'vol', 'RPUM']; // injecting services and constant into viewMethod function

function viewMethod(systemModel, outputModel, experimentStatus, chartConfig, tableConfig, $location, $cookies, vol, RPUM) {	// declaring services and constant relationship to viewMethod
/* a) define how different dependencies are called it out onto the view */
	var view = this;
	view.system = systemModel;
	view.output = outputModel;
	view.experiment = experimentStatus;
	view.chart = chartConfig;
	view.table = tableConfig;
	view.cookies = $cookies;
	view.vol = vol;
	view.RPUM = RPUM;
		// metrics tracked in database
	view.user_type = [];
	view.startTime = [];
	view.endTime = [];
	view.elapsed = []; // seconds from time defining user_type until all_Correct = true
	view.sessionStepsCount = [];
	view.sessionEfficiencyCount = [];
	view.sessionCheckCount = [];
	view.checkResults = [];
		// default function of various buttons
	view.guideMode = false;
	view.checkCounter = 0;
	view.checkResults_bySession = [];
	view.backgroundSet = 0;
	view.backgroundUnitsSet = null;
	view.isDisabled_background = false;
	view.isDisabled_run = false;
	view.isDisabled_wash = true;
	view.isDisabled_check = true;
	view.magnitudeCheck_Kd = [1000, 1000000, 1000000000];
	view.magnitudeCheck_kOn = [1000000, 1000, 1];
	view.allowedAnswerDeviation = 0.2; // answer input must be within this confidence limit range of the true answer
	view.Kd_correct = false;
	view.kOn_correct = false;
	view.kOff_correct = false;
	view.all_Correct = false;
		// stored cookies data
	view.cookiesData = {};

/* b) creating function for set "zero" button */
	view.set_background = function() {
		view.backgroundSet = angular.copy(view.output.RU_On_Output[view.output.RU_On_Output.length-1]);
		view.backgroundUnitsSet = angular.copy(view.output.unitAdjust);
		view.isDisabled_background = true;
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.output.minimum_fLC_input = 1;
	};

/* c) creating function for "run experiment" button  */
	view.runExperiment = function (new_magnitudeSelected, new_fLC, new_timeOn) {
		view.experiment.evalStats();
		view.output.magnitudeAdjust = view.output.magnitudePool[new_magnitudeSelected];
		view.output.unitAdjust = view.output.unitPool[new_magnitudeSelected];
		view.output.add_fLC(new_fLC);
		view.output.add_timeOn(new_timeOn);
		view.output.calc_RU_OnPeak(view.system.RU_MaxL, view.output.fLC[view.experiment.steps], view.system.Kd, view.system.kOn, view.system.kOff, view.system.RU0, view.backgroundSet);
		view.output.calc_RU_OnMax(view.system.RU_MaxL, view.output.fLC[view.experiment.steps], view.system.Kd, view.system.kOn, view.system.kOff, view.system.RU0, view.backgroundSet);
		view.output.plotCoordinatesOn(new_timeOn, view.output.currentStep, view.output.totalSteps, view.system.RU_MaxL, view.output.fLC[view.experiment.steps], view.system.Kd, view.system.kOn, view.system.kOff, view.system.RU0, view.backgroundSet);
		view.output.plotCompileLabelOn();
		view.experiment.stepsCounter();
		view.experiment.timeOfDayCounter();
		view.output.efficiencyCalculator(new_timeOn);
		view.isDisabled_run = true;
		view.isDisabled_wash = false;
		view.isDisabled_check = true;
	};

/* d) creating function for "wash-up" button */
	view.washUp = function() {
		view.output.timeOffDefault = view.system.min_timeOff;
		view.output.plotCoordinatesOff(view.output.currentStep, view.output.totalSteps, view.output.timeOn[view.output.timeOn.length-1], view.system.kOff, view.system.RU0, view.backgroundSet);
		view.output.plotCompileLabelOff();
		view.table.compileData(angular.copy(view.experiment.steps), view.output.fLC_tableDisplay[view.output.fLC_tableDisplay.length-1]*view.output.magnitudeAdjust, view.output.timeOn[view.output.timeOn.length-1], (view.output.RU_On_Output_table[view.output.RU_On_Output_table.length-1]).toFixed(4));
		view.isDisabled_run = false;
		view.isDisabled_wash = true;
		view.isDisabled_check = true;
		view.compileCookiesData();
		view.cookies.putObject("storedData", view.cookiesData);
	}; 

/* e) creating function for "home" button */
	view.goHome = function() {
		view.experiment.endOfExperimentTime = angular.copy(view.experiment.timeOfDay);
		view.experiment.timeOfDay = view.experiment.startOfDay;
		view.experiment.dayOfExperimentCounter();
		view.isDisabled_check = true;
	};

/* f) creating function for "clear graph" button */
	view.clearChart = function() {
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.isDisabled_check = true;
	};

/* g) creating a function for "restart" button */
	view.restart = function() {
			// for backend
		if (view.all_Correct === false) {
			view.sessionStepsCount.push(angular.copy(view.experiment.steps));
			view.sessionEfficiencyCount.push(angular.copy(view.output.efficiencyRating));
			view.sessionCheckCount.push(angular.copy(view.checkCounter));
			view.checkResults.push(angular.copy(view.checkResults_bySession.toString()));
			view.endTime.push(angular.copy(Date.now()));
			view.elapsed.push(angular.copy(Math.round((view.endTime[view.endTime.length-1]-view.startTime[view.startTime.length-1])/1000)));
			view.user_type.push(angular.copy("restart"));
			view.startTime.push(angular.copy(Date.now())); // create a new session
		} else {
			view.user_type.push(angular.copy("restart"));
			view.startTime.push(angular.copy(Date.now())); // create a new session
		}
			// reset experiment status
		view.experiment.daysLeft = view.experiment.daysAllowed;
		view.experiment.timeOfDay = view.experiment.startOfDay;
		view.output.efficiencyRating = 100;
		view.experiment.steps = 0;
		view.checkCounter = 0;
		view.checkResults_bySession.length = 0;
		view.backgroundSet = 0;
		view.backgroundUnitsSet = null;
		view.isDisabled_background = false;
			// remove all data in existing arrays
		view.output.fLC.length = 0;
		view.output.timeOn.length = 0;
		view.output.RU_On_Output.length = 0;
		view.output.RU_On_Coordinate.length = 0;
		view.output.RU_Off_Coordinate.length = 0;
		view.output.RU_Line.length = 0;
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.table.data.length = 0;
		view.isDisabled_run = false;
		view.isDisabled_wash = true;
		view.isDisabled_check = true;
		view.cookies.remove("storedData");
	};

/* h) creating a function for "check" answer button */
	view.check = function(check_Kd, check_kOn, check_kOff, magnitudeCheck_Kd, magnitudeCheck_kOn) {
		view.isDisabled_check = false;
		view.checkCounter++;
			// check if Kd answer is within acceptable range
		if (check_Kd/view.magnitudeCheck_Kd[magnitudeCheck_Kd] > (1-view.allowedAnswerDeviation)*view.system.Kd && check_Kd/view.magnitudeCheck_Kd[magnitudeCheck_Kd] < (1+view.allowedAnswerDeviation)*view.system.Kd) {
			view.Kd_correct = true;
		} else {
			view.Kd_correct = false;
		}
			// check if kOn answer is within acceptable range
		if (check_kOn*view.magnitudeCheck_kOn[magnitudeCheck_kOn] > (1-view.allowedAnswerDeviation)*view.system.kOn && check_kOn*view.magnitudeCheck_kOn[magnitudeCheck_kOn] < (1+view.allowedAnswerDeviation)*view.system.kOn) {
			view.kOn_correct = true;
		} else {
			view.kOn_correct = false;
		}
			// check if kOff answer is within acceptable range
		if (check_kOff > (1-view.allowedAnswerDeviation)*view.system.kOff && check_kOff < (1+view.allowedAnswerDeviation)*view.system.kOff) {
			view.kOff_correct = true;
		} else {
			view.kOff_correct = false;
		}
			// if all answer correct, trigger action
		if (view.Kd_correct === true && view.kOn_correct === true && view.kOff_correct === true) {
			view.all_Correct = true;
			view.sessionStepsCount.push(angular.copy(view.experiment.steps));
			view.sessionEfficiencyCount.push(angular.copy(view.output.efficiencyRating));
			view.sessionCheckCount.push(angular.copy(view.checkCounter));
			view.endTime.push(angular.copy(Date.now()));
			view.elapsed.push(angular.copy(Math.round((view.endTime[view.endTime.length-1]-view.startTime[view.startTime.length-1])/1000)));
			view.checkResults_bySession.push("correct");
			view.checkResults.push(angular.copy(view.checkResults_bySession.toString()));
			view.cookies.remove("storedData");
			view.cookiesData = {};
				// jQuery to change the color of hamburger menu icon on results table so users will notice
			/* 
			$("#button_active").css("background-color", "red");
			$("#icon_active").css("color", "white"); 
			*/
		} else {
			view.all_Correct = false;
			view.checkResults_bySession.push("wrong");
		}
	};

/* i) change system */
	view.change = function(change_Kd, change_kOn, change_kOff, magnitudeChange_Kd, magnitudeChange_kOn) {
		view.system.Kd = change_Kd/view.magnitudeCheck_Kd[magnitudeChange_Kd];
		view.system.kOn = change_kOn*view.magnitudeCheck_kOn[magnitudeChange_kOn];
		view.system.kOff = change_kOff;
		view.system.uniqueID = "custom";
	};

/* i) creating functions to track if learn or mastery user */
	view.learn_user = function() {
		view.user_type.push(angular.copy("learn"));
		view.guideMode = true;
		view.startTime.push(angular.copy(Date.now()));
	};

	view.mastery_user = function() {
		view.user_type.push(angular.copy("mastery"));
		view.guideMode = false;
		view.startTime.push(angular.copy(Date.now()));
	};

/* j) creating functions for play again button */
	view.replay = function(){
			// for backend
		if (view.all_Correct === false) {
			view.sessionStepsCount.push(angular.copy(view.experiment.steps));
			view.sessionEfficiencyCount.push(angular.copy(view.output.efficiencyRating));
			view.sessionCheckCount.push(angular.copy(view.checkCounter));
			view.checkResults.push(angular.copy(view.checkResults_bySession.toString()));
			view.endTime.push(angular.copy(Date.now()));
			view.elapsed.push(angular.copy(Math.round((view.endTime[view.endTime.length-1]-view.startTime[view.startTime.length-1])/1000)));
		}
			// reset experiment status
		view.system.loadNewPair(view.vol, view.RPUM);
		view.experiment.daysLeft = view.experiment.daysAllowed;
		view.experiment.timeOfDay = view.experiment.startOfDay;
		view.output.efficiencyRating = 100;
		view.experiment.steps = 0;
		view.checkCounter = 0;
		view.checkResults_bySession.length = 0;
		view.backgroundSet = 0;
		view.backgroundUnitsSet = null;
		view.isDisabled_background = false;
			// remove all data in existing arrays
		view.output.fLC.length = 0;
		view.output.timeOn.length = 0;
		view.output.RU_On_Output.length = 0;
		view.output.RU_On_Coordinate.length = 0;
		view.output.RU_Off_Coordinate.length = 0;
		view.output.RU_Line.length = 0;
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.table.data.length = 0;
		view.isDisabled_run = false;
		view.isDisabled_wash = true;
		view.isDisabled_check = true;
		view.cookies.remove("storedData");
	};

/* k) create function to compile all relevant data to save into cookies */
	view.compileCookiesData = function() {
		view.cookiesData = {
				// stored system
			stored_tRC: view.system.tRC,
			storedKd: view.system.Kd,
			stored_kOff: view.system.kOff,
			stored_mwL: view.system.mwL,
			stored_mwR: view.system.mwR,
				// stored experiment status
			storedDaysLeft: view.experiment.daysLeft,
			storedTimeOfDay: view.experiment.timeOfDay,
			store_effRating: view.output.efficiencyRating,
			storedSteps: view.experiment.steps,
			stored_backgroundSet: view.backgroundSet,
			stored_backgroundUnitsSet: view.backgroundUnitsSet,
				// stored output
			store_tableData: view.table.data,
			store_fLC: view.output.fLC,
			store_timeOn: view.output.timeOn,
				// stored backend values
			store_userType: view.user_type,
			store_startTime: view.startTime,
			store_endTime: view.endTime,
			store_elapsed: view.elapsed,
			store_sessionStepCount: view.sessionStepsCount,
			store_sessionEfficiencyCount: view.sessionEfficiencyCount,
			store_sessionCheckCount: view.sessionCheckCount,
			store_checkResults: view.checkResults
		};
	};

/* l) functions to run when starting the software */
		// open initialising modal window if no cookies, if not check if restarting or continue
	if (view.cookies.getObject("storedData")) {
			// load cookies data
		view.cookiesData = view.cookies.getObject("storedData");
			// set system to as stored
		view.system.tRC = view.cookiesData.stored_tRC;
		view.system.Kd = view.cookiesData.storedKd;
		view.system.kOff = view.cookiesData.stored_kOff;
		view.system.mwL = view.cookiesData.stored_mwL;
		view.system.mwR = view.cookiesData.stored_mwR;
		view.system.calculateSystem(view.vol, view.RPUM);
			// set experiment status to as stored
		view.experiment.daysLeft = view.cookiesData.storedDaysLeft;
		view.experiment.timeOfDay = view.cookiesData.storedTimeOfDay;
		view.output.efficiencyRating = view.cookiesData.store_effRating;
		view.experiment.steps = view.cookiesData.storedSteps;
		view.backgroundSet = view.cookiesData.stored_backgroundSet;
		view.backgroundUnitsSet = view.cookiesData.stored_backgroundUnitsSet;
			// set output to as stored
		for (var i = 0; i < view.cookiesData.store_tableData.length; i++) {
			view.table.data.push(view.cookiesData.store_tableData[i]);
		}
		view.output.fLC = view.cookiesData.store_fLC;
		view.output.timeOn = view.cookiesData.store_timeOn;
			// set backend values as stored
		view.user_type = view.cookiesData.store_userType;
		view.startTime = view.cookiesData.store_startTime;
		view.endTime = view.cookiesData.store_endTime;
		view.elapsed = view.cookiesData.store_elapsed;
		view.sessionStepsCount = view.cookiesData.store_sessionStepCount;
		view.sessionEfficiencyCount = view.cookiesData.store_sessionEfficiencyCount;
		view.sessionCheckCount = view.cookiesData.store_sessionCheckCount;
		view.checkResults = view.cookiesData.store_checkResults;
		$(window).load(function(){$('#cookies_modal').modal('show');});
		$('#cookies_modal').modal({backdrop: 'static',keyboard: false});
	} else {
		view.system.loadNewPair(view.vol, view.RPUM);
		view.experiment.daysLeft = view.experiment.daysAllowed;
		view.experiment.timeOfDay = view.experiment.startOfDay;
		$(window).load(function(){$('#initialising_modal').modal('show');});
		$('#initialising_modal').modal({backdrop: 'static',keyboard: false});
	}
}
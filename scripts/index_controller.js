	/* Main Controller: executes all Services onto the View */

/* 1. master module to compile in all sub-modules for embedding ng-app in HTML */
var app = angular.module('SPR', ['model', 'display', 'cookies'])
	.constant('vol', 0.000001) // volume inside chip
	.constant('RPUM', 1000000000) // response per unit mass (RU/g)
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
	view.user_type = null;
	view.restartCounter = 0;
	view.replayCounter = 0;
	view.checkCounter = 0;
	view.finishedStepsCount = [];
	view.finishedEfficiencyCount = [];
		// default function of various buttons
	view.initialising = true;
	view.guideMode = false;
	view.backgroundSet = 0;
	view.backgroundUnitsSet = null;
	view.isDisabled_background = false;
	view.isDisabled_run = false;
	view.isDisabled_wash = true;
	view.isDisabled_check = true;
	view.magnitudeCheck_Kd = [1000, 1000000, 1000000000];
	view.magnitudeCheck_kOn = [1000000, 1000, 1];
	view.Kd_correct = false;
	view.kOn_correct = false;
	view.kOff_correct = false;
	view.all_Correct = false;
		// stored cookies data
	/*
	view.storedDataPrompt = false;
	view.cookiesData = {
			// stored system
		stored_tRC: view.system.tRC,
		storedKd: view.system.Kd,
		stored_kOff: view.system.kOff,
		stored_mwL: view.system.mwL,
		stored_mwR: view.system.mwR,
			// stored experiment status
		storedSteps: view.experiment.steps,
		storedTimeOfDay: view.experiment.timeOfDay,
			// stored output
		stored_fLC_tableDisplay: view.output.fLC_tableDisplay,
		stored_fLC: view.output.fLC,
		store_timeOn: view.output.timeOn,
		storeRU_On_Output: view.output.RU_On_Output,
		store_tableData: view.table.data
	};

	b) creating functions for the cookies prompt 
	view.continueSaved = function() {
		view.storedDataPrompt = false; // close the prompt
	};
*/

/* c) creating function for set "zero" button */
	view.set_background = function() {
		view.backgroundSet = angular.copy(view.output.RU_On_Output[view.output.RU_On_Output.length-1]);
		view.backgroundUnitsSet = angular.copy(view.output.unitAdjust);
		view.isDisabled_background = true;
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.output.minimum_fLC_input = 1;
	};

/* d) creating function for "run experiment" button  */
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
		// view.cookies.putObject("storedData", view.cookiesData);
	};

/* e) creating function for "wash-up" button */
	view.washUp = function() {
		view.output.plotCoordinatesOff(view.output.currentStep, view.output.totalSteps, view.output.timeOn[view.output.timeOn.length-1], view.system.kOff, view.system.RU0, view.backgroundSet);
		view.output.plotCompileLabelOff();
		view.table.compileData(angular.copy(view.experiment.steps), view.output.fLC_tableDisplay[view.output.fLC_tableDisplay.length-1]*view.output.magnitudeAdjust, view.output.timeOn[view.output.timeOn.length-1], (view.output.RU_On_Output_table[view.output.RU_On_Output_table.length-1]).toFixed(4));
		view.isDisabled_run = false;
		view.isDisabled_wash = true;
		// view.cookies.putObject("storedData", view.cookiesData);
		view.isDisabled_check = true;
	}; 

/* f) creating function for "home" button */
	view.goHome = function() {
		view.experiment.endOfExperimentTime = angular.copy(view.experiment.timeOfDay);
		view.experiment.timeOfDay = view.experiment.startOfDay;
		view.experiment.dayOfExperimentCounter();
		view.isDisabled_check = true;
	};

/* g) creating function for "clear graph" button */
	view.clearChart = function() {
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.isDisabled_check = true;
	};

/* h) creating a function for "restart" button */
	view.restart = function() {
		view.experiment.daysLeft = view.experiment.daysAllowed;
		view.experiment.timeOfDay = view.experiment.startOfDay;
		view.output.machineTime = 0;
		view.experiment.steps = 0;
			// remove all data in existing arrays
		view.output.fLC.length = 0;
		view.output.timeOn.length = 0;
		view.output.RU_On_Output.length = 0;
		view.output.RU_On_Coordinate.length = 0;
		view.output.RU_Off_Coordinate.length = 0;
		view.output.RU_Line.length = 0;
		view.output.RU_CompiledLabelPlotAll.length = 0;
		view.table.data.length = 0;
		view.restartCounter++;
		view.checkCounter = 0;
		view.isDisabled_run = false;
		view.isDisabled_wash = true;
		view.isDisabled_check = true;
	};

/* i) creating a function for "check" answer button */
	view.check = function(check_Kd, check_kOn, check_kOff, magnitudeCheck_Kd, magnitudeCheck_kOn) {
		view.isDisabled_check = false;
		view.checkCounter++;
			// check if Kd answer is within acceptable range
		if (check_Kd/view.magnitudeCheck_Kd[magnitudeCheck_Kd] > 0.99*view.system.Kd && check_Kd/view.magnitudeCheck_Kd[magnitudeCheck_Kd] < 1.01*view.system.Kd) {
			view.Kd_correct = true;
		} else {
			view.Kd_correct = false;
		}
			// check if kOn answer is within acceptable range
		if (check_kOn*view.magnitudeCheck_kOn[magnitudeCheck_kOn] > 0.99*view.system.kOn && check_kOn*view.magnitudeCheck_kOn[magnitudeCheck_kOn] < 1.01*view.system.kOn) {
			view.kOn_correct = true;
		} else {
			view.kOn_correct = false;
		}
			// check if kOff answer is within acceptable range
		if (check_kOff > 0.99*view.system.kOff && check_kOff < 1.01*view.system.kOff) {
			view.kOff_correct = true;
		} else {
			view.kOff_correct = false;
		}
			// if all answer correct, trigger action
		if (view.Kd_correct === true && view.kOn_correct === true && view.kOff_correct === true) {
			view.all_Correct = true;
			view.finishedStepsCount.push(angular.copy(view.experiment.steps));
			view.finishedEfficiencyCount.push(angular.copy(view.output.efficiencyRating));
				// jQuery to change the color of hamburger menu icon on results table so users will notice
			$("#button_active").css("background-color", "red");
			$("#icon_active").css("color", "white");
		} else {
			view.all_Correct = false;
		}
	};

/* j) creating functions to track if new or returning user */
	view.new_user = function() {
		view.user_type = "new";
		view.guideMode = true;
	};

	view.returning_user = function() {
		view.user_type = "returning";
		view.guideMode = false;
	};

/* j) creating functions for play again button */
	view.replay = function(){
		/* view.cookies.remove("storedData"); */
		view.system.loadNewPair(view.vol, view.RPUM);
		view.restart();
		view.replayCounter++;
		/* view.storedDataPrompt = false; */
	};


/* j) initialise application to generate unique values for the new system, else load previous experiment state from cookies

	if (view.cookies.getObject("storedData") === undefined) { // if there are no data, generate a new system
*/		view.system.loadNewPair(view.vol, view.RPUM);
		view.output.timeOffDefault = view.system.min_timeOff;
/*		view.storedDataPrompt = false;
		view.cookies.putObject("storedData", view.cookiesData);
	} else { // load stored data
		view.cookies.getObject("storedData");
			// set system to as stored
		view.system.tRC = view.cookiesData.stored_tRC;
		view.system.Kd = view.cookiesData.storedKd;
		view.system.kOff = view.cookiesData.stored_kOff;
		view.system.find_kOn(view.system.Kd, view.system.kOff);
		view.system.mwL = view.cookiesData.stored_mwL;
		view.system.mwR = view.cookiesData.stored_mwR;
		view.system.find_mwLR(view.system.mwL, view.system.mwR);
		view.system.find_RU_Max(view.system.tRC, view.system.mwR, view.vol, view.RPUM, view.system.mwL, view.system.mwLR);
		view.system.uniqueID(view.system.Kd, view.system.kOff, view.system.kOn);
			// set experiment status to as stored
		view.experiment.steps = view.cookiesData.storedSteps;
		view.experiment.timeOfDay = view.cookiesData.storedTimeOfDay;
			// set output to as stored
		view.output.fLC_tableDisplay = view.cookiesData.stored_fLC_tableDisplay;
		view.output.fLC = view.cookiesData.stored_fLC;
		view.output.timeOn = view.cookiesData.store_timeOn;
		view.output.RU_On_Output = view.cookiesData.storeRU_On_Output;
		view.table.data = view.cookiesData.store_tableData;
		view.storedDataPrompt = true;
	}
*/
}
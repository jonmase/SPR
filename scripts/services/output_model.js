	/* Output Mathematical Model: contain functions to input user-generated parameters and ouput values for graphical display */

/* 1. registering modules, services and constants */
angular.module('output_model', ['cookies', 'experiment_status', 'system_model'])
	.service('outputModel', ['experimentStatus', 'systemModel', '$cookies', outputMethod]);

function outputMethod(experimentStatus, systemModel, $cookies) { 

/* 2. creating sub-methods as part of the function object that can be outputed */

/* a) all the data to be stored */
	var output = this; // create a specific selector for outputMethod specific module required in plotCoordinates but used with 'all or nothing' principle
	var experiment = experimentStatus;
	var system = systemModel;
		// data input value
	output.fLC_tableDisplay = []; // units = M but no error adjusted; input fLC value specify by the user, display on table and charts so user can track progress
	output.fLC = []; // units = M but error adjusted; actual fLC value use in plotting as adjusted by standard error
	output.timeOn = []; // timeOn must be > 0
	output.timeOffDefault = 20; // set timeOff to 20 seconds for default
	output.minimum_fLC_input = 0;
		// tracked value
	output.machineTime = 0;
	output.inefficiency = 0;
	output.efficiencyRating = 100;
		// chart coordinates calculation
	output.RU_On_Output = []; // store current peak value of RU On for this fLC and input time on
	output.RU_On_Output_table = [];
	output.RU_On_Max = []; // store theoretical max value of RU On for this fLC
	output.RU_On_Coordinate = []; // store RU vs timeOn data into [x,y] coordinates before pushing into Line
	output.RU_Line = []; // store all coordinates to plot line in [[x1,y1],[x2,y2],[x3,y3]] format for plotting
	output.RU_Off_Coordinate = [];
	output.RU_CompiledLabelPlotAll = []; // store all plot into format that adds label of [{label: "abc1", data: [line1]}, {label: "abc2", data: [line2]}...] for overlapping display
	output.currentStep = 0;
	output.totalSteps = 100; // set number of intermediates coordinates to produce
		// custom chart color
	output.colorPool = ["rgb(179, 106, 226)", "rgb(236, 93, 87)", "rgb(243, 144, 25)", "rgb(245, 211, 10)", "rgb(112, 195, 65)", "rgb(81, 167, 249)", "rgb(108, 115, 124)", "rgb(218, 209, 155)", "rgb(211, 182, 176)", "rgb(204, 204, 204)"];
	output.colorCounter = 0; // to customise color and also make on and off line having the same color
		// units conversion
	output.magnitudePool = [1000, 1000000, 1000000000]; 
	output.unitPool = ["mM", "uM", "nM"];
	output.magnitudeAdjust = null; // default input unit of magnitude and unit adjust can be altered at the radio button ng-init
	output.unitAdjust = null;

/* b) set fLC: user input via form; variable */
	output.add_fLC = function(new_fLC) {
		output.fLC_tableDisplay.push(new_fLC/output.magnitudeAdjust); // divided by magnitudeAdjust to convert input of various units (mM, uM, nM) into the uniform units of M for later processing
		output.fLC.push(experiment.absoluteError(experiment.relativeError(new_fLC/output.magnitudeAdjust))); // relative error first from measurement error, then absolute error from pipetting error
	};

/* c) set timeOn: user input via form; variable */
	output.add_timeOn = function(new_timeOn) {
		output.timeOn.push(new_timeOn);
	};

/* d) find RU_On: derived from 2nd order association formula; variable */
	output.calc_RU_On = function(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, out_timeOn, out_RU0, backgroundSet) {
		output.RU_On = ((out_RU_MaxL*out_fLC)/(sys_Kd+out_fLC))*(1-Math.pow(Math.E,-(sys_kOn*out_fLC+sys_kOff)*out_timeOn));
		output.RU_OnAdjusted = output.RU_On+out_RU0-backgroundSet;
	};

/* e) find and store the current RU peak for a given input fLC and time on */
	output.calc_RU_OnPeak = function(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, out_RU0, backgroundSet) {
		output.calc_RU_On(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, output.timeOn[output.timeOn.length-1], out_RU0, backgroundSet);
		output.RU_On_Output_table.push(angular.copy(((Math.round(10000*output.RU_OnAdjusted))/10000))); // x10000 to round off value to 4 decimal place
		output.RU_On_Output.push(angular.copy(output.RU_OnAdjusted));
	};
/* f) find and store the theoretical max RU peak for a given input fLC */
	output.calc_RU_OnMax = function(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, out_RU0, backgroundSet) {
		output.calc_RU_On(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, Infinity, out_RU0, backgroundSet);
		output.RU_On_Max.push(angular.copy(output.RU_OnAdjusted));
	};

/* g) find RU_Off: derived from 1st order disassociation formula; variable */
	output.calc_RU_Off = function(out_RU_On, sys_kOff, out_timeOff, out_RU0, backgroundSet) {
		output.RU_Off = out_RU_On*(Math.pow(Math.E, -sys_kOff*out_timeOff));
		output.RU_OffAdjusted = output.RU_Off+out_RU0-backgroundSet;
	};

/* h) compiling the plot together as a single line and add label */
	output.plotCompileLabelOn = function() {
		output.compileLabel = {
			label: angular.copy(output.fLC_tableDisplay[output.fLC_tableDisplay.length-1]*output.magnitudeAdjust)+" "+output.unitAdjust,
			data: angular.copy(output.RU_Line),
			color: output.colorPool[output.colorCounter]
		};
		output.RU_CompiledLabelPlotAll.push(angular.copy(output.compileLabel));
		output.RU_Line.length = 0; // clear temporary line generator to generate new sets of line in [[x1,y1],[x2,y2]...] format
	};

/* i) compiling the plot together as a single line and add label */
	output.plotCompileLabelOff = function() {
		output.compileLabel = {
			data: angular.copy(output.RU_Line),
			color: output.colorPool[output.colorCounter]
		};
		if (output.colorCounter < 9) {
			output.colorCounter++;
		} else {
			output.colorCounter = 0;
		}
		output.RU_CompiledLabelPlotAll.push(angular.copy(output.compileLabel));
		output.RU_Line.length = 0; // clear temporary line generator to generate new sets of line in [[x1,y1],[x2,y2]...] format
	};

/* j) generating coordinates for RU on line and plot */
	output.plotCoordinatesOn = function(out_timeOn, currentStep, totalSteps, out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, out_RU0, backgroundSet) {
			// generate RU On part of curve
		output.RU_On_Coordinate.push(currentStep*(out_timeOn/totalSteps)); // upload x coordinate
		output.calc_RU_On(out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, output.RU_On_Coordinate[0], out_RU0, backgroundSet);
		output.RU_On_Coordinate.push(output.RU_OnAdjusted); // upload y coordinate
		output.RU_Line.push(angular.copy(output.RU_On_Coordinate)); // upload [x,y] coordinate in this form
		output.RU_On_Coordinate.length = 0; // clear temporary coordinate generator for new sets of coordinates in [x,y] format		
		if(currentStep < totalSteps) { // increment step
			currentStep++;
			output.plotCoordinatesOn(out_timeOn, currentStep, totalSteps, out_RU_MaxL, out_fLC, sys_Kd, sys_kOn, sys_kOff, out_RU0, backgroundSet);
		} // now we have a line with data in format of [[x1,y1],[x2,y2]...]
	};

/* k) generating coordinates for RU off line and plot */
	output.plotCoordinatesOff = function(currentStep, totalSteps, out_timeOn, sys_kOff, out_RU0, backgroundSet) {
			// generate RU Off part of curve
		output.RU_Off_Coordinate.push(currentStep*(output.timeOffDefault/totalSteps)+out_timeOn); // shift time by out_timeOn to start after RU On curve finish
		output.intermediateTimeOff = currentStep*(output.timeOffDefault/totalSteps);		
		output.calc_RU_Off(output.RU_On_Output[output.RU_On_Output.length-1]-out_RU0+backgroundSet, sys_kOff, output.intermediateTimeOff, out_RU0, backgroundSet); // output.RU_On_Output[output.RU_On_Output.length-1] is subjected to intrinsic +out_RU0-backgroundSet, so need to remove it
		output.RU_Off_Coordinate.push(output.RU_OffAdjusted);
		output.RU_Line.push(angular.copy(output.RU_Off_Coordinate));
		output.RU_Off_Coordinate.length = 0;
		if(currentStep < totalSteps) { // increment step
			currentStep++;
			output.plotCoordinatesOff(currentStep, totalSteps, out_timeOn, sys_kOff, out_RU0, backgroundSet);
		}
	};

/* l) efficiency calculator */
	output.efficiencyCalculator = function(new_timeOn) {
		output.machineTime += new_timeOn;
		output.checkTimeInefficiency = output.machineTime/system.min_timeOn; // scaling all time input to its minimum time on to reach plateau at 1 nM (minimum time on)
		if (output.checkTimeInefficiency > 1) {
				// 10 = maximum efficiency rating, 52 = total possible steps; thus, at step = 52, the inefficiency should reach 10, and thus efficiency = 0
			output.inefficiency = (100/52)*output.checkTimeInefficiency; // minimum inefficiency per step (10/52) is scaled by how much over time user over input above minimum time on
		} else {
			output.inefficiency = 100/52; // this means that the lower ceiling of ineffiency is the minimum time on. any time on below that suffers from inefficiency by using additional steps only, which is 10/52
		}
		output.efficiencyRating = Math.max(((Math.round(100*(output.efficiencyRating-output.inefficiency)))/100), 0); // Math.max is set such that efficiencyRating cannot get below 0
	};
}
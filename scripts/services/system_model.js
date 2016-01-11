	/* System Mathematical Model: contain functions to ouput values of ligand-receptor system */

/* 1. registering modules, services and constants */
angular.module('system_model', [])
	.service('systemModel', [systemMethod]);

function systemMethod() { // creating master function object that encapsulate all methods to inject into service
	var system = this;
	system.Kd_possible = [0.00000005, 0.00000009, 0.0000003, 0.0000008, 0.0000004, 0.000007, 0.000002, 0.00001, 0.0006, 0.002];
	system.kOff_possible = [0.05, 0.2, 0.8, 1.5, 2.2, 2.9, 3.4, 4.0, 4.4, 5.0];
	system.mwL_possible = [30000, 40000, 45000, 50000, 60000];
	system.mwR_possible = [60000, 80000, 100000, 120000, 140000];

/* 2. creating sub-methods as part of the function object that can be called */

/* a) set tRC: random assignment out of 3 possibilities from model; constant */
	system.set_tRC = function() {

		flip_tRC = 3*Math.random();

		if (flip_tRC <= 1) {
			system.tRC = 0.000001;
		} else if (flip_tRC > 2) {
			system.tRC = 0.0000015;
		} else {
			system.tRC = 0.000002;
		}
	};

/* b) set Kd: random assignment out of possibility in array; constant */
	system.set_Kd = function() {
		system.flip_Kd = function() {
			system.Kd_chance = Math.floor(10*Math.random());
		};
		system.flip_Kd();

		if (system.Kd_chance == 10) {
			system.flip_Kd();
		} else {
			system.Kd = (Math.round(10000000000*(system.Kd_possible[system.Kd_chance])))/10000000000;
		}
	};

/* c) set kOff: random assignment out of possibility in array; constant */
	system.set_kOff = function() {
		system.flip_kOff = function() {
			system.kOff_chance = Math.floor(10*Math.random());
		};
		system.flip_kOff();

		if (system.flip_kOff == 10) {
			system.flip_kOff();
		} else {
			system.kOff = system.kOff_possible[system.kOff_chance];
		}
	};

/* d) find kOn: derived from kOff/Kd; constant */
	system.find_kOn = function(sys_Kd, sys_kOff) {
		system.kOn = Math.round(sys_kOff/sys_Kd);  // helps prevent problem of recurring 9999999 to occur
	};

/* e) set mwL: random assignment out of possibility in array; constant */
	system.set_mwL = function() {
		system.flip_mwL = function() {
			system.mwL_chance = Math.floor(5*Math.random());
		};
		system.flip_mwL();


		if (system.flip_mwL == 5) {
			system.flip_mwL();
		} else {
			system.mwL = system.mwL_possible[system.mwL_chance];
		}
	};

/* f) set mwR: random assignment out of possibility in array; constant */
	system.set_mwR = function() {
		system.flip_mwR = function() {
			system.mwR_chance = Math.floor(5*Math.random());
		};
		system.flip_mwR();

		if (system.flip_mwR == 5) {
			system.flip_mwR();
		} else {
			system.mwR = system.mwR_possible[system.mwR_chance];
		}
	};

/* g) find mwP: derived from mwR + mwL; constant */
	system.find_mwLR = function(sys_mwL, sys_mwR) {
		system.mwLR = sys_mwL + sys_mwR;
	};

/* h) find the RU increase when R is totally saturated by L; constant */
	system.find_RU_Max = function(sys_tRC, sys_mwR, con_vol, con_RPUM, sys_mwL, sys_mwLR) {
		system.RU0 = (Math.round(1000*(sys_tRC*sys_mwR*con_vol*con_RPUM)))/1000;
		system.RU_MaxL = (Math.round(1000*(sys_tRC*sys_mwL*con_vol*con_RPUM)))/1000;
		system.RU_MaxLR = (Math.round(1000*(sys_tRC*sys_mwLR*con_vol*con_RPUM)))/1000;
	};

/* i) calculate time on to reach 0.9999 RU at equilibrium for 1 nM free ligand concentration */
	system.find_min_timeOnOff = function() {
		system.min_timeOn = -(Math.log(0.0005)/((-system.kOn*0.000000001)+system.kOff)); // 0.0005 give a reasonable gap for single curve comparison of RU on value to check if plateau is reached
		system.min_timeOff = -Math.log(0.001)/system.kOff;
	};

/* j) generating ligand-receptor pair unique ID for demonstrator to check answer on */
	system.createID = function(sys_Kd, sys_kOff, sys_kOn) {
		system.Kd_code = $.inArray(sys_Kd, system.Kd_possible);
		system.kOff_code = $.inArray(sys_kOff, system.kOff_possible);
		system.uniqueID = 'D'+system.Kd_code.toString()+'F'+system.kOff_code.toString();
	};

/* k) load new set of receptor-ligand pair */
	system.loadNewPair = function(con_vol, con_RPUM) {
		system.set_tRC();
		system.set_Kd();
		system.set_kOff();
		system.find_kOn(system.Kd, system.kOff);
		system.set_mwL();
		system.set_mwR();
		system.find_mwLR(system.mwL, system.mwR);
		system.find_RU_Max(system.tRC, system.mwR, con_vol, con_RPUM, system.mwL, system.mwLR);
		system.find_min_timeOnOff();
		system.createID(system.Kd, system.kOff, system.kOn);
	};
/* l) calculate all derived variables from assigned variables */
	system.calculateSystem = function(con_vol, con_RPUM) {
		system.find_kOn(system.Kd, system.kOff);
		system.find_mwLR(system.mwL, system.mwR);
		system.find_RU_Max(system.tRC, system.mwR, con_vol, con_RPUM, system.mwL, system.mwLR);
		system.find_min_timeOnOff();
		system.createID(system.Kd, system.kOff, system.kOn);
	};
}
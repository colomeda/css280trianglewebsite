/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.ClassName = class {
	constructor() {

	}

	methodName() {

	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	document.querySelector('#homeButton').onclick = (event) => {
		window.location.href = "/index.html";
	}
	document.querySelector('#calendarButton').onclick = (event) => {
		window.location.href = "/calendar.html";
	}
	document.querySelector('#rushButton').onclick = (event) => {
		window.location.href = "/rush.html";
	}
	document.querySelector('#alumniButton').onclick = (event) => {
		window.location.href = "/alumni.html";
	}
	document.querySelector('#contactUsButton').onclick = (event) => {
		window.location.href = "/contactus.html";
	}
	document.querySelector('#loginButton').onclick = (event) => {
		window.location.href = "/login.html";
	}
};

rhit.main();

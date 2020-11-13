var rhit = rhit || {};

rhit.FB_COLLECTION_EVENT = "Events";
rhit.FB_KEY_EVENT = "event";
rhit.fbEventsManager = null;

rhit.Event = class {
	constructor(id, title, location, from, to) {
		this.id = id;
		this.title = title;
		this.location = location;
		this.from = from;
		this.to = to;
	}

}

rhit.CalendarPageController = class {
	constructor() {

		let today = new Date();
		let currentMonth = today.getMonth();
		let currentYear = today.getFullYear();
		let selectYear = document.getElementById("year");
		let selectMonth = document.getElementById("month");

		let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		function next() {
			currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
			currentMonth = (currentMonth + 1) % 12;
			showCalendar(currentMonth, currentYear);
		}

		function previous() {
			currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
			currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
			showCalendar(currentMonth, currentYear);
		}

		function jump() {
			currentYear = parseInt(selectYear.value);
			currentMonth = parseInt(selectMonth.value);
			showCalendar(currentMonth, currentYear);
		}

		let monthAndYear = document.getElementById("monthAndYear");
		showCalendar(currentMonth, currentYear);

		function showCalendar(month, year) {

			let firstDay = (new Date(year, month)).getDay();
			let daysInMonth = 32 - new Date(year, month, 32).getDate();

			let tbl = document.getElementById("calendar-body"); // body of the calendar

			// clearing all previous cells
			tbl.innerHTML = "";

			// filing data about month and in the page via DOM.
			monthAndYear.innerHTML = months[month] + " " + year;
			selectYear.value = year;
			selectMonth.value = month;

			// creating all cells
			let date = 1;
			for (let i = 0; i < 6; i++) {
				// creates a table row
				let row = document.createElement("tr");

				//creating individual cells, filing them up with data.
				for (let j = 0; j < 7; j++) {
					if (i === 0 && j < firstDay) {
						let cell = document.createElement("td");
						let cellText = document.createTextNode("");
						cell.appendChild(cellText);
						row.appendChild(cell);
					}
					else if (date > daysInMonth) {
						break;
					}

					else {
						let cell = document.createElement("td");
						cell.onclick = console.log("You clicked me");
						let cellText = document.createTextNode(date);
						if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
							cell.classList.add("current-date");
						} // color today's date
						cell.appendChild(cellText);
						row.appendChild(cell);
						date++;
					}


				}

				tbl.appendChild(row); // appending each row into calendar body.
			}

		}

		document.querySelector("#menuHome").addEventListener("click", (event) => {
			window.location.href = "/index.html";
		});

		document.querySelector("#menuCalendar").addEventListener("click", (event) => {
			window.location.href = "/calendar.html";
		});

		document.querySelector("#menuRush").addEventListener("click", (event) => {
			window.location.href = "/rush.html";
		});

		document.querySelector("#menuAlumni").addEventListener("click", (event) => {
			window.location.href = "/alumni.html";
		});

		document.querySelector("#menuContactUs").addEventListener("click", (event) => {
			window.location.href = "/contactus.html";
		});

		document.querySelector("#menuLogin").addEventListener("click", (event) => {
			window.location.href = "/login.html";
		});

		document.querySelector("#menuLogout").addEventListener("click", (event) => {
			window.location.href = "/index.html";
		});

		document.querySelector("#previous").addEventListener("click", (event) => {
			previous();
		});

		document.querySelector("#next").addEventListener("click", (event) => {
			next();
		});

		document.querySelector("#month").addEventListener("change", (event) => {
			jump();
		});

		document.querySelector("#year").addEventListener("change", (event) => {
			jump();
		});
	}
}

rhit.initializePage = function() {
	if(document.querySelector("#calendarPage")) {
		console.log("you are on the calendar page");
		new rhit.CalendarPageController();
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

	rhit.initializePage();
};

rhit.main();

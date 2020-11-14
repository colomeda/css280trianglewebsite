var rhit = rhit || {};

rhit.FB_COLLECTION_EVENT = "events";
rhit.FB_KEY_EVENTTYPE = "eventType"
rhit.FB_KEY_EVENT = "event";
rhit.FB_KEY_LOCATION = "location";
rhit.FB_KEY_DATE = "date";
rhit.FB_KEY_TIME = "time";
rhit.fbEventsManager = null;
rhit.fbSingleEventManager = null;
rhit.eventDates = [];
rhit.eventTypes = [];
today = new Date();
currentMonth = this.today.getMonth();
currentYear = this.today.getFullYear();

rhit.FB_COLLECTION_ALUMNI = "alumni";
rhit.FB_KEY_FULL_NAME = "full_name";
rhit.FB_KEY_EMAIL = "email";
rhit.FB_KEY_GRADUATION_YEAR = "graduation_year";
rhit.FB_KEY_MAJOR = "major";
rhit.FB_KEY_PHONE = "phone";
rhit.FB_KEY_PHOTO_LINK = "photo_link";
rhit.FB_KEY_STATE_ADDRESS = "state_address";
rhit.FB_KEY_STREET_ADDRESS = "street_address";

rhit.fbAuthManager = null;
rhit.fbAlumniManager = null;
rhit.fbSingleAlumManager = null;

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn(email, password) {
		return firebase.auth().signInWithEmailAndPassword(email, password)
			.then((event) => {
				console.log("Logged in");
				window.location.href = "/index.html";
			}).catch(function (error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Log in error ", errorCode, errorMessage);
				alert("LOG IN ERROR");
				// ...
			});
	}

	createUser(email, password) {
		return firebase.auth().createUserWithEmailAndPassword(email, password)
			.then((event) => {
				console.log("Created user");
				window.location.href = "/index.html";
			}).catch(function (error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log("Create acct error ", errorCode, errorMessage);
				alert("SIGN UP ERROR");
				// ...
			});
	}

	signOut() {
		firebase.auth().signOut()
			.then((event) => {
				window.location.href = "/index.html";
			})
			.catch((error) => {
				console.log("Sign out error");
			});
	}

	get isSignedIn() {
		return !!this._user;
	}
}

rhit.PledgeClassPageController = class {
	constructor() {
		$(".alumniButton").click((event) => {
			const dataAmount = $(event.target).data("amount");
			window.location.href = `/alumniMembers.html?year=${dataAmount}`
		});
	}
}

rhit.FbAlumniManager = class {
	constructor(year) {
		this.year = parseInt(year);
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ALUMNI);
		this._unsubscribe = null;
	}

	add(full_name, major, graduation_year, phone_number, email, street_address, state_address, image_url) {
		this._ref.add({
			[rhit.FB_KEY_FULL_NAME]: full_name,
			[rhit.FB_KEY_EMAIL]: email,
			[rhit.FB_KEY_GRADUATION_YEAR]: parseInt(graduation_year),
			[rhit.FB_KEY_MAJOR]: major,
			[rhit.FB_KEY_PHONE]: phone_number,
			[rhit.FB_KEY_PHOTO_LINK]: image_url,
			[rhit.FB_KEY_STATE_ADDRESS]: state_address,
			[rhit.FB_KEY_STREET_ADDRESS]: street_address
		}).then(function (docRef) {
			console.log("Document written with ID: ", docRef.id);
		}).catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.orderBy(rhit.FB_KEY_FULL_NAME, "desc")
			.limit(100)
			.where(rhit.FB_KEY_GRADUATION_YEAR, "==", this.year)
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				querySnapshot.forEach((doc) => {
					console.log(doc.data());
				});
				changeListener();
			});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getAlumAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const alum = new rhit.Alum(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_EMAIL),
			docSnapshot.get(rhit.FB_KEY_FULL_NAME),
			docSnapshot.get(rhit.FB_KEY_GRADUATION_YEAR),
			docSnapshot.get(rhit.FB_KEY_MAJOR),
			docSnapshot.get(rhit.FB_KEY_PHONE),
			docSnapshot.get(rhit.FB_KEY_PHOTO_LINK),
			docSnapshot.get(rhit.FB_KEY_STATE_ADDRESS),
			docSnapshot.get(rhit.FB_KEY_STREET_ADDRESS)
		);
		return alum;
	}
}

rhit.Alum = class {
	constructor(id, email, full_name, graduation_year, major, phone, photo_link, state_address, street_address) {
		this.id = id;
		this.email = email;
		this.full_name = full_name;
		this.graduation_year = graduation_year;
		this.major = major;
		this.phone = phone;
		this.photo_link = photo_link;
		this.state_address = state_address;
		this.street_address = street_address;
	}
}

rhit.PledgeYearController = class {
	constructor() {
		document.querySelector("#submitAddMember").addEventListener("click", (event) => {
			const full_name = document.querySelector("#inputFullName").value;
			const major = document.querySelector("#inputMajor").value;
			const graduation_year = document.querySelector("#inputGraduationYear").value;
			const phone_number = document.querySelector("#inputPhoneNumber").value;
			const email = document.querySelector("#inputEmail").value;
			const street_address = document.querySelector("#inputStreetAddress").value;
			const state_address = document.querySelector("#inputStateAddress").value;
			const image_url = document.querySelector("#inputImageURL").value;

			rhit.fbAlumniManager.add(full_name, major, graduation_year, phone_number, email, street_address, state_address, image_url);
		});

		rhit.fbAlumniManager.beginListening(this.updateList.bind(this));
	}

	_createCard(alum) {
		return htmlToElement(`<button type="button" class="btn alumniMemberButton">${alum.full_name}</button>`);
	}

	updateList() {
		const newList = htmlToElement('<div id="logInButtonContainer"></div>');
		for (let i = 0; i < rhit.fbAlumniManager.length; i++) {
			const alum = rhit.fbAlumniManager.getAlumAtIndex(i);
			const newCard = this._createCard(alum);
			newCard.onclick = (event) => {
				// rhit.storage.setMovieQuoteId(mq.id);
				window.location.href = `/alumniIndividual.html?id=${alum.id}`
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#logInButtonContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}

rhit.IndividualMemberPageController = class {
	constructor() {
		rhit.fbSingleAlumManager.beginListening(this.updateView.bind(this));
	}

	_createCard(alum) {
		return htmlToElement(`<div><div class="midPageHeader">Alumni Page</div>
	<div class="contactDiv">
	  <div class="contactInfoRow">
		<img src="${alum.photo_link}" alt="${alum.full_name}">
		<div>
		  <div class="contactBox">${alum.full_name}</div>
		  <div class="contactBox">${alum.major}</div>
		  <div class="contactBox">Graduated ${alum.graduation_year}</div>
		</div>
	  </div>
	</div>
	<div class="midPageHeader">Contact Info</div>
	<div class="contactDiv">
	  <div class="contactInfoRow">
		<label class="contactInfoLabel">Phone:</label>
		<span class="contactBox">${alum.phone}</span>
	  </div>
	  <div class="contactInfoRow">
		<label class="contactInfoLabel">Email:</label>
		<span class="contactBox">${alum.email}</span>
	  </div>
	  <div class="contactInfoRow">
		<label class="contactInfoLabel">Address:</label>
		<span class="contactBox">${alum.street_address} ${alum.state_address}</span>
	  </div>
	</div>
	</div>`);
	}

	updateView() {
		const newList = htmlToElement('<div id="alumniIndividualPage" class="container page-container"></div>');
		const alum = rhit.fbSingleAlumManager.alum;
		const newCard = this._createCard(alum);
		newList.appendChild(newCard);

		const oldList = document.querySelector("#alumniIndividualPage");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		console.log(newList);
		oldList.parentElement.appendChild(newList);
	}
}


rhit.CalendarPageController = class {
	constructor() {
		this.today = new Date();
		this.currentMonth = this.today.getMonth();
		this.currentYear = this.today.getFullYear();
		this.selectYear = document.getElementById("year");
		this.selectMonth = document.getElementById("month");
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EVENT);
		this._documentSnapshots = null;
		this.modal = document.getElementById("myModal");
		this.span = document.getElementsByClassName("close")[0];
		this.monthAndYear = document.getElementById("monthAndYear");


		this.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		this.span.onclick = (event) => {
			this.modal.style.display = "none";
		}

		window.onclick = (event) => {
			if (event.target == this.modal) {
				this.modal.style.display = "none";
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
			this.previous();
		});

		document.querySelector("#next").addEventListener("click", (event) => {
			this.next();
		});

		document.querySelector("#month").addEventListener("change", (event) => {
			this.jump();
		});

		document.querySelector("#year").addEventListener("change", (event) => {
			this.jump();
		});

		document.querySelector("#submitAddEvent").addEventListener("click", (event) => {
			const eventType = document.getElementById("#eventType").value;
			const eventTitle = document.querySelector("#inputEvent").value;
			const location = document.querySelector("#inputLocation").value;
			const date = document.querySelector("#inputDate").value;
			const time = document.querySelector("#inputTime").value;
			console.log(eventType);
			rhit.fbEventsManager.add(eventType, eventTitle, location, date, time)
		});

		document.querySelector("#submitEditEvent").addEventListener("click", (event) => {
			const eventType = document.getElementById("editEventType").value;
			const eventTitle = document.querySelector("#editEventTitle").value;
			const location = document.querySelector("#editLocation").value;
			const date = document.querySelector("#editDate").value;
			const time = document.querySelector("#editTime").value;
			rhit.fbSingleEventManager.update(eventType, eventTitle, location, date, time)
		});
	}

	deleteEvent(eventId) {
		return this._ref.doc(eventId).delete();
	}

	next() {
		this.currentYear = (this.currentMonth === 11) ? this.currentYear + 1 : this.currentYear;
		this.currentMonth = (this.currentMonth + 1) % 12;
		this.showCalendar(this.currentMonth, this.currentYear);
	}

	previous() {
		this.currentYear = (this.currentMonth === 0) ? this.currentYear - 1 : this.currentYear;
		this.currentMonth = (this.currentMonth === 0) ? 11 : this.currentMonth - 1;
		this.showCalendar(this.currentMonth, this.currentYear);
	}

	jump() {
		this.currentYear = parseInt(selectYear.value);
		this.currentMonth = parseInt(selectMonth.value);
		this.showCalendar(this.currentMonth, this.currentYear);
	}

	updateList() {
		if (rhit.fbEventsManager.length == 0) {
			const newList = htmlToElement('<div id="eventContainer">No Events Added</div>');

			const oldList = document.querySelector("#eventContainer");
			oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.appendChild(newList);
		} else {
			const newList = htmlToElement('<div id="eventContainer"></div>');
			for (let i = 0; i < rhit.fbEventsManager.length; i++) {
				const event = rhit.fbEventsManager.getEventAtIndex(i);
				const newCard = this._createCard(event);
				const eventId = event.id;
				const eventType = event.type;
				const eventLocation = event.location;
				const eventDate = event.date;
				const eventTitle = event.title;
				const eventTime = event.time;

				console.log(event);
				newCard.getElementsByClassName('card-delete')[0].onclick = (event) => {
					this.deleteEvent(eventId).then(function () {
						console.log("Event deleted!");
					}).catch(function (error) {
						console.log("Error removing, ", error);
					});
				};
				newCard.getElementsByClassName('card-edit')[0].onclick = (event) => {
					rhit.fbSingleEventManager = new rhit.FbSingleEventManager(eventId);
					document.querySelector("#editEventType").value = eventType;
					document.querySelector("#editLocation").value = eventLocation;
					document.querySelector("#editDate").value = eventDate;
					document.querySelector("#editEventTitle").value = eventTitle;
					document.querySelector("#editTime").value = eventTime;
				};
				newList.appendChild(newCard);
			}

			const oldList = document.querySelector("#eventContainer");
			oldList.removeAttribute("id");
			oldList.hidden = true;
			oldList.parentElement.appendChild(newList);
		}
	}

	updateCalendar() {
		for (let i = 0; i < rhit.fbEventsManager.length; i++) {
			const event = rhit.fbEventsManager.getEventAtIndex(i);
			rhit.eventDates.push(event.date);
			rhit.eventTypes.push(event.type);
		}
		this.showCalendar(this.currentMonth, this.currentYear);

	}

	_createCard(event) {
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <h5 class="card-title">${event.title}</h5>
		  <h6 class="card-subtitle mb-2 text-muted">${event.type}</h6>
		  <h6 class="card-subtitle mb-2 text-muted">${event.location}</h6>
		  <h6 class="card-subtitle mb-2 text-muted">${event.date}</h6>
		  <h6 class="card-subtitle mb-2 text-muted">${event.time}</h6>
		</div>
		<div>
		  <button class="btn card-edit" data-toggle="modal" data-target="#editEvent">Edit</button>
		  <button class="btn card-delete">Delete</button>
		</div>
      </div>`);
	}

	getDate(event) {

	}

	showEvents(date) {
		this.modal.style.display = "block";
	}

	startListen(month, year) {
		let firstDay = (new Date(year, month)).getDay();
		let daysInMonth = 32 - new Date(year, month, 32).getDate();
		let tbl = document.getElementById("calendar-body"); // body of the calendar
		let actualMonth = this.currentMonth + 1;
		let firstOfMonth = this.currentYear.toString() + "-" + actualMonth.toString() + "-" + "0" + 1;
		let lastOfMonth = this.currentYear.toString() + "-" + actualMonth.toString() + "-" + daysInMonth;

		console.log(firstOfMonth);
		console.log(lastOfMonth);

		rhit.fbEventsManager.beginListeningCalendar(this.updateCalendar.bind(this), firstOfMonth, lastOfMonth);
	}

	showCalendar(month, year) {
		let firstDay = (new Date(year, month)).getDay();
		let daysInMonth = 32 - new Date(year, month, 32).getDate();
		let tbl = document.getElementById("calendar-body"); // body of the calendar
		let actualMonth = this.currentMonth + 1;
		let firstOfMonth = this.currentYear.toString() + "-" + actualMonth.toString() + "-" + "0" + 1;
		let lastOfMonth = this.currentYear.toString() + "-" + actualMonth.toString() + "-" + daysInMonth;

		console.log(rhit.eventDates);

		// clearing all previous cells
		tbl.innerHTML = "";

		// filing data about month and in the page via DOM.
		this.monthAndYear.innerHTML = this.months[month] + " " + year;
		this.selectYear.value = year;
		this.selectMonth.value = month;

		// creating all cells
		let date = 1;
		let emptyDate = 0;
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
					emptyDate++;
				}
				else if (date > daysInMonth) {
					break;
				}

				else {
					let cell = document.createElement("td");
					let exactDate = 0;
					if (date > 9) {
						if (actualMonth > 9) {
							exactDate = this.currentYear.toString() + "-" + actualMonth.toString() + "-" + date;
						} else {
							exactDate = this.currentYear.toString() + "-0" + actualMonth.toString() + "-" + date;
						}
					} else {
						if (actualMonth > 9) {
							exactDate = this.currentYear.toString() + "-" + actualMonth.toString() + "-0" + date;
						} else {
							exactDate = this.currentYear.toString() + "-0" + actualMonth.toString() + "-0" + date;
						}
					}
					console.log(exactDate);
					cell.onclick = (event) => {
						let dayNum = 0;
						const rowIndex = cell.parentElement.rowIndex;
						const cellIndex = cell.cellIndex;
						if (rowIndex == 1) {
							dayNum = cellIndex + 1 - emptyDate;
						}
						else {
							dayNum = (rowIndex - 1) * 7 + cellIndex + 1 - emptyDate;
						}
						console.log("day clicked " + dayNum);
						console.log(exactDate);
						this.showEvents(exactDate);
						rhit.fbEventsManager.beginListeningEvents(this.updateList.bind(this), exactDate);
					}
					let cellText = document.createTextNode(date);
					if (date === this.today.getDate() && year === this.today.getFullYear() && month === this.today.getMonth()) {
						cell.classList.add("current-date");
					} // color today's date
					cell.appendChild(cellText);
					let cellActiveEvent = document.createElement("div");
					let cellAlumniEvent = document.createElement("div");
					let cellRushEvent = document.createElement("div");
					let cellPhilEvent = document.createElement("div");
					for (let i = 0; i < rhit.eventDates.length; i++) {
						if ((rhit.eventDates[i].slice(-2) == date || rhit.eventDates[i].slice(-2) == "0" + date) &&
							(rhit.eventDates[i].substring(5, 7) == actualMonth || rhit.eventDates[i].substring(5, 7) == "0" + actualMonth)) {
							if (rhit.eventTypes[i] == 1) {
								cellActiveEvent.classList.add("active-event");
							}
							if (rhit.eventTypes[i] == 2) {
								cellActiveEvent.classList.add("alumni-event");
							}
							if (rhit.eventTypes[i] == 3) {
								cellRushEvent.classList.add("rush-event");
							}
							if (rhit.eventTypes[i] == 4) {
								cellPhilEvent.classList.add("philanthropy-event");
							}

						}
					}
					cell.appendChild(cellActiveEvent);
					cell.appendChild(cellAlumniEvent);
					cell.appendChild(cellRushEvent);
					cell.appendChild(cellPhilEvent);
					row.appendChild(cell);
					date++;
				}


			}

			tbl.appendChild(row); // appending each row into calendar body.
		}
	}
}

rhit.FbSingleEventManager = class {
	constructor(eventId) {
		this.event = null;
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EVENT).doc(eventId);
	}

	update(eventType, eventTitle, location, date, time) {
		this._ref.update({
			[rhit.FB_KEY_EVENTTYPE]: eventType,
			[rhit.FB_KEY_EVENT]: eventTitle,
			[rhit.FB_KEY_LOCATION]: location,
			[rhit.FB_KEY_DATE]: date,
			[rhit.FB_KEY_TIME]: time
		}).then(function (docRef) {
			console.log("Successfully updated");
		}).catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("document data: ", doc.data());
				this._documentSnapshot = doc;
				this.event = new rhit.Event(
					docSnapshot.id,
					docSnapshot.get(rhit.FB_KEY_EVENTTYPE),
					docSnapshot.get(rhit.FB_KEY_EVENT),
					docSnapshot.get(rhit.FB_KEY_LOCATION),
					docSnapshot.get(rhit.FB_KEY_DATE),
					docSnapshot.get(rhit.FB_KEY_TIME)
				);
				changeListener();
			} else {
				console.log("No such document");
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}
}

rhit.FbEventsManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EVENT);
		this._unsubscribe = null;
	}

	add(eventType, eventTitle, location, date, time) {
		this._ref.add({
			[rhit.FB_KEY_EVENTTYPE]: eventType,
			[rhit.FB_KEY_EVENT]: eventTitle,
			[rhit.FB_KEY_LOCATION]: location,
			[rhit.FB_KEY_DATE]: date,
			[rhit.FB_KEY_TIME]: time,
		}).then(function (docRef) {
			console.log("Document written with ID: ", docRef.id);
		}).catch(function (error) {
			console.log("Error adding document: ", error);
		})
	}

	beginListeningEvents(changeListener, date) {
		let query = this._ref;
		query = query.where(rhit.FB_KEY_DATE, "==", date)
		this._unsubscribe = query
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				changeListener();
			});
	}

	beginListeningCalendar(changeListener, firstOfMonth, lastOfMonth) {
		let query = this._ref;
		console.log(rhit.FB_KEY_DATE);
		query = query.where(rhit.FB_KEY_DATE, ">=", firstOfMonth).where(rhit.FB_KEY_DATE, "<=", lastOfMonth);
		this._unsubscribe = query
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				changeListener();
			});
		console.log("done");

	}

	stopListening() {
		this._unsubscribe
	}

	getEventAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const event = new rhit.Event(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_EVENTTYPE),
			docSnapshot.get(rhit.FB_KEY_EVENT),
			docSnapshot.get(rhit.FB_KEY_LOCATION),
			docSnapshot.get(rhit.FB_KEY_DATE),
			docSnapshot.get(rhit.FB_KEY_TIME)
		);
		return event;
	}

	get length() {
		return this._documentSnapshots.length;
	}
}

rhit.Event = class {
	constructor(id, type, title, location, date, time) {
		this.id = id;
		this.type = type;
		this.title = title;
		this.location = location;
		this.date = date;
		this.time = time;
	}

}

rhit.initializePage = function () {
	if (document.querySelector("#calendarPage")) {
		console.log("you are on the calendar page");
		rhit.fbEventsManager = new rhit.FbEventsManager();
		var pageController = new rhit.CalendarPageController();
		pageController.startListen(pageController.currentMonth, pageController.currentYear);
		//pageController.showCalendar(pageController.currentMonth, pageController.currentYear);
	}

	if (document.querySelector('#alumniPledgeClassesPage')) {
		console.log("On pledge classes page");
		new rhit.PledgeClassPageController();
	}

	if (document.querySelector('#alumniMembersPage')) {
		console.log("On members page");
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const year = urlParams.get("year");
		rhit.fbAlumniManager = new rhit.FbAlumniManager(year);
		new rhit.PledgeYearController();
	}

	if (document.querySelector('#alumniIndividualPage')) {
		console.log("On individual page");
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const id = urlParams.get("id");
		rhit.fbSingleAlumManager = new rhit.FbSingleAlumManager(id);
		new rhit.IndividualMemberPageController();
	}

	if (document.querySelector('#logInPage')) {
		console.log("On login page");
		document.querySelector(".logInButton").onclick = (event) => {
			rhit.fbAuthManager.signIn(document.querySelector("#email").value, document.querySelector("#password").value);
		}
		document.querySelector("#signInButton").onclick = (params) => {
			window.location.href = "/signup.html";
		}
	}

	if (document.querySelector('#signupPage')) {
		console.log("On signup page");
		document.querySelector("#signUpButton").onclick = (event) => {
			rhit.fbAuthManager.createUser(document.querySelector("#email").value, document.querySelector("#password").value);
		}
	}

	if (document.querySelector('#alumniNotLoggedInPage')) {
		console.log("Tried to access alumni page not logged in");
		document.querySelector("#logInButton").onclick = (event) => {
			window.location.href = "/login.html";
		}
		document.querySelector("#signUpButton").onclick = (event) => {
			window.location.href = "/signup.html";
		}
	}
}

rhit.FbSingleAlumManager = class {
	constructor(alumId) {
		this.alum = null;
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_ALUMNI).doc(alumId);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				this.alum = new rhit.Alum(
					this._documentSnapshot.id,
					this._documentSnapshot.get(rhit.FB_KEY_EMAIL),
					this._documentSnapshot.get(rhit.FB_KEY_FULL_NAME),
					this._documentSnapshot.get(rhit.FB_KEY_GRADUATION_YEAR),
					this._documentSnapshot.get(rhit.FB_KEY_MAJOR),
					this._documentSnapshot.get(rhit.FB_KEY_PHONE),
					this._documentSnapshot.get(rhit.FB_KEY_PHOTO_LINK),
					this._documentSnapshot.get(rhit.FB_KEY_STATE_ADDRESS),
					this._documentSnapshot.get(rhit.FB_KEY_STREET_ADDRESS)
				);
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && this.fbAuthManager.isSignedIn) {
		window.location.href = "/index.html";
	}

	if ((document.querySelector("#alumniMembersPage") || document.querySelector("#alumniIndividualPage") ||
		document.querySelector("#alumniPledgeClassesPage")) && !this.fbAuthManager.isSignedIn) {
		window.location.href = "/alumniNotLoggedIn.html";
	}
}

rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", this.fbAuthManager.isSignedIn);
		if (this.fbAuthManager.isSignedIn) {
			const button = document.querySelector('#loginButton');
			button.innerHTML = "Logout";
			button.onclick = (event) => {
				this.fbAuthManager.signOut();
			}
		} else {
			document.querySelector('#loginButton').onclick = (event) => {
				window.location.href = "/login.html";
			}
		}

		rhit.checkForRedirects();
	});

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
		window.location.href = "/alumniPledgeClasses.html";
	}
	document.querySelector('#contactUsButton').onclick = (event) => {
		window.location.href = "/contactus.html";
	}

	rhit.initializePage();
};

rhit.main();

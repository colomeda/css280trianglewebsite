var rhit = rhit || {};

rhit.FB_COLLECTION_EVENT = "Events";
rhit.FB_KEY_EVENT = "event";
rhit.fbEventsManager = null;

rhit.Event = class {
	constructor(id, title, location, date, time) {
		this.id = id;
		this.title = title;
		this.location = location;
		this.date = date;
		this.time = time;
	}

}

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
	signIn() {
		Rosefire.signIn("06a69212-51a1-479f-8658-b257110bb6c8", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);
			firebase.auth().signInWithCustomToken(rfUser.token).catch(function (error) {
				// Handle Errors here.
				const errorCode = error.code;
				const errorMessage = error.message;
				console.error("Log in error ", errorCode, errorMessage);
				// ...
			});
		});
	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return true;
	}
	get uid() {
		return this._user.uid;
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
						cell.onclick = function () {
							var dayNum = 0;
							var rowIndex = this.parentElement.rowIndex;
							var cellIndex = this.cellIndex;
							if (rowIndex == 1) {
								dayNum = cellIndex + 1 - emptyDate;
							}
							else {
								dayNum = (rowIndex - 1) * 7 + cellIndex + 1 - emptyDate;
							}
							console.log("day clicked " + dayNum);
						}
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

		document.querySelector("#submitAddEvent").addEventListener("click", (event) => {
			const event = document.querySelector("#inputEvent").value;
			const location = document.querySelector("#inputLocation").value;
			const date = document.querySelector("#inputDate").value;
		})
	}
}

rhit.initializePage = function () {
	if (document.querySelector("#calendarPage")) {
		console.log("you are on the calendar page");
		new rhit.CalendarPageController();
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
	document.querySelector('#loginButton').onclick = (event) => {
		window.location.href = "/login.html";
	}

	rhit.initializePage();

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
};

rhit.main();

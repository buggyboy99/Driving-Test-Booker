// ==UserScript==
// @name        Driving Test Checker
// @namespace   http://userscripts.org/users/484421
// @description Checks if any tests are avaliable before a certain date.
// @include     https://www.service.transport.qld.gov.au/SBSExternal/BookingSearch.jsp
// @include     https://www.service.transport.qld.gov.au/SBSExternal/BookingResults.jsp
// @include     https://www.service.transport.qld.gov.au/SBSExternal/DisplayBooking.jsp
// @version     1
// ==/UserScript==

function Application() {

	var thisObject = this;

	this.main = function () {
		
		page = new Page();
		secretary = new Secretary();

		switch(page.getType()) {
			case "search_page"	: timer = new Timer(); break;
            case "slot_taken"   : thisObject.onNoResult(); break;
			case "results_page"	: secretary.processResults(page); break;
			case "booked_out"	: console.log("It is completely booked out."); break;
            case "display_page" : thisObject.onBooked(); break;
			default				: console.error("Unknown page type.");
		}
	}

	this.onRing = function () {
		page.fetchObject('continueButtonId').click();
		//console.log("Ring!");
		thisObject.main();
	}

	this.onResult = function () {
        page.fetchObject('continueButtonId').click();
	}

	this.onNoResult = function () {
		page.fetchObject('searchAgainButtonId').click();
	}

    this.onBooked = function () { 
        //this.appointment = document.getElementById("appointmentId").value;
        //sendEmail(thisObject.appointment);
        window.open("http://nyan.cat/", "_blank");
    }
}

function Timer() { 

	var thisObject = this;
	this.minutes = 0;
	this.seconds = 10;

	this.tick = function () {
		page.fetchObject('pageHeadingId').innerHTML = thisObject.minutes + " minutes and " + thisObject.seconds + " until refresh.";
		if(thisObject.seconds == 0) {
			if(thisObject.minutes > 0) {
				thisObject.minutes--;
				thisObject.seconds = 60;
			} else { thisObject.ring();	}
		}
		thisObject.seconds--;
	}

	this.start = function () {
		thisObject.interval = setInterval(thisObject.tick, 1000);
	}

	this.stop = function () {
		clearInterval(thisObject.interval);
	}

	this.ring = function () {
		thisObject.stop();
		application.onRing();
	}

	this.start();
}

function Page() { 

	var thisObject = this;
    this.source = document.body.innerHTML;
    this.location = document.URL;
    
    this.fetchObject = function (elementId) {
        return document.getElementById(elementId); 
    }

    this.sourceContains = function (needle) {
		return thisObject.source.indexOf(needle) != -1;
	}

    this.locationContains = function (needle) {
		return thisObject.location.indexOf(needle) != -1;
	}

    this.isBookedOutPage = function () {
        return thisObject.locationContains("BookingSearch.jsp") && thisObject.sourceContains("ATTENTION - There are either");
    }

    this.isSlotTaken = function () {
        return thisObject.locationContains("BookingResults.jsp") && thisObject.sourceContains("This slot has been taken");
    }

    this.isSearchPage = function () {
    	return thisObject.locationContains("BookingSearch.jsp");
    }

    this.isResultsPage = function () {
    	return thisObject.locationContains("BookingResults.jsp");
    }

    this.isDisplayPage = function () {
        return thisObject.locationContains("DisplayBooking.jsp");
    }

    this.getType = function () {
    	if(thisObject.isBookedOutPage()) { return "booked_out" }
        else if(thisObject.isSlotTaken()) { return "slot_taken" }
    	else if(thisObject.isSearchPage()) { return "search_page" }
    	else if(thisObject.isResultsPage()) { return "results_page" }
        else if(thisObject.isDisplayPage()) { return "display_page" }
    	else { return "unknown" };
    }
}

function Secretary() {

    var thisObject = this;
    this.chosenDate = new Array(20, 9, 2013);

    this.processResults = function (pageObject) {

        var date = pageObject.source.match(/<td class="CUEtext"><input[^>]+>[0-9]+:[0-9]+\s(AM|PM)\s[a-zA-z]+\s([^\s]+)\s[a-zA-Z]+\s[^<]+<\/td>/g);

        if(date.length > 0) {
            for (i = 0; i < date.length; i++) {
            	
   				thisObject.stripDate(date, i);
   				thisObject.splitDate(date, i);

                if(thisObject.isBeforeChosenDate()) { application.onResult(); break; }
                else { application.onNoResult(); }
            }
        }
    }

    this.stripDate = function (date, i) {
    	date[i] = date[i].replace(/<td class="CUEtext"><input[^>]+>[0-9]+:[0-9]+\s(AM|PM)\s[a-zA-z]+\s/g, "");
        date[i] = date[i].replace(/\s[a-zA-Z]+\s[^<]+<\/td>/g, "");
    }

    this.splitDate = function (date, i) {
        var date = date[i].split("/");
        thisObject.day = date[0];
        thisObject.month = date[1];
        thisObject.year = date[2];
    }

    this.isBeforeChosenDate = function () {
    	// 07/03/2013 | 08/04/2013
        if(thisObject.month <= this.chosenDate[1] && thisObject.year <= this.chosenDate[2])
            return (thisObject.day <= this.chosenDate[0]);
    }   
}

function sendEmail(date) {

    if (date === "") return alert("There is no date to send!");

    if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
        else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

    xmlhttp.open("GET","http://localhost/emailer/index.php?d=" + encodeURIComponent(date), true);
    xmlhttp.send();
}

application = new Application();  application.main();

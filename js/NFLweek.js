// document.cookie = "nflExperiment=John Doe; expires=Thu, 18 Dec 2020 12:00:00 UTC; path=/";
const template = document.createElement("template");
template.innerHTML = `
    <slot></slot>
`

class NFLweek extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        this.docObject = document;
        this.domain = window.location.hostname;
        shadow.append(template.content.cloneNode(true));

        // const cookie = this.getCookie('nflPicks');
        // const cookie = this.getCookie('nflExperiment');
        // console.log(cookie);
        this.state = {
            'currentWeek': false,
            'currentWeekJSON': false,
            'weeks': []
        }
<<<<<<< HEAD
        // console.log(document.cookie);
=======
        document.cookie = `nflPicks2=helloworld; expires=Sun, 14 Jan 2024 16:23:02 GMT; domain=192.168.0.100; path=/; SameSite=None`;
        document.cookie = `nflPicks2=helloworld; expires=Sun, 14 Jan 2024 16:23:02 GMT; domain=192.168.0.100; path=/;`;
        console.log(document.cookie);
        console.log(document.cookies);
        console.log(document.cookieString);
>>>>>>> ff33a476af0bbc1d65b8d8898e763bf39563abb9
        const cookie = this.getCookieByName('nflPicks');
        // console.log(cookie);
        if (cookie) {
            // console.log(cookie);
            this.state.weeks = cookie;
        }
    }

    connectedCallback() {
        const timestamp = new Date().getTime() / 1000;
        const currentWeek = getCurrentWeek(timestamp);
        this.fetchWeekAjax(currentWeek);
    }

    async fetchWeekAjax(currentWeek) {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${currentWeek}`);
        const weekJSON = await response.json();

        this.state.currentWeekJSON = weekJSON;
        this.renderWeek();
    }

    renderWeek() {
        const weekJSON = this.state.currentWeekJSON;
        document.title = `Week ${weekJSON.week.number} (${weekJSON.events.length} games)`;
        const days = sortByDays(weekJSON);

        const weekNum = weekJSON.week.number;
        this.state.currentWeek = weekNum;
        if (!this.state.weeks[weekNum]) {
            this.setBlankWeekState(weekJSON);
        }

        const weekDiv = document.createElement('week');
        const gameCount = weekJSON.events.length;

        weekDiv.innerHTML = `
            <div class="week week-${weekNum}">
                <header class="header">
                    <h1>
                        <label for="week-selector" class="week-selector"></label>
                        <span class="week-count">${gameCount} games</span>
                    </h1>
                </header>
            </div>
        `;

        this.innerHTML = '';
        this.append(weekDiv);
        const daysDiv = weekDiv.getElementsByClassName('week')[0];
        const weekSelector = weekDiv.getElementsByClassName('week-selector')[0];

        weekSelector.prepend(this.renderWeekSelector(weekNum));

        days.map((day) => {
            daysDiv.append(this.renderDay(day));
        })
    }

    setBlankWeekState(weekJSON) {
        const weekNum = weekJSON.week.number;
        console.log(`INIT BLANK WEEK: ${weekNum}`);
        const games = {};
        for (var i = 0; i < weekJSON.events.length; i++) {
            const game = weekJSON.events[i];
            games[game.id] = {
                'pick': false,
                'points': false
            }
        }
        this.state.weeks[weekNum] = games;
    }

    renderWeekSelector(weekNum) {
        const weekSelector = document.createElement('select');
        weekSelector.className = 'week-selector';
        weekSelector.id = 'week-selector';

        for (let i = 1; i < 19; i++) {
            let selected = '';
            if (weekNum === i) {
                selected = ' selected';
            }
            weekSelector.innerHTML += `<option value=${i}${selected}>Week ${i}</option>`;
        }

        weekSelector.addEventListener('change', (e) => {
            // console.log(weekSelector.options);
            // console.log(weekSelector.options[weekSelector.options.selectedIndex].value);
            const newWeek = weekSelector.options[weekSelector.options.selectedIndex].value;
            this.fetchWeekAjax(newWeek);
        })
        return weekSelector;
    }

    renderDay(day) {
        // console.log(day);
        const dayDiv = document.createElement("day");
        dayDiv.className = "day";
        const dayName = getDayName(day.dateObj.getDay());
        const monthName = getMonthName(day.dateObj.getMonth());

        dayDiv.innerHTML = `
            <h2>
                ${dayName}
                ${monthName}
                ${day.dateObj.getDate()}
            </h2>
        `
        const gamesDiv = document.createElement('games');
        gamesDiv.className = 'games';

        day.games.map((game) => {
            gamesDiv.append(this.renderGame(game));
        })
        dayDiv.append(gamesDiv);

        return dayDiv;
    }

    renderGame(game) {
        const gameState = this.state.weeks[this.state.currentWeek][game.id];
        const gameDiv = document.createElement("game");

        if (gameState.pick) {
            gameDiv.className = `game pick-${gameState.pick}`;
        } else {
            gameDiv.className = 'game';
        }
        const homeTeam = game.competitions[0].competitors[0];
        const awayTeam = game.competitions[0].competitors[1];

        // console.log(homeTeam.team.name);
        // console.log(game.status.type.state);
        let homeScore = homeTeam.score;
        let awayScore = awayTeam.score;

        if (game.status.type.state === 'pre') {
            // console.log(game);
            const gameDate = new Date(game.date);
            let amPm = 'am';
            let hours = gameDate.getHours();
            if (hours > 22) {
                homeScore = `tba`;    
            } else {
                if (hours >= 12) { amPm = 'pm'; }
                if (hours > 12) { hours = hours - 12; }
                
                const minutes = (gameDate.getMinutes() < 10 ? '0' : '') + gameDate.getMinutes();
                homeScore = `${hours}:${minutes} ${amPm}`;
            }
            awayScore = '';
            if (game.competitions[0].broadcasts[0]) {
                awayScore = game.competitions[0].broadcasts[0].names[0];
            }
        }

        gameDiv.innerHTML = `
            <input type="radio" id="away-${game.id}" name="${game.id}" value="away" class="away button">
            <input type="radio" id="home-${game.id}" name="${game.id}" value="home" class="home button">
            <label for="away-${game.id}" class="label-away">
                <img src="images/${awayTeam.team.abbreviation}.png" alt="${awayTeam.team.name}-logo" />
                <h3 class="team">
                    ${awayTeam.team.location}
                    <span class="record">
                        ${awayTeam.records[0].summary}
                    </span>
                </h3>
                <h3 class="score">${awayScore}</h3>
            </label>
            <label for="home-${game.id}" class="label-home">
                <img src="images/${homeTeam.team.abbreviation}.png" alt="${homeTeam.team.name}-logo" />
                <h3 class="team">
                    ${homeTeam.team.location}
                    <span class="record">
                        ${homeTeam.records[0].summary}
                    </span>
                </h3>
                <h3 class="score">${homeScore}</h3>
            </label>
        `

        const radioButtons = gameDiv.getElementsByClassName("button");
        for (var i = 0; i < radioButtons.length; i++) {
            radioButtons[i].addEventListener('change', (e) => {
                // console.log(e);
                this.state.weeks[this.state.currentWeek][e.target.name].pick = e.target.value;
                this.setCookie();
                
                console.log(this.state.currentWeek);
                console.log(e.target.name);
                console.log(e.target.value);
                // console.log(this.state.currentWeek);
                const weekNum = this.state.currentWeek;
                // console.log(this.state.weeks[weekNum][e.target.name]);

                // this.state.weeks[weekNum][e.target.name].pick = e.target.value;
                // console.log(this.state.weeks[weekNum][e.target.name].pick);
                this.state.weeks[weekNum][e.target.name].pick = e.target.value;
                // console.log('update the page ???');
                gameDiv.className = `game pick-${e.target.value}`
            })
        }

        gameDiv.append(this.renderGameFooter(game));
        return gameDiv;
    }

    renderGameFooter(game) {
        const gameFooter = document.createElement('footer');
        gameFooter.className = "footer";

        // console.log(game.competitions[0].odds[0]);
        if (game.competitions[0].odds) {
            const odds = game.competitions[0].odds[0];
            let overUnder = '';
            if (odds.overUnder) {
                overUnder = ` &nbsp; total: ${odds.overUnder}`;
            }
            gameFooter.innerHTML = `
                <div class="status">${odds.details}${overUnder}</div>
            `;
        } else if (
            game.status.type.shortDetail === 'Final' ||
            game.status.type.shortDetail === 'Final/OT'
        ) {
            gameFooter.innerHTML = `
                <div class="status">${game.status.type.shortDetail}</div>
            `;
        }

        // console.log(game.status.type.detail);
        // console.log(game.status.type.shortDetail);
        // gameFooter.innerHTML = `footer stuff!!`;
        return gameFooter;
    }

    saveStateAsCookie() {
        // var json_str = JSON.stringify(this.state);
        // createCookie('nflPicks', json_str);
        console.log(this.docObj);
        // this.docObj.cookie = 'nflPicks='+ JSON.stringify(this.state);
    }

    setCookie(action) {
        // let expire = false;
        // if (action === 'delete') {
        //     expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
        // } else if (action === 'new') {
        //     // 1000 is one second.
        //     // 60000 is one minute.
        //     // 3600000 is one hour.
        //     // 86400000 is one day.
        //     const andNow = new Date().getTime();
        //     expire = new Date(andNow + 86400000).toUTCString();
        // }
        // if (expire) {
        //     // console.log(expire);
        //     this.docObject.cookie = `nflPicks=${JSON.stringify(this.state)}; expires=` + expire + "; domain=" + this.domain + "; path=/; SameSite=None; Secure";
        // }

        const andNow = new Date().getTime();
        const expire = new Date(andNow + 8640000000).toUTCString();
        // console.log(this.state.weeks);
        // console.log('this is a note???');
        // const data = JSON.parse(this.state.weeks);
        const data = JSON.stringify(this.state.weeks);;
        // console.log('this is note 2');
        // console.log(this.domain);
        console.log(this.domain);
        // console.log(`nflPicks=${data}; expires=${expire}; domain=${this.domain}; path=/; SameSite=None; Secure`);
        document.cookie = `nflPicks=${data}; expires=${expire}; domain=${this.domain}; path=/;`;
        // document.cookie = `nflPicks2=helloworld; expires=Sun, 14 Jan 2024 16:23:02 GMT; domain=192.168.0.110;`;
        // document.cookie = `nflPicks2=helloworld; expires=Sun, 14 Jan 2024 16:23:02 GMT; domain=192.168.0.110; path=/; SameSite=None; Secure`;

        const jsonString = JSON.stringify(this.state.weeks);
    }

    getCookieByName(name){
        const cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            const thisCookie = cookies[i].trim();
            // console.log(thisCookie);
            if (thisCookie.slice(0, name.length + 1) === `${name}=`) {
                const cookieString = thisCookie.slice(name.length + 1);
                return JSON.parse(cookieString);
            } 
        }
        console.log(`NO COOKIE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
        return false;
    }
    

    static get observedAttributes() {
        return ["checked", "input"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(name, oldValue, newValue);
        if (name === 'checked') this.updateChecked(newValue);
    }

    updateChecked(value) {
        // console.log(value);
        // this.checkbox.checked = value != null && value !== "false";
        // console.log(this.checkbox.checked);
    }

    updatePick(radio) {
        console.log(radio);
        console.log(`${radio.id} - ${radio.value}`);
    }
}

customElements.define('nfl-week', NFLweek);

function getDayName(dayNumber) {
    dayNames = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
    ];
    return (dayNames[dayNumber]);
}

function getMonthName(monthNumber) {
    monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    return (monthNames[monthNumber]);
}

function getCurrentWeek(timestamp) {
    const weekTimes = {
        // 1: 1693994400, // 9-06-2023
        2: 1694599200, // 9-13-2023
        3: 1695204000, // 9-20-2023
        4: 1695808800, // 9-27-2023
        5: 1696413600, // 10-04-2023
        6: 1697018400, // 10-11-2023
        7: 1697623200, // 10-18-2023
        8: 1698228000, // 10-25-2023
        9: 1698832800, // 11-01-2023
        10: 1699441200, // 11-08-2023
        11: 1700046000, // 11-15-2023
        12: 1700650800, // 11-22-2023
        13: 1701255600, // 11-29-2023
        14: 1701860400, // 12-06-2023
        15: 1702465200, // 12-13-2023
        16: 1703070000, // 12-20-2023
        17: 1703674800, // 12-27-2023
        18: 1704279600, // 1-03-2024
    }

    let currentWeek = 1;
    for (const weekNumber in weekTimes) {
        if (timestamp >= weekTimes[weekNumber]) {
            currentWeek = weekNumber
        }
    }

    return currentWeek;
}

function sortByDays(weekJSON) {
    let gameDaysArray = [];

    weekJSON.events.map((game) => {
        const gameDate = new Date(game.date);
        const gameMonth = gameDate.getMonth() + 1;
        const gameDay = gameDate.getDate();
        const gameYear = gameDate.getFullYear();
        const fullDateName = `${gameMonth}-${gameDay}-${gameYear}`;

        let newDay = true;
        gameDaysArray.map((day) => {
            if (fullDateName === day.fullDateName) {
                newDay = false;
                day.games.push(game);
            }
        });
        if (newDay) {
            gameDaysArray.push({
                fullDateName,
                'dateObj': gameDate,
                'timeStamp': gameDate.getTime(),
                'games': [ game ]
            });
        }
    });

    console.log(gameDaysArray);

    gameDaysArray.sort((a, b) => {
        a.timeStamp - b.timeStamp
    })
    console.log(gameDaysArray.keys());

    return gameDaysArray;
}
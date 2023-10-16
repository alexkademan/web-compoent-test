// document.cookie = "nflExperiment=John Doe; expires=Thu, 18 Dec 2020 12:00:00 UTC; path=/";
const template = document.createElement("template");
template.innerHTML = `
    <slot></slot>
`

class NFLweek extends HTMLElement {
    constructor() {
        super();
        document.cookie = `nflPicks=erase; expires=Sun, 14 Jan 2020 16:23:02 GMT; domain=192.168.0.110;`;
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
        // console.log(document.cookie);
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
        this.renderWeekPicks();
    }

    renderWeekPicks() {        
        const weekJSON = this.state.currentWeekJSON;
        const days = sortByDays(weekJSON);
        console.log(days);

        const gameCount = this.state.currentWeekJSON.events.length;

        let completedPicksCount = 0;

        const weekState = this.state.weeks[this.state.currentWeek];
        // console.log(gameCount);

        for (let i = 0; i < gameCount; i = i + 1) {
            const thisGame = this.state.currentWeekJSON.events[i];
            const thisGameState = weekState.games[thisGame.id];
            if (thisGameState.pick !== false && thisGameState.points !== false) {
                completedPicksCount = completedPicksCount + 1;
            }
        }

        console.log(gameCount);
        console.log(completedPicksCount);

        const picksElement = document.createElement('picks');
        picksElement.id = 'week-picks';
        picksElement.className = 'picks';
        picksElement.innerHTML = `
            <header>
                <h1>
                    week ${this.state.currentWeek}
                    <span class="count">${this.state.currentWeekJSON.events.length} games</span>
                </h1>
            </header>
        `;

        const daysSection = document.createElement('section');
        daysSection.className = 'picks-days';
        days.map((day) => {
            // console.log(day);
            // console.log(day.games.length);
            let pickedTeams = [];
            for (let i = 0; i < day.games.length; i = i + 1) {
                const thisGame = day.games[i];
                if (weekState.games[thisGame.id].pick !== false) {
                    pickedTeams.push(thisGame);
                }
            }
            if (pickedTeams.length === 0) {
                return false;
            }

            const dayName = getDayName(day.dateObj.getDay());
            const monthName = getMonthName(day.dateObj.getMonth());

            const dayElement = document.createElement('day');
            dayElement.className = 'day';
            dayElement.innerHTML = `
                <header>
                    <h2>${dayName}, ${monthName} ${day.dateObj.getDate()}</h2>
                </header>
            `;

            pickedTeams.map((game) => {
                const choice = weekState.games[game.id];
                const competitors = game.competitions[0].competitors;

                let chosenTeam = competitors[0].team;
                if (choice.pick = 'away') { 
                    chosenTeam = competitors[1].team;
                }
                console.log(chosenTeam);
                const pickElement = document.createElement('pick');
                pickElement.className = 'pick';
                pickElement.innerHTML = `
                    <img src="images/${chosenTeam.abbreviation}.png" alt="${chosenTeam.name}-logo" />
                    <h3>${chosenTeam.displayName}</h3>
                    <span>${choice.points ? choice.points : '-'}</span>
                `;
                dayElement.append(pickElement);
            });

            daysSection.append(dayElement);
        })
        picksElement.append(daysSection);

        const weekPicksFooter = document.createElement('footer');
        weekPicksFooter.innerHTML = `
            <h2>${completedPicksCount} of ${gameCount}</h2>
        `;
        picksElement.append(weekPicksFooter);

        this.append(picksElement);
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
        weekDiv.className = `week week-${weekNum}`;
        const gameCount = weekJSON.events.length;

        weekDiv.innerHTML = `
            <header class="header">
                <h1>
                    <label for="week-selector" class="week-selector"></label>
                    <span class="week-count">${gameCount} games</span>
                </h1>
            </header>
            <section class="week"></section>
        `;

        this.innerHTML = '';
        this.append(weekDiv);
        const daysDiv = weekDiv.getElementsByClassName('week')[0];
        const weekSelector = weekDiv.getElementsByClassName('week-selector')[0];

        weekSelector.prepend(this.renderWeekSelector(weekNum));

        days.map((day) => {
            daysDiv.append(this.renderDay(day));
        })

        weekDiv.append(this.renderWeekFooter());
    }

    renderWeekFooter() {
        const weekFooter = document.createElement('footer');
        weekFooter.className = 'week-footer';
        

        const byeDiv = document.createElement('div');
        byeDiv.className = 'bye';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'title';
        nameDiv.innerHTML = 'Bye: '
        byeDiv.append(nameDiv);

        const week = this.state.currentWeekJSON.week;
        if (week.teamsOnBye) {
            const teams = week.teamsOnBye;            
            const byeGames = document.createElement('div');
            byeGames.className = 'bye-games';

            for (let i = 0; i < teams.length; i = i + 1) {
                const team = teams[i];
                const byeGame = document.createElement('div');
                byeGame.className = `bye-game`;

                let comma = '';
                if (i !== (teams.length -1)) {
                    comma = ',';
                }
                
                byeGame.innerHTML = `
                    <img src="images/${team.abbreviation}.png" alt="${team.name}-logo" />
                    <h4>${team.abbreviation}${comma}</h4>
                `;
                byeGames.append(byeGame);
            }
            byeDiv.append(byeGames);
        } else {
            const byeGame = document.createElement('span');
            byeGame.className = `bye-game`;
            byeGame.innerHTML += `<h4>none</h4>`;
            byeDiv.append(byeGame);
        }

        weekFooter.append(byeDiv);

        weekFooter.innerHTML += `
            <button class="reset">reset</button>
        `;
        const eraseBtn = weekFooter.getElementsByClassName('reset')[0];
        eraseBtn.addEventListener('click', (e) => {
            // console.log('erase cookie now.');
            document.cookie = `nflPicks=False; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${this.domain}; path=/;`;
            location.reload();
        });
        return weekFooter;
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
        // this.state.weeks[weekNum] = games;
        this.state.weeks[weekNum] = {
            'submitted': false,
            weekNum,
            games
        };
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
            console.log(newWeek)

            const currentURL = window.location.href;
            let baseURL = currentURL.split("#")[0];
            console.log(baseURL);

            window.location.href = `${baseURL}#week=${newWeek}`;
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
        // console.log(day.games);
        day.games.map((game) => {
            gamesDiv.append(this.renderGame(game));
        })
        dayDiv.append(gamesDiv);

        return dayDiv;
    }

    updateRenderedWeek() {
        const pointsSelectors = this.getElementsByTagName('select');
        console.log(pointsSelectors);
        console.log('update the rendered week now?');
        // pointsSelectors.map((pointSelector) => {
        //     console.log(pointSelector);
        // })
        console.log(pointsSelectors.length);
        for (let i = 0; i < pointsSelectors.length; i = i + 1) {
            // console.log(i);
            // console.log(pointsSelectors[i]);
            // pointsSelectors[i].innerHTML = 'POINTS.';
            // pointsSelectors[i].parentNode.innerHTML = "points";
            // pointsSelectors[i].parentElement.innerHTML = "points";
            if (pointsSelectors[i].className === 'point-selector') {
                const selector = pointsSelectors[i];
                // console.log(i);
                // console.log(selector.id);
                // console.log(selector.id.slice(7));
                // thisCookie.slice(0, name.length + 1) === `${name}=`)
                this.updateSelector(selector, selector.id.slice(7));
            }
        }
    }

    updateSelector(selector, id) {
        // console.log(selector);
        // console.log(id);
        const weekState = this.state.weeks[this.state.currentWeek];
        // console.log(weekState);
        // this.gamePointsSelectOpts(id, weekState)
        selector.innerHTML = this.gamePointsSelectOpts(id, weekState);
    }

    renderGame(game) {
        const gameState = this.state.weeks[this.state.currentWeek].games[game.id];
        const gameDiv = document.createElement("game");

        if (gameState.pick) {
            gameDiv.className = `game pick-${gameState.pick}`;
        } else {
            gameDiv.className = 'game';
        }
        const homeTeam = game.competitions[0].competitors[0];
        const awayTeam = game.competitions[0].competitors[1];

        // console.log(game);
        // console.log(gameState);

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
                this.state.weeks[this.state.currentWeek].games[e.target.name].pick = e.target.value;
                this.setCookie();
                
                console.log(this.state.currentWeek);
                console.log(e.target.name);
                console.log(e.target.value);
                const weekNum = this.state.currentWeek;
                this.state.weeks[weekNum].games[e.target.name].pick = e.target.value;
                // console.log('update the page ???');
                gameDiv.className = `game pick-${e.target.value}`
            })
        }
        console.log(gameState);
        // gameDiv.innerHTML += `${gameState.pick}`;
        gameDiv.append(this.renderGameFooter(game));
        return gameDiv;
    }

    renderGameFooter(game) {
        const gameFooter = document.createElement('footer');
        gameFooter.className = "footer";

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
        } else {
            gameFooter.innerHTML = `
                <div class="status"></div>`;
        }

        const weekState = this.state.weeks[game.week.number];
        // const gameState = this.state.weeks[game.week.number].games[game.id];
        // console.log('weekState');
        // console.log(weekState);
        gameFooter.innerHTML += `
            <div class="points">
                <select id="points-${game.id}" class="point-selector">
                    ${this.gamePointsSelectOpts(game.id, weekState)}
                </select>
            </points>
        `;

        const pointSelect = gameFooter.getElementsByClassName('points')[0];
        
        pointSelect.addEventListener('change', (e) => {
            console.log(e);
            console.log(e.target[e.target.selectedIndex]);
            console.log(e.target[e.target.selectedIndex].value)

            let newPickPoints = e.target[e.target.selectedIndex].value;
            if (newPickPoints === 'false') {
                newPickPoints = false;
            }

            this.state.weeks[game.week.number].games[game.id].points = newPickPoints;
            this.setCookie();
        });

        return gameFooter;
    }

    gamePointsSelectOpts(gameId, weekState) {
        const allGames = this.state.currentWeekJSON.events;
        const gameCount = this.state.currentWeekJSON.events.length;
        let opts = '<option value="false">-</option>';

        for (let i = 1; i <= gameCount; i = i+1) {
            let selected = '';
            let render = true;
            if (parseInt(weekState.games[gameId].points) === i) {
                selected = ' selected="selected"';
            }
            for (let x = 0; x < allGames.length; x = x + 1) {
                if (selected === '') {
                    if (parseInt(weekState.games[allGames[x].id].points) === i) {
                        // console.log(`dont render ${i}`);
                        render = false;
                    }
                }
            }
            if (render) {
                opts += `<option value="${i}"${selected}>${i}</option>`;
            }
        }
        return opts;
    }   

    setCookie(action) {
        const andNow = new Date().getTime();
        const expire = new Date(andNow + 8640000000).toUTCString();
        const data = JSON.stringify(this.state.weeks);
        document.cookie = `nflPicks=${data}; expires=${expire}; domain=${this.domain}; path=/;`;

        const jsonString = JSON.stringify(this.state.weeks);
        this.updateRenderedWeek();
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
        1: 1693994400, // 9-06-2023
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

    const currentHash = window.location.href.split("#")[1];
    if (currentHash) {
        if (currentHash.slice(0, 5) === 'week=') {
            const urlVar = currentHash.slice(5);
            // console.log(urlVar);
            if (weekTimes[urlVar]) {
                // console.log(`week from url: ${urlVar}`);
                return urlVar;
            }
            
        }
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

    gameDaysArray.sort((a, b) => {
        return a.timeStamp - b.timeStamp
    })

    return gameDaysArray;
}

const template = document.createElement("template");
template.innerHTML = `
    <link rel="stylesheet" href="css/nfl-week.css" media="print" onload="this.media='all'">
    <div class="game">
        <label>
            <slot></slot>
            <slot name="description" class="description"></slot>            
        </label>

        <input type="radio" id="radioAway" name="game" "value="away">
        <input type="radio" id="radioHome" name="game" value="home">

        <label for="radioAway">away</label>
        <label for="radioHome">home</label>
    </div>
`

class NFLweek extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });;
        shadow.append(template.content.cloneNode(true));
        this.checkbox = shadow.querySelector('input');

        const inputs = shadow.querySelectorAll("input");

        const radioAway = shadow.getElementById("radioAway");
        radioAway.addEventListener('change', () => {
            this.updatePick(radioAway);
        })
        const radioHome = shadow.getElementById("radioHome");
        radioHome.addEventListener('change', () => {
            this.updatePick(radioHome);
        });
    }

    connectedCallback() {
        const timestamp = new Date().getTime() / 1000;
        const currentWeek = getCurrentWeek(timestamp);
        
        const weekAJAX = this.fetchWeekAjax(currentWeek);
    }

    async fetchWeekAjax(currentWeek) {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${currentWeek}`);
        const weekJSON = await response.json();

        this.renderWeek(weekJSON);
    }

    renderWeek(weekJSON) {
        const days = sortByDays(weekJSON);
        console.log(days);

        days.map((day) => {
            console.log(day);
            this.renderDay(day);
        })
    }

    renderDay(day) {
        shadow.append(template.content.cloneNode(true));
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
        this.checkbox.checked = value != null && value !== "false";
        // console.log(this.checkbox.checked);
    }

    updatePick(radio) {
        console.log(radio);
        console.log(`${radio.id} - ${radio.value}`);
    }
}

customElements.define('nfl-week', NFLweek);



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
                'games': [ game ]
            });
        }
    });

    return gameDaysArray;
}
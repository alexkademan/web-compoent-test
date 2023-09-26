async function logMovies() {
    const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=4");
    const movies = await response.json();
    console.log(movies);
}

logMovies();

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
        console.log(inputs);



        const radioAway = shadow.getElementById("radioAway");
        radioAway.addEventListener('change', () => {
            this.updatePick(radioAway);
        })
        const radioHome = shadow.getElementById("radioHome");
        radioHome.addEventListener('change', () => {
            this.updatePick(radioHome);
        });        
        
    }

    static get observedAttributes() {
        return ["checked", "input"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(name, oldValue, newValue);
        if (name === 'checked') this.updateChecked(newValue);
    }

    updateChecked(value) {
        console.log(value);
        this.checkbox.checked = value != null && value !== "false";
        // console.log(this.checkbox.checked);
    }

    updatePick(radio) {
        console.log(radio);
        console.log(`${radio.id} - ${radio.value}`);
    }
}

customElements.define('nfl-week', NFLweek);

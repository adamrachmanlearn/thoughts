// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainSection = document.getElementById("main-content");
const footerSection = document.querySelector("footer");
const searchSection = document.querySelector(".search");
const searchInput = searchSection.firstElementChild;
const btnTop = document.querySelector(".top");
const fullMonthName = [
    null, "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
];

// declare manifest globally
let manifest;

async function getManifest () {
    const res = await fetch("./content/manifest.json");
    if (!res.ok) throw new Error("Failed fetching manifest");

    manifest = await res.json();
    router();
}

async function getContent (page) {
    let filePath;

    // cond ? true : false
    page.isPage === false ?
        filePath = `./content/thoughts/${page.fileName}` :
        filePath = `./content/pages/${page.fileName}`

    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed fetching content");

    // using marked js to parse md files
    return marked.parse(await res.text());
}

async function renderHome () {
    const homePage = manifest.find(page => page.slug === "home");
    const content = await getContent(homePage);

    mainSection.innerHTML = content;

    // change this after updating current section
    renderLastUpdated("2026-08-29");

    // render section
    renderLatest(manifest);
    renderFeatured(manifest);
    renderBadges();

    adjustExtLinks(mainSection);

    // make footer visible AFTER all content loaded
    footerSection.style.display = "block";

    scrollToTop();
}

function renderLastUpdated(oldDate) {
    const prefix = "※ Updated -";
    let mainVal;
    let secVal;
    let mainUnit;
    let secUnit;

    const newSmall = document.createElement("small");

    const timeElapsed = new Date() - new Date(oldDate);

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    // allows switch to go straight into each case using true in param
    switch (true) {
        case timeElapsed < minute:
            newSmall.textContent = `${prefix} Just now`;
            break;
        case timeElapsed < hour:
            mainVal = Math.floor(timeElapsed / minute);
            mainUnit = "m ago";
            newSmall.textContent = `${prefix} ${mainVal}${mainUnit}`;
            break;
        case timeElapsed < day:
            mainVal = Math.floor(timeElapsed / hour);
            // using remainder/modulo (%) to get the remaining milliseconds value
            // after its done filling as much [hour] as possible,
            // then throw it to get as much [minute] as possible
            secVal = Math.floor((timeElapsed % hour) / minute);
            mainUnit = "h";
            secUnit = "m ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit} ${secVal}${secUnit}`;
            break;
        case timeElapsed < week:
            mainVal = Math.floor(timeElapsed / day);
            secVal = Math.floor((timeElapsed % day) / hour);
            mainUnit = "d";
            secUnit = "h ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit} ${secVal}${secUnit}`;
            break;
        case timeElapsed < month:
            mainVal = Math.floor(timeElapsed / week);
            secVal = Math.floor((timeElapsed % week) / day);
            mainUnit = "wk";
            secUnit = "d ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit} ${secVal}${secUnit}`;
            break;
        case timeElapsed < year:
            mainVal = Math.floor(timeElapsed / month);
            secVal = Math.floor((timeElapsed % month) / week);
            mainUnit = "mo";
            secUnit = "wk ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit} ${secVal}${secUnit}`;
            break;
        default:
            mainVal = Math.floor(timeElapsed / year);
            secVal = Math.floor((timeElapsed % year) / month);
            mainUnit = "yr";
            secUnit = "mo ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit} ${secVal}${secUnit}`;
    }

    mainSection.append(newSmall);
}

function renderLatest () {
    const pages = manifest.filter(page => page.isPage === false);
    const latestPages = pages.slice(0, 3);

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Latest thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    latestPages.forEach(page => {
        const newLi = document.createElement("li");

        newLi.innerHTML =
        `<a href="#${page.slug}">${page.title}</a>`
        newUl.append(newLi);
    });

    mainSection.append(newSection);
}

function renderFeatured () {
    const pages = manifest.filter(page => page.isPage === false);
    const featPages = pages.filter(page => page.tags.includes("feat"));

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Featured thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    featPages.forEach(page => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${page.slug}">${page.title}</a>`
        newUl.append(newLi);
    });

    mainSection.append(newSection);
}

function renderBadges () {
    const newSection = document.createElement("section");
    newSection.classList.add("badge-container");
    newSection.innerHTML =
        `
        <img class="big-badge" src="./assets/badges/by-human.svg" alt="Made by human badge" />
        <img src="./assets/badges/github-pages.svg" alt="GitHub pages badge" />
        <img src="./assets/badges/html.svg" alt="HTML badge" />
        <img src="./assets/badges/css.svg" alt="CSS badge" />
        <img src="./assets/badges/js.svg" alt="JavaScript badge" />
        <img src="./assets/badges/anime-blink.gif" alt="Anime blinking badge" />
        `;

    mainSection.append(newSection);
}

async function renderAbout () {
    const page = manifest.find(page => page.slug === "about");
    const content = await getContent(page);
    
    mainSection.innerHTML = content;

    renderBadges();

    adjustExtLinks(mainSection);

    // make footer visible AFTER all content loaded
    footerSection.style.display = "block";

    scrollToTop();
}

function renderArchives (manifest) {
    const pages = manifest.filter(thought => thought.isPage === false);
    
    let currentYear;
    let currentMonth;
    let currentUl;

    // reset main section before rendering new list
    mainSection.innerHTML = "";

    if (pages.length === 0) {
        const newBr = document.createElement("br");
        const newInfo = document.createElement("ul");
        newInfo.classList.add("hint", "no-style-list");
        newInfo.innerHTML = `
            <li>Try searching by:</li>
            <li>&emsp; <strong>title</strong>: "the actual reason you do things"</li>
            <li>&emsp; <strong>date posted</strong>: "july", "2026", "2026-07-25"</li>
        `;
        mainSection.append(newBr);
        mainSection.append(newInfo);
    } else {
        const newSmall = document.createElement("small");
        newSmall.classList.add("hint");
        newSmall.textContent =
        `${pages.length} ${pages.length > 1 ? "thoughts" : "thought"} written`;
        mainSection.append(newSmall);
    }

    pages.forEach(page => {
        let currentThoughtYear = page.posted.slice(0, 4);
        let currentThoughtMonth = Number(page.posted.slice(5, 7));

        if (currentYear !== currentThoughtYear) {
            currentYear = currentThoughtYear;

            // resetting month if year changed
            currentMonth = null;
        }

        if (currentMonth !== currentThoughtMonth) {
            currentMonth = currentThoughtMonth;

            const newHeader = document.createElement("h4");
            newHeader.textContent = `${fullMonthName[currentMonth]}, ${currentYear}`;
            mainSection.append(newHeader);

            // create ul for this month
            currentUl = document.createElement("ul");
            currentUl.classList.add("no-style-list");

            mainSection.append(currentUl);
        }

        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<div class="list-div">
        ${page.posted.slice(-2)}
        <a href="#${page.slug}">${page.title}</a>
        </div>`;

        currentUl.append(newLi);
    });

    renderBadges();

    adjustExtLinks(mainSection);

    // make footer visible AFTER all content loaded
    footerSection.style.display = "block";

    scrollToTop();
}

// search box event listener
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    
    const filteredPages = manifest.filter(page =>
        // search by date with ISO 8601 format (YYYY-MM-DD)
        page.posted.includes(query) ||

        // search by date with month date, year format
        formatDate(page.posted).toLowerCase().includes(query) ||

        //  search by title
        page.title.toLowerCase().includes(query)
    );

    renderArchives(filteredPages);
});

async function renderThought (page) {
    const content = await getContent(page);

    mainSection.innerHTML =
    `<h2>${page.title}</h2>
    <p><small>Posted on ${formatDate(page.posted)}</small></p>
    <br>
    ${content}`;

    renderBadges();

    adjustExtLinks(mainSection);

    // make footer visible AFTER all content loaded
    footerSection.style.display = "block";

    scrollToTop();
}

function renderNotFound () {
    mainSection.innerHTML = 
    `<h2>Not found</h2>
    <br>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;

    renderBadges();

    adjustExtLinks(mainSection);

    // make footer visible AFTER all content loaded
    footerSection.style.display = "block";

    scrollToTop();
}

function adjustExtLinks (container) {
    container.querySelectorAll("a").forEach(link => {
        if(link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    });
}

function formatDate(dateStr) {
    // getting individual var from "2000-01-01" format
    const [year, month, day] = dateStr.split("-");

    return(
        `${fullMonthName[parseInt(month)]}
        ${parseInt(day)},
        ${year}`
    );
}

function scrollToTop(behavior) {
    if(behavior === undefined) behavior = "instant";
    window.scrollTo({top: 0, behavior: behavior});
}

function toggleSearch(show) {
    searchSection.classList.toggle("search-visible", show);
}

async function router() {
    const slug = window.location.hash.replace("#", "");

    if (!slug) {
        toggleSearch(false);
        renderHome();
        return;
    } else if (slug === "about") {
        toggleSearch(false);
        renderAbout();
        return;
    } else if (slug === "archives") {
        toggleSearch(true);
        renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            toggleSearch(false);
            renderThought(page);
        } else {
            toggleSearch(false);
            renderNotFound();
        }
    }
}

btnTop.addEventListener("click", () => scrollToTop("smooth"));

window.addEventListener("DOMContentLoaded", getManifest);
window.addEventListener("hashchange", () => {
    searchInput.value = "";
    router();
});
// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainSection = document.getElementById("main-content");
const searchSection = document.querySelector(".search");
const searchInput = searchSection.firstElementChild;
const buttonTop = document.querySelector(".top");
const footerSection = document.querySelector("footer");

// declare manifest globally
let manifest;

async function getManifest() {
    const res = await fetch("./content/manifest.json");
    if(!res.ok) throw new Error("Failed fetching manifest");

    manifest = await res.json();
    router();
}

async function getContent(page) {
    const filePath = page.isPage === false ?
        `./content/thoughts/${page.fileName}` :
        `./content/pages/${page.fileName}`

    const res = await fetch(filePath);
    if(!res.ok) throw new Error("Failed fetching content");

    // using marked js to parse md files
    return marked.parse(await res.text());
}

async function renderHome() {
    const homePage = manifest.find(page => page.slug === "home");
    const content = await getContent(homePage);

    mainSection.innerHTML = content;

    // change this after updating current section
    const updateDate = "2026-08-29";
    const updateTime = "15:15";
    renderLastUpdated(`${updateDate}T${updateTime}`);

    renderLatest(manifest);
    renderFeatured(manifest);

    defaultBehavior();
}

async function renderPage(slug) {
    if(slug === "archives") {
        toggleSearch(true);
        renderArchives(manifest);
        return;
    }

    const page = manifest.find(page => page.slug === slug);
    const content = await getContent(page);

    // format mainSection
    mainSection.innerHTML = content;

    if(page.isPage === false) {
        const newHeader = document.createElement("h2");
        const newPosted = document.createElement("p");
        const newSpace = document.createElement("br");

        newHeader.innerText = page.title;
        newPosted.innerHTML =
        `<small>Posted on ${formatDate(page.posted)}</small>`;
        mainSection.prepend(newHeader, newPosted, newSpace);
    }

    defaultBehavior(slug);
}

function renderArchives(manifest) {
    const pages = manifest.filter(thought => thought.isPage === false);
    
    let currentYear, currentMonth, currentUl;

    // reset main section before rendering new list
    mainSection.innerHTML = "";

    if(pages.length === 0) {
        const newSpace = document.createElement("br");
        const newInfo = document.createElement("ul");
        newInfo.classList.add("hint", "no-style-list");
        newInfo.innerHTML = 
            `<li>Try searching by:</li>
            <li>&emsp; <strong>title</strong>: "the actual reason you do things"</li>
            <li>&emsp; <strong>date posted</strong>: "july", "2026", "2026-07-25"</li>`;
        mainSection.append(newSpace);
        mainSection.append(newInfo);
    } else {
        const newSmall = document.createElement("small");
        newSmall.classList.add("hint");
        newSmall.textContent =
        `${pages.length} ${pages.length > 1 ? "thoughts" : "thought"} written`;
        mainSection.append(newSmall);
    }

    pages.forEach(page => {
        const datePosted = formatDate(page.posted);
        let currentThoughtYear = datePosted.slice(-4);
        let currentThoughtMonth = datePosted.slice(0, 3);

        if (currentYear !== currentThoughtYear) {
            currentYear = currentThoughtYear;

            // resetting month if year changed
            currentMonth = null;
        }

        if (currentMonth !== currentThoughtMonth) {
            currentMonth = currentThoughtMonth;

            const newHeader = document.createElement("h4");
            newHeader.textContent = `${datePosted.split(" ")[0]}, ${currentYear}`;
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

    defaultBehavior("archives");
}

function renderNotFound() {
    mainSection.innerHTML = 
    `<h2>Not found</h2>
    <br>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;

    defaultBehavior();
}

function renderLastUpdated(oldDate) {
    const prefix = "Updated";
    let mainVal, secVal, mainUnit, secUnit;

    const newSmall = document.createElement("small");

    const timeElapsed = new Date() - new Date(oldDate);
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    // allows switch to go straight into each case using true in param
    switch(true) {
        case timeElapsed < day:
            newSmall.textContent = `${prefix} today`
            break;
        case timeElapsed < week:
            mainVal = Math.floor(timeElapsed / day);
            mainUnit = "d ago";
            newSmall.textContent = `${prefix} ${mainVal}${mainUnit}`
            break;
        case timeElapsed < month:
            // using remainder/modulo (%) to get the remaining milliseconds value
            // after its done filling as much [hour] as possible,
            // then throw it to get as much [minute] as possible
            mainVal = Math.floor(timeElapsed / week);
            secVal = Math.floor((timeElapsed % week) / day);
            mainUnit = "w";
            secUnit = "d ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit}` +
            (secVal > 0 ? ` ${secVal}${secUnit}` : " ago");
            break;
        case timeElapsed < year:
            mainVal = Math.floor(timeElapsed / month);
            secVal = Math.floor((timeElapsed % month) / week);
            mainUnit = "mo";
            secUnit = "w ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit}` +
            (secVal > 0 ? ` ${secVal}${secUnit}` : " ago");
            break;
        default:
            mainVal = Math.floor(timeElapsed / year);
            secVal = Math.floor((timeElapsed % year) / month);
            mainUnit = "y";
            secUnit = "mo ago";
            newSmall.textContent =
            `${prefix} ${mainVal}${mainUnit}` +
            (secVal > 0 ? ` ${secVal}${secUnit}` : " ago");
    }

    mainSection.append(newSmall);
}

function renderLatest() {
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

function renderFeatured() {
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

function renderBadges() {
    const newSection = document.createElement("section");
    newSection.classList.add("badge-container");
    newSection.innerHTML =
        `<img class="big-badge" src="./assets/badges/by-human.svg" alt="Made by human badge" />
        <img src="./assets/badges/github-pages.svg" alt="GitHub pages badge" />
        <img src="./assets/badges/html.svg" alt="HTML badge" />
        <img src="./assets/badges/css.svg" alt="CSS badge" />
        <img src="./assets/badges/js.svg" alt="JavaScript badge" />
        <img src="./assets/badges/anime-blink.gif" alt="Anime blinking badge" />`;

    mainSection.append(newSection);
}

function formatDate(string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(new Date(string));
}

function adjustExtLinks(section) {
    section.querySelectorAll("a").forEach(link => {
        if(link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    });
}

function toggleSearch(show) {
    searchSection.classList.toggle("search-visible", show);
}

function scrollToTop(behavior) {
    if(behavior === undefined) behavior = "instant";
    window.scrollTo({top: 0, behavior: behavior});
}

function defaultBehavior(slug) {
    slug !== "archives" ? toggleSearch(false) : toggleSearch(true);

    renderBadges();
    adjustExtLinks(mainSection);
    footerSection.style.display = "block";
    scrollToTop();
}

async function router() {
    const slug = window.location.hash.replace("#", "");

    // arr.some() will return true if even one page found
    const pageFound = manifest.some(page => page.slug === slug);

    switch(true) {
        case slug === "":
            renderHome();
            break;
        case pageFound:
            renderPage(slug);
            break;
        default:
            renderNotFound();
    }
}

// event listeners
buttonTop.addEventListener("click", () => scrollToTop("smooth"));
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const pages = manifest.filter(page => page.isPage === false);
    
    const filteredPages = pages.filter(page =>
        // search by date (2000-01-01)
        page.posted.includes(query) ||

        // search by date (january 1, 2000)
        formatDate(page.posted).toLowerCase().includes(query) ||

        //  search by title
        page.title.toLowerCase().includes(query)
    );

    renderArchives(filteredPages);
});

window.addEventListener("DOMContentLoaded", getManifest);
window.addEventListener("hashchange", () => {
    // resetting search box
    searchInput.value = "";
    router();
});
// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainContent = document.getElementById("main-content");
const btnTop = document.querySelector(".top");
const fullMonthName = [
    null,
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

async function getManifest () {
    const res = await fetch("./thoughts/thoughts.json");
    if (!res.ok) throw new Error("Failed fetching manifest");
    return await res.json();
}

async function getContent (filePath) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("Failed fetching content");
    return marked.parse(await res.text());
}

async function renderHome (manifest) {
    const page = manifest.find(page => page.slug === "home");
    const content = await getContent(page.filePath);

    mainContent.innerHTML = content;

    // render sections
    renderLatest(manifest);
    renderFeatured(manifest);
    renderBadges();

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderLatest (manifest) {
    // getting latest three thoughts
    const latestThoughts = manifest.slice(0, 3);

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Latest thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    latestThoughts.forEach(thought => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${thought.slug}">${slugToTitle(thought.slug)}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderFeatured (manifest) {
    const featuredThoughts = manifest.filter(page => page.metaTag.includes("featured"));

    const newSection = document.createElement("section");
    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Featured thoughts";
    newUl.classList.add("no-style-list");

    newSection.append(newHeader);
    newSection.append(newUl);

    featuredThoughts.forEach(thought => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${thought.slug}">${slugToTitle(thought.slug)}</a>`
        newUl.append(newLi);
    });

    mainContent.append(newSection);
}

function renderBadges () {
    const newSection = document.createElement("section");
    newSection.classList.add("badge-container");
    newSection.innerHTML =
        `
        <img class="classic-badge" src="./assets/badges/human-not-ai.svg" alt="Written by Human Not AI" />
        <img src="./assets/badges/github-pages.svg" alt="GitHub pages" />
        <img src="./assets/badges/html.svg" alt="HTML" />
        <img src="./assets/badges/css.svg" alt="CSS" />
        <img src="./assets/badges/js.svg" alt="JavaScript" />
        <img src="./assets/badges/anime-blink.gif" alt="Anime blinking" />
        `;

    mainContent.append(newSection);
}

async function renderAbout (manifest) {
    const page = manifest.find(page => page.slug === "about");
    const content = await getContent(page.filePath);
    
    mainContent.innerHTML = content;

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderArchives (manifest) {
    let currentYear;
    let currentMonth;
    let currentUl;

    mainContent.innerHTML = "<h2>Archives</h2>";

    const thoughts = manifest.filter (thought => !thought.metaTag.includes("hidden"));

    thoughts.forEach(thought => {
        let currentThoughtYear = thought.posted.slice(0, 4);
        let currentThoughtMonth = Number(thought.posted.slice(5, 7));

        if (currentYear !== currentThoughtYear) {
            currentYear = currentThoughtYear;
            // resetting month if year changed
            currentMonth = null;
        }

        if (currentMonth !== currentThoughtMonth) {
            currentMonth = currentThoughtMonth;
            const newHeader = document.createElement("h4");
            newHeader.textContent = `${fullMonthName[currentMonth]}, ${currentYear}`;
            mainContent.append(newHeader);

            // create ul for this month
            currentUl = document.createElement("ul");
            currentUl.classList.add("no-style-list");
            mainContent.append(currentUl);
        }

        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<div class="list-div">
        ${thought.posted.slice(-2)}
        <a href="#${thought.slug}">${slugToTitle(thought.slug)}</a>
        </div>`;
        currentUl.append(newLi);
    });

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.filePath);

    mainContent.innerHTML =
    `<h2>${slugToTitle(page.slug)}</h2>
    <p><small>Posted on ${formatDate(page.posted)}</small></p>
    <br>
    ${content}`;

    adjustExtLinks(mainContent);

    scrollToTop();
}

function renderNotFound () {
    mainContent.innerHTML = 
    `<h2>Not found</h2>
    <br>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;
}

function adjustExtLinks (container) {
    container.querySelectorAll("a").forEach(link => {
        if (link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    })
}

function formatDate (dateStr) {
    // getting individual var from "2000-01-01" format
    const [year, month, day] = dateStr.split("-");

    return `
    ${fullMonthName[parseInt(month)].slice(0, 3)}
    ${parseInt(day)},
    ${year}
    `
}

function slugToTitle (string) {
    /*
        replace - with space
        make first char with uppercase
        make standalone i into I (pronoun)
    */
    return string
        .replace(/-/g, " ")
        .replace(/^./, char => char.toUpperCase())
        .replace(/\bi\b/gi, "I");
}

function scrollToTop (behavior) {
    if (behavior === undefined) behavior = "instant";
    window.scrollTo({top: 0, behavior: behavior});
}

btnTop.addEventListener("click", () => scrollToTop("smooth"));

async function router () {
    const manifest = await getManifest();
    const slug = window.location.hash.replace("#", "");

    if (!slug) {
        renderHome(manifest);
        return;
    } else if (slug === "about") {
        renderAbout(manifest);
        return;
    } else if (slug === "archives") {
        renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            renderThought(page);
        } else {
            renderNotFound();
        }
    }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);
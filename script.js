// set marked js to include <br> on a single line break (github behavior)
marked.use({
    gfm: true,
    breaks: true
});

const mainCont = document.getElementById("main-content");
const latestCont = document.getElementById("latest");
const featuredCont = document.getElementById("featured");
const badgeCont = document.querySelector(".badge-container");
const darkToggle = document.getElementById("dark-toggle");
const topButton = document.querySelector(".top");
const hiddenPages = ["home", "about", "archives"];

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
    // render latest and featured
    latestCont.innerHTML = "";
    featuredCont.innerHTML = "";
    renderLatest(manifest);
    renderFeatured(manifest);

    const page = manifest.find(page => page.slug === "home");
    const content = await getContent(page.filePath);

    mainCont.innerHTML = content;

    adjustExtLinks(mainCont);

    latestCont.style.display = "block";
    featuredCont.style.display = "block";
    badgeCont.style.display = "flex";

    scrollToTop();
}

async function renderAbout (manifest) {
    const page = manifest.find(page => page.slug === "about");
    const content = await getContent(page.filePath);
    
    mainCont.innerHTML = content;

    adjustExtLinks(mainCont);

    latestCont.style.display = "none";
    featuredCont.style.display = "none";
    badgeCont.style.display = "none";

    scrollToTop();
}

function renderArchives (manifest) {
    const monthName = [
        "",
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
    let currentYear;
    let currentMonth;
    // global var to refer to ul
    let currentUl;

    mainCont.innerHTML = "<h1>Archives</h1>";

    // only return slug that doesn't included in hiddenPages arr
    const pages = manifest.filter (page => !hiddenPages.includes(page.slug));

    pages.forEach(page => {
        let currentPageYear = page.posted.slice(0, 4);
        let currentPageMonth = Number(page.posted.slice(5, 7));

        if (currentYear !== currentPageYear) {
            currentYear = currentPageYear;
            // resetting month if year changed
            currentMonth = null;

            // create separate year heading
            // const newH3 = document.createElement("h3");
            // newH3.textContent = currentYear;
            // mainCont.append(newH3);
        }

        if (currentMonth !== currentPageMonth) {
            currentMonth = currentPageMonth;
            const newH5 = document.createElement("h5");
            newH5.textContent = `${monthName[currentMonth]}, ${currentYear}`;
            mainCont.append(newH5);

            // create ul for this month
            currentUl = document.createElement("ul");
            currentUl.classList.add("no-style-list");
            mainCont.append(currentUl);
        }

        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<div class="list-div">
        ${page.posted.slice(-2)}:
        <a href="#${page.slug}">${slugToTitle(page.slug)}</a>
        </div>`;
        currentUl.append(newLi);
    });

    latestCont.style.display = "none";
    featuredCont.style.display = "none";
    badgeCont.style.display = "none";

    scrollToTop();
}

async function renderThought (page) {
    const content = await getContent(page.filePath);

    mainCont.innerHTML =
    `<h1>${slugToTitle(page.slug)}</h1>
    <p class="author"><em>Posted on ${formatDate(page.posted)}</em></p>
    <br>
    ${content}`;

    adjustExtLinks(mainCont);

    latestCont.style.display = "none";
    featuredCont.style.display = "none";
    badgeCont.style.display = "none";

    scrollToTop();
}

function renderLatest (manifest) {
    latestCont.innerHTML = "<br>";
    // getting latest three thoughts
    const latest = manifest.slice(0, 3);

    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Latest";
    newUl.classList.add("no-style-list");

    latestCont.append(newHeader);
    latestCont.append(newUl);

    latest.forEach(page => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${page.slug}">${slugToTitle(page.slug)}</a>`
        newUl.append(newLi);
    });
}

function renderFeatured (manifest) {
    // featuredCont.innerHTML = "<br>";
    const featured = manifest.filter(page => page.metaTag === "featured");

    const newHeader = document.createElement("h4");
    const newUl = document.createElement("ul");

    newHeader.textContent = "Featured";
    newUl.classList.add("no-style-list");

    featuredCont.append(newHeader);
    featuredCont.append(newUl);

    featured.forEach(page => {
        const newLi = document.createElement("li");
        newLi.innerHTML =
        `<a href="#${page.slug}">${slugToTitle(page.slug)}</a>`
        newUl.append(newLi);
    });
}

function renderNotFound () {
    mainCont.innerHTML = 
    `<h1>Not found</h1>
    <br>
    <p>Page you're looking for isn't created.. at least <em>yet</em>.</p>`;

    latestCont.style.display = "none";
    featuredCont.style.display = "none";
    badgeCont.style.display = "flex";
}

function formatDate (string) {
    // getting individual var from "2026-01-01"
    const [year, month, day] = string.split("-");

    // create new date obj, month - 1 because js use 0 index month
    const date = new Date(year, month - 1, day);

    // returning new date format
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(date);
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

darkToggle.addEventListener("click", (e) => {
    e.preventDefault();

    document.body.classList.toggle("latex-dark");

    if (darkToggle.innerHTML === "light/<b>dark</b>") {
        darkToggle.innerHTML = "<b>light</b>/dark";
    } else {
        darkToggle.innerHTML = "light/<b>dark</b>";
    }
});

topButton.addEventListener("click", () => scrollToTop("smooth"));

function adjustExtLinks (container) {
    container.querySelectorAll("a").forEach(link => {
        if (link.getAttribute("href").startsWith("http")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    })
}

async function router () {
    const manifest = await getManifest();
    const slug = window.location.hash.replace("#", "");

    if (!slug) {
        await renderHome(manifest);
        return;
    } else if (slug === "about") {
        await renderAbout(manifest);
        return;
    } else if (slug === "archives") {
        await renderArchives(manifest);
        return;
    } else {
        const page = manifest.find(page => page.slug === slug);
        if (page) {
            await renderThought(page);
        } else {
            renderNotFound();
        }
    }
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);
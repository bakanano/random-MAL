let userName = null;
let status = null;
let format = null;
let userScore = null;

$("#statusMenu a ").on("click", function() {
    $("#statusButton").text($(this).text());
    status = $("#statusButton").text()
});

$("#formatMenu a ").on("click", function() {
    $("#formatButton").text($(this).text());
    format = $("#formatButton").text()
});

$("#scoreMenu a ").on("click", function() {
    $("#scoreButton").text($(this).text());
    userScore = $("#scoreButton").text();
});

$(".user-form").submit(event => {
    event.preventDefault();
    $("div #loadingIcon").css("visibility", "visible");
    userName = $("#malName").val();
    requestUser(status, userName);
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function requestUser(status, userName) {
    const userEndpoint = `https://api.jikan.moe/v3/user/${userName}`;
    if (userName === "" || status === null || format === null) {
        $("#result-no-input").show();
    } else {
        $("#result-no-input").hide();
        const response = await fetch(userEndpoint);
        const data = await response.json();
        if (data["status"] == "404") {
            $("#result-user-exist").show();
        }
        if (data["status"] == "400") {
            $("#result-list-private").show();
        } 
        else {
            $("#result-user-exist").hide();
            $("#result-list-private").hide();
            getListStats(data, status);
        }
    }
}

async function getListStats(data, status) {
    if (userName.charAt(0) !== (data.username).charAt(0)) {
        userName = (data.username).charAt(0) + userName.substring(1,);
    }
    let listType = status;
    if (listType === "Watching" || listType === "Completed" || listType === "Dropped") {
        listType = listType.toLowerCase();
        const entries = data["anime_stats"][listType];
        requestListType(userName, entries, status);
    } else if (listType === "On-Hold" || listType === "Plan to Watch") {
        listType = listType.toLowerCase().replace(/-|\s/g, "_");
        const entries = data["anime_stats"][listType];
        requestListType(userName, entries, status);
    }
}

async function requestListType(userName, entries, status) {
    status = status.toLowerCase().replace(/-|\s/g, "");
    pageNum = Math.ceil(entries / 300);
    let animeEntries = [];
    let page = 1
    let data;

    for (page = 1; page <= pageNum; page++) {
        const listTypeEndpoint = `https://api.jikan.moe/v3/user/${userName}/animelist/${status}/${page}`;
        const response = await fetch(listTypeEndpoint);
        data = await response.json();
        console.log(`Requesting ${userName}'s ${status} list - page ${page} out of ${page}`);
        animeEntries.push(...data["anime"]);
    }
    console.log(`Finished requesting ${userName}'s ${status} list!`);
    filterBy(animeEntries, format, userScore);
    sleep(4000);
}

async function filterBy(animeEntries, format, userScore) {
    if ((format === "All") && (userScore !== null)) {
        const filteredAnime = animeEntries.filter(anime => (anime.score === parseInt(userScore)) ? true : false)
        displayAnimeContent(filteredAnime);
    }
    else if ((format !== "All") && userScore !== null) {
        const filteredAnime = animeEntries.filter(anime => ((anime.score === parseInt(userScore)) 
            && (anime.type === format)) ? true : false);
        displayAnimeContent(filteredAnime);
    } 
    else if ((format !== "All" && userScore === null)) {
        const filteredAnime = animeEntries.filter(anime => (anime.type === format) ? true : false);
        displayAnimeContent(filteredAnime);
    } 
    else if ((format === "All" && userScore === null)) {
        displayAnimeContent(animeEntries);
    }
}

async function requestAnime(id) {
    const animeEndpoint = `https://api.jikan.moe/v3/anime/${id}`;
    fetch(animeEndpoint)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        
        const animeScore = data.score;
        $("#animeType").after(
            `
            <h6 class="card-subtitle mb-2 text-white" id="malScore">
                <b>MAL Score:</b> ${animeScore}
            </h6>
            `
        );
        
        let animeSource = data.source;
        $("#animeType").before(
            `
            <h6 class="card-subtitle mb-2 text-white" id="animeSource">
                <b>Source:</b> ${animeSource}
            </h6>
            `
        );

        const animeTitle = data.title;
        const animeTitleJP = data.title_japanese;
        const animeSynopsis = data.synopsis.trim();
        $("#malPageButton").after(
                `
                <button type="button" class="btn btn-primary" id="synopsisModal" data-toggle="modal" data-target="#modalLongSynopsis">
                    <p><b>Synopsis</b></p>
                </button>
                <div class="modal fade" id="modalLongSynopsis" tabindex="-1" role="dialog" aria-labelledby="infoModal" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="infoModal">
                                    <b>${animeTitle}</b>
                                    </div>
                                    <i>${animeTitleJP}</i>
                                </h5>
                            </div>
                                <div class="modal-body">
                                    ${animeSynopsis}
                                </div>
                        </div>
                    </div>
                </div>
                `
            );
    });
}

async function displayAnimeContent(animeArray) {
    const randomNumber = Math.floor(Math.random() * animeArray.length);
    let itemContent = "";

    if (animeArray.length === 0 && userScore === null) {
        $("#result-list-no-entries > span").text(`Sorry, there are no anime entries found in ${userName}'s ${status} list! Please try again!`);
        $("#result-list-no-entries").show();
        
    } else if (animeArray.length === 0 && userScore !== null) {
        $("#result-list-no-entries > span").text(`Sorry, there are no anime entries with a score of ${userScore} found in ${userName}'s ${status} list! Please try again!`);
        $("#result-list-no-entries").show();
    } else {
        $("#result-list-no-entries").hide();
    }

    const addContent = async (anime, index) => {

        if (randomNumber === index) {
            const animeID = anime.mal_id;
            requestAnime(animeID);
            const animeTitle = anime.title;
            const animeType = anime.type;
            const animeImage = anime.image_url.replace(".jpg", "l.jpg");
            const animeURL = anime.url;
            let animeUserScore = anime.score;
            let totalEpisodes = anime.total_episodes;
            const animeWatchingStatus = anime.watching_status;
            const animeAiringStatus = anime.airing_status;

            if (animeUserScore === 0 && (animeWatchingStatus === 6 || animeWatchingStatus === 1)) {
                animeUserScore = "-";
            }

            if (totalEpisodes === 0 && animeAiringStatus === 1) {
                totalEpisodes = "N/A";
            }


            itemContent += `
            <div class="mx-auto d-flex justify-content-between card border border-primary" style="width: 18rem;">
                    <img class="card-img-top" src="${animeImage}" alt="${animeTitle}">
                <div class="card-body text-dark">
                    <h5 class="card-title text-white">${animeTitle}</h5>
                    <h6 class="card-subtitle mb-2 text-white" id="animeType"><b>Type:</b> ${animeType}</h6>
                    <h6 class="card-subtitle mb-2 text-white" id="episodes"><b>Episodes:</b> ${totalEpisodes}</h6>
                    <h6 class="card-subtitle mb-2 text-white" id="userRating"> <b>${userName}'s Score:</b> ${animeUserScore}</h6>
                <a id="malPageButton" href="${animeURL}" target="_blank">
                    <img src="MAL.png" width="30" height="30">
                </a>
            </div>
        </div>`
        }
    }
    animeArray.forEach(addContent);
    document.querySelector(".card--content").innerHTML = itemContent;
    sleep(4000);
}








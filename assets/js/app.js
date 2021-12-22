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

/**
 * 
 *
 * Description: Delays execution of a function for a fixed amount of time e.g 4 milliseconds -> 4 seconds
 *
 *
 **/
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * 
 *
 * Description: Requests for a MyAnimeList user entered in form input, displays error if the user does not exist or their
 * list is set to private. Data sent to getListStats() function
 *
 *
 **/
async function requestUser(status, userName) {
    const userEndpoint = `https://api.jikan.moe/v3/user/${userName}`;
    if (userName === "" || status === null || format === null) {
        $("#result-no-input").show();
        setTimeout(function() {
            $("#result-no-input").hide(); 
        }, 5000);
        $("div #loadingIcon").css("visibility", "hidden");
    } else {
        const response = await fetch(userEndpoint);
        const data = await response.json();
        if (data["status"] == 404) {
            $("#result-user-exist").show();
            setTimeout(function() {
                $("#result-user-exist").hide(); 
            }, 3000);
            $("div #loadingIcon").css("visibility", "hidden");
        }
        else if (data["status"] == 400) {
            $("#result-list-private").show();
            setTimeout(function() {
                $("#result-user-private").hide(); 
            }, 3000);  
        }
        else if (data["status"] == 503) {
            $("#result-list-error").show();
            setTimeout(function() {
                $("#result-user-private").hide(); 
            }, 3000);  
        } 
        else {
            getListStats(data, status);
        }
    }
}

/**
 * 
 *
 * Description: This function gets user's entries based on their List status selection and this data is sent to 
 * requestListType() function for manipulation.
 *
 *
 **/
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

/**
 * 
 *
 * Description: Fetches endpoint of user's anime list based on their status and is spread into a new array for easy
 * array manipulation. 
 *
 *
 **/
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
        Array.prototype.push.apply(animeEntries, data["anime"]);
    }
    console.log(`Finished requesting ${userName}'s ${status} list!`);
    filterBy(animeEntries, format, userScore);
    sleep(4000);
}

/**
 * 
 *
 * Description: Filters the array entries based on format and score selection. The processed array is 
 * passed to displayAnimeContent() function
 *
 *
 **/
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

/**
 * 
 *
 * Description: Anime page request endpoint
 *
 *
 **/
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
                                    <i>Native title: ${animeTitleJP}</i>
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

/**
 * 
 *
 * Description: Displays a card view of a randomly selected anime in the filtered array with information
 * the random anime entry.
 *
 *
 **/
async function displayAnimeContent(animeArray) {
    const randomNumber = Math.floor(Math.random() * animeArray.length);
    let itemContent = "";

    if (animeArray.length === 0 && userScore === null) {
        $("#result-list-no-entries > span").text(`No ${format} anime entries in ${status} list!`);
        $("#result-list-no-entries").show();
        setTimeout(function() {
            $("#result-list-no-entries").hide(); 
        }, 5000);
    } else if (animeArray.length === 0 && userScore !== null) {
        $("#result-list-no-entries > span").text(`No anime entries with score ${userScore} in ${status} list!`);
        $("#result-list-no-entries").show();
        setTimeout(function() {
            $("#result-list-no-entries").hide(); 
        }, 5000);
        
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








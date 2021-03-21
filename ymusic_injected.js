class Mopidy {
    constructor() {
        this._url = "http://192.168.1.108:6680/mopidy/rpc";

    }
    addPlaylistToQueue(id) {
        chrome.runtime.sendMessage({
            method: "addPlaylistToQueue",
            params: [id]
        });
    }
    playPlaylist(id) {
        chrome.runtime.sendMessage({
            method: "playPlaylist",
            params: [id]
        });
    }

}

const mopidy = new Mopidy();


function scanForPlaylists() {
    let playlist_blocks = document.querySelectorAll("div.playlist.playlist_selectable button.button-play.button_action");
    playlist_blocks.forEach(el => {
        if (el.getAttribute("mopidyfied") !== "true") {
            replacePlayButton(el);
        };

    })
}

function replacePlayButton(el) {
    el.setAttribute("mopidyfied", "true");
    const mopidyBlock = document.createElement("div");
    mopidyBlock.className = "play_button_container";
    el.parentNode.replaceChild(mopidyBlock, el);

    mopidyBlock.appendChild(el);
    const playlistId = el.attributes["data-idx"].value;
    const mopidyPlay = document.createElement("button");
    mopidyPlay.className = "mopidy_playlist_action mopidy_playlist_play"
    mopidyPlay.addEventListener("click", (e) => {
        e.stopPropagation();
        mopidy.playPlaylist(playlistId);
        return false;
    });

    const mopidyPlaylistAdd = document.createElement("button");
    mopidyPlaylistAdd.className = "mopidy_playlist_action mopidy_playlist_add"
    mopidyPlaylistAdd.addEventListener("click", (e) => {
        e.stopPropagation();
        mopidy.addPlaylistToQueue(playlistId);
        return false;
    });

    mopidyBlock.appendChild(mopidyPlay);
    mopidyBlock.appendChild(mopidyPlaylistAdd);

}

setInterval(scanForPlaylists, 1000);
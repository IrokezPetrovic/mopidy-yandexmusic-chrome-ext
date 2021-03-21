class Mopidy {
    constructor() {

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
    addAlbumToQueue(albumId) {
        chrome.runtime.sendMessage({
            method: "addAlbumToQueue",
            params: [albumId]
        });
    }

    playAlbum(albumId) {
        chrome.runtime.sendMessage({
            method: "playAlbum",
            params: [albumId]
        });
    }

}

const mopidy = new Mopidy();


function scanForPlaylists() {
    let playlist_blocks = document.querySelectorAll("div.playlist.playlist_selectable button.button-play.button_action");
    playlist_blocks.forEach(el => {
        if (el.getAttribute("mopidyfied") !== "true") {
            processPlaylistBlock(el);
        };
    });

    let album_blocks = document.querySelectorAll("div.album.album_selectable button.button-play.button_action");
    album_blocks.forEach(el => {
        if (el.getAttribute("mopidyfied") !== "true") {
            processAlbumBlock(el);
        };
    });

}

function processAlbumBlock(el) {
    el.setAttribute("mopidyfied", "true");
    const mopidyBlock = document.createElement("div");
    mopidyBlock.className = "play_button_container";
    el.parentNode.replaceChild(mopidyBlock, el);

    mopidyBlock.appendChild(el);
    const albumId = el.attributes["data-idx"].value;
    const mopidyPlay = document.createElement("button");
    mopidyPlay.className = "mopidy_playlist_action mopidy_playlist_play"
    mopidyPlay.addEventListener("click", (e) => {
        e.stopPropagation();
        mopidy.playAlbum(albumId);
        return false;
    });

    const mopidyPlaylistAdd = document.createElement("button");
    mopidyPlaylistAdd.className = "mopidy_playlist_action mopidy_playlist_add"
    mopidyPlaylistAdd.addEventListener("click", (e) => {
        e.stopPropagation();
        mopidy.addAlbumToQueue(albumId);
        return false;
    });

    mopidyBlock.appendChild(mopidyPlay);
    mopidyBlock.appendChild(mopidyPlaylistAdd);
}

function processPlaylistBlock(el) {
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
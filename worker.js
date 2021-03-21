

class Mopidy {
    constructor() {
        this._lastRequestId = 0;
        this._queue = new Map();

        chrome.storage.sync.get(["mopidy.baseUrl"], (items) => {
            if (items["mopidy.baseUrl"]) {
                this._updateUrl(items["mopidy.baseUrl"]);
            }
        });
        chrome.storage.sync.onChanged.addListener((items) => {
            console.log("Changed:", items);
            if (items["mopidy.baseUrl"]) {
                this._updateUrl(items["mopidy.baseUrl"].newValue)
                if (this._ws) {
                    this._ws.close();
                }
            }
        })
        
        this._url = "";
        this._reconnectWs();
    }

    _updateUrl(url) {
        console.log("Update url " + url);
        this._url = url;
    }
    _reconnectWs() {
        if (!this._url) {
            setTimeout(() => {
                this._reconnectWs();
            }, 100);
            return;
        }
        const url = this._url + "/mopidy/ws";
        console.log("Connect to " + url);
        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log("Connected!");
                chrome.action.setBadgeBackgroundColor(
                    { color: '#08d58f' }
                );
                chrome.action.setBadgeText({ text: "Ok" })
                this._ws = ws;
            }
            ws.onerror = (e) => {
                chrome.action.setBadgeBackgroundColor(
                    { color: '#ff0000' }
                );
                chrome.action.setBadgeText({ text: "!" })
                console.warn("Error:", e);
            }

            ws.onclose = (code, reason) => {
                console.warn("Closed", code, reason);
                chrome.action.setBadgeText({ text: "" })
                this._ws = null;
                setTimeout(() => {
                    console.log("reconnect");
                    this._reconnectWs();
                }, 1000);
            }

            ws.onmessage = (msg) => {
                console.debug(msg.data);
                const json = JSON.parse(msg.data);
                const id = json["id"];
                if (!this._queue.has(id)) {
                    return;
                }

                const resolve = this._queue.get(id);
                resolve(json["result"]);
            }
        } catch (e) {
            setTimeout(() => {
                console.log("reconnect");
                this._reconnectWs();
            }, 1000);
        }
    }
    _requestId() {
        return this._lastRequestId++;
    }
    async isOk() {
        let isOk = !!this._ws;
        while (!isOk) {
            await new Promise(resolve => setTimeout(resolve, 100))
            isOk = !!this._ws;
        }
    }
    _request(method, params) {
        return new Promise((resolve) => {
            const req = {
                method,
                params,
                id: this._lastRequestId,
                jsonrpc: "2.0"
            }
            console.log(req);
            this._queue.set(req.id, resolve);
            this._ws.send(JSON.stringify(req));
        });
    }
    async play() {
        await this.isOk();
        await this._request("core.playback.play", [])
    }
    async addTracksToQueue(uris) {
        await this.isOk();
        await this._request("core.tracklist.add", [
            null, null, uris
        ])
    }

    async addPlaylistToQueue(playlistId) {
        await this.isOk();
        const playlist = await this._request("core.playlists.lookup", ["yandexmusic:playlist:" + playlistId])
        const uris = playlist.tracks.map(t => t.uri);
        await this.addTracksToQueue(uris);
    }

    async playPlaylist(playlistId) {
        await this.isOk();
        const playlist = await this._request("core.playlists.lookup", ["yandexmusic:playlist:" + playlistId])
        const uris = playlist.tracks.map(t => t.uri);
        await this._request("core.tracklist.clear", []);
        await this.addTracksToQueue(uris);
        await this.play();
    }

    async addAlbumToQueue(albumId) {
        await this.isOk();
        const albumUri = "yandexmusic:album:" + albumId
        const albums = await this._request("core.library.lookup", [[albumUri]])
        const uris = albums[albumUri].map(t => t.uri);
        await this.addTracksToQueue(uris)
    }

    async playAlbum(albumId) {
        await this.isOk();
        const albumUri = "yandexmusic:album:" + albumId
        const albums = await this._request("core.library.lookup", [[albumUri]])
        await this._request("core.tracklist.clear", []);
        const uris = albums[albumUri].map(t => t.uri);
        await this.addTracksToQueue(uris)
        await this.play();
    }



}

const mopidy = new Mopidy();

chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    console.log(request, sender);
    const method = request["method"];
    if (!method) {
        return;
    }
    if (!mopidy[method]) {
        console.warn("Unknown method " + method)
    }
    let params = request["params"];
    if (!params) {
        params = [];
    }
    const result = await mopidy[method].apply(mopidy, params);

    if (callback) {
        callback(result)
    }


})

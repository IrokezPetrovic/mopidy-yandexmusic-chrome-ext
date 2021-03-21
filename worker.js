

class Mopidy {
    constructor() {

        this._lastRequestId = 0;
        this._queue = new Map();
        this._reconnectWs();
    }

    _reconnectWs() {
        const ws = new WebSocket("ws://192.168.1.108:6680/mopidy/ws/");
        ws.onopen = () => {
            console.log("Connected!");
            this._ws = ws;
        }
        ws.onerror = (e) => {
            console.warn("Error:", e);
            this._ws = null;
            setTimeout(() => {
                console.log("reconnect");
                this._reconnectWs();
            }, 1000);
        }

        ws.onclose = (code, reason) => {
            console.warn("Closed", code, reason);
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
    }
    _requestId() {
        return this._lastRequestId++;
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
        await this._request("core.playback.play", [])
    }
    async addTracksToQueue(uris) {
        await this._request("core.tracklist.add", [
            null, null, uris
        ])
    }

    async addPlaylistToQueue(playlistId) {
        const playlist = await this._request("core.playlists.lookup", ["yandexmusic:playlist:" + playlistId])
        const uris = playlist.tracks.map(t => t.uri);
        await this.addTracksToQueue(uris);
    }

    async playPlaylist(playlistId) {
        const playlist = await this._request("core.playlists.lookup", ["yandexmusic:playlist:" + playlistId])
        const uris = playlist.tracks.map(t => t.uri);
        await this._request("core.tracklist.clear", []);
        await this.addTracksToQueue(uris);
        await this.play();

    }
}

const mopidy = new Mopidy();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    mopidy[method].apply(mopidy, params);


})

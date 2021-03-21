console.log("Start")


document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(null,(items)=>{
        console.log("Settings loaded");
        document.getElementById("mopidy-baseurl").value = items["mopidy.baseUrl"];
    })
    console.log("Init");
    const btnSave = document.getElementById("btn-save");
    btnSave.addEventListener("click", saveSettings);
});


function saveSettings() {
    console.log("Save")
    const settings = {
        "mopidy.baseUrl": document.getElementById("mopidy-baseurl").value
    }
    chrome.storage.sync.set(settings,()=>{
        console.log("Saved")
    });
}






var mapping = {
  // actions: {
  //   'add-later': 
  //   'add-maybe':
  //   'add-custom':
  // }
};

var _PL_KeyPrefixes = {
  v0 : {
    link : "l",
    title : "t"
  }
};

var _PL_Keys = {
  v0 : {
    aIDs : "aIDs",
    isFirstTime : null
  }
}

var _PL_ArticleIDs = [];

function setup(){
  var params = {};
  params[_PL_Keys.v0.isFirstTime]
  chrome.storage.local.get({ _PL_Keys.v0.isFirstTime: });
}
/*
 *  Generate a sequential string id
 *  Returns a string id which should be an previously unused key in local storage
 */
function generateNextID(){
  chrome.storage.local.get('nextID', function(){
    chrome.storage.local.set({ 'nextID' : id + 1 });
  });

  // TODO: stopping point
  // need synchronization mechanism here such as q.js or jquery deferred

  return id.toString();
}

function saveArticleIDs(callback){
  var params = {};
  params[_PL_Keys.v0.aIDs] = _PL_ArticleIDs.toString();

  chrome.storage.local.set(params, callback);
}

function addArticleID(id){
  _PL_ArticleIDs.push(id);
}

chrome.storage.local.get(_PL_Keys.v0.aIDs, function(obj){
  var arr = obj[_PL_Keys.v0.aIDs];
  _PL_ArticleIDs = arr.split(",");
});


//setup the right-click menu
chrome.runtime.onInstalled.addListener(function(){

  chrome.contextMenus.create({
    id: 'open',
    title: chrome.i18n.getMessage('openContextMenuTitle'),
    contexts: ['link']
  });

  chrome.contextMenus.create({ 
      id: 'add-later',
      title: 'Mark for Later',
      parentId: 'open',
      contexts: ['link']
  });
  chrome.contextMenus.create({ 
      id: 'Mark for Maybe',
      title: 'Add to Maybe',
      parentId: 'open',
      contexts: ['link']
  });
  chrome.contextMenus.create({ 
      id: 'add-custom',
      title: 'Mark for List',
      parentId: 'open',
      contexts: ['link']
  });


  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    var title, link;

    console.log(info);
    console.log(tab);

    // extract the info we can get from the right click
    link = info.linkUrl;
    title = info.selectionText;

    // TODO: validate the link is valid URL

    // TODO: catch non-initialization cases
    // if(!link){
      
    // }


    var saveObj = {};
    var id = generateNextID();

    saveObj[id + '-' + _PL_KeyPrefixes.v0.title] = title;
    saveObj[id + '-' + _PL_KeyPrefixes.v0.link] = link;

    addArticleID(id);

   // Save it using the Chrome extension storage API.
    chrome.storage.local.set(saveObj, function() {

      //save the ArticleIDs array
      saveArticleIDs(function(){

        if(chrome.runtime.lastError){
          //error handling here
        }

        // Notify that we saved.
        new Notification("New Item Added", {
          body: title, 
           icon: ''
        });
      });

    });

    // chrome.downloads.download({url: info.linkUrl}, function(downloadId) {
      // var ids = getOpeningIds();
      // if (ids.indexOf(downloadId) >= 0) {
      //   return;
      // }
      // ids.push(downloadId);
      // setOpeningIds(ids);
    // });
  });

});
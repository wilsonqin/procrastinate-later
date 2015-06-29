


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
    isNotFirstTime : "isNotFirstTime",
    nextID: 'nextID'
  }
};

var _PL_ArticleIDs = [];
var _PL_NextID;

function printAllStorage(){
  chrome.storage.local.get(null, function(obj){
    console.log(obj);
  });
}

function setup(){
  var storageInit = $.Deferred();

  chrome.storage.local.get(_PL_Keys.v0.isNotFirstTime, function(obj){
    // check if it is the first time the extension is run
    var isNotFirstTime = obj[_PL_Keys.v0.isNotFirstTime];
    console.log("isNotFirstTime: ", isNotFirstTime);

    var params = {};

    if(!isNotFirstTime){
      //first time setup
      params[_PL_Keys.v0.aIDs] = _PL_ArticleIDs.toString();
      params[_PL_Keys.v0.isNotFirstTime] = true;
      params[_PL_Keys.v0.nextID] = 1;
      chrome.storage.local.set(params, function(){
        //TODO handle error here
      });
    }else{
      var key = _PL_Keys.v0.aIDs;
      chrome.storage.local.get(key, function(obj){
        if(obj && (obj[key] !== "")){
          _PL_ArticleIDs = obj[key].split(",");
        }
      });
    }

    chrome.storage.local.get(_PL_Keys.v0.nextID, function(obj){
      _PL_NextID = obj[_PL_Keys.v0.nextID];
      storageInit.resolve();
    });
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
            console.log("error happened: ", chrome.runtime.lastError);
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
}
/*
 *  Generate a sequential string id
 *  Returns a string id which should be an previously unused key in local storage
 *  
 *  PRE-REQ: Jquery must be loaded already. Need this for synchronization
 */
function generateNextID(){
  var params = {};

  var id = _PL_NextID;
  _PL_NextID += 1;
    
  // advances the nextID counter in storage
  params[_PL_Keys.v0.nextID] = _PL_NextID;
  chrome.storage.local.set(params);

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

//init
setup();
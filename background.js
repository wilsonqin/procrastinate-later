/*
 * Background chrome extension script for the plugin.
 *
 *
 * By Wilson Qin
 */


// configuration settings

// milliseconds to wait before notifications auto-disappear/cancel
var __NOTIFICATION_TIMEOUT = 3000;


var mapping = {
  // actions: {
  //   'add-later': 
  //   'add-maybe':
  //   'add-custom':
  // }
};

// Namespacing, post-fixes for formulating storage keys (for local storage)
var _PL_KeyPrefixes = {
  v0 : {
    link : "l",
    title : "t",
    date : "d"
  }
};

// Storage Keys (for local storage) organized here
var _PL_Keys = {
  v0 : {
    aIDs : "aIDs",
    isNotFirstTime : "isNotFirstTime",
    nextID: 'nextID'
  }
};

var _PL_ArticleIDs = [];
var _PL_NextID;

function clearAllStorage(){
  chrome.storage.local.clear();
}

function printAllStorage(){
  chrome.storage.local.get(null, function(obj){
    console.log(obj);
  });
}

function setupStorageInit(){
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

  return storageInit;
}

function setup(){

  //setup the right-click menu
  chrome.contextMenus.create({
    id: 'open',
    title: chrome.i18n.getMessage('openContextMenuTitle'),
    contexts: ['link']
  }, function(){
    if(chrome.runtime.lastError){
      console.log("error with creating contextMenu: ", chrome.runtime.lastError);
    }
  });

  // chrome.contextMenus.create({ 
  //     id: 'add-later',
  //     title: 'Mark for Later',
  //     parentId: 'open',
  //     contexts: ['link']
  // });

  // chrome.contextMenus.create({ 
  //     id: 'Mark for Maybe',
  //     title: 'Add to Maybe',
  //     parentId: 'open',
  //     contexts: ['link']
  // });
  // chrome.contextMenus.create({ 
  //     id: 'add-custom',
  //     title: 'Mark for List',
  //     parentId: 'open',
  //     contexts: ['link']
  // });

  //handler for the right-click menu
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    var title, link;

    console.log(info);

    // extract the info we can get from the right click
    link = info.linkUrl;
    title = info.selectionText;

    // TODO: validate the link is valid URL
    // here

    // Catch if title is undefined (this can happen in facebook sometimes)
    if(title === undefined){
      title = link;
    }

    saveArticle(title, link);

  });

  setupStorageInit();
}

/*
 *  Add an article to storage
 *
 */
function saveArticle(title, link){
  var saveObj = {};
  var id = generateNextID();

  saveObj[id + '-' + _PL_KeyPrefixes.v0.title] = title;
  saveObj[id + '-' + _PL_KeyPrefixes.v0.link] = link;
  saveObj[id + '-' + _PL_KeyPrefixes.v0.date] = (new Date()).toString();

  addArticleID(id);

 // Save it using the Chrome extension storage API.
  chrome.storage.local.set(saveObj, function() {

    if(chrome.runtime.lastError){
      //error handling needs to happen here for saving the article attributes to storage
      console.log("error happened: ", chrome.runtime.lastError);
    }

    //save the ArticleIDs array to storage
    saveArticleIDs(function(){

      if(chrome.runtime.lastError){
        //error handling here
        console.log("error happened: ", chrome.runtime.lastError);
      }

      // Notify that we saved.
      var notif = new Notification("New Item Added", {
        body: title, 
         icon: ''
      });

      setTimeout(function(){
        notif.close();
      }, __NOTIFICATION_TIMEOUT);
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

/*
 * Remove an article from Local Storage
 */
function removeArticle(id){
  var keys = [];

  // build array of attribute keys for article with ID `id`
  for(var k in _PL_KeyPrefixes.v0){
    keys.push(id.toString() + _PL_KeyPrefixes.v0[k]);
  }

  chrome.storage.local.remove(keys, function(){
    if(chrome.runtime.lastError){
      console.log("error removing article: ", chrome.runtime.lastError);
    }
  });
}

/*
 *  Propogate current ArticleID array in-memory, to storage
 */
function saveArticleIDs(callback){
  var params = {};
  params[_PL_Keys.v0.aIDs] = _PL_ArticleIDs.toString();

  chrome.storage.local.set(params, callback);
}

/*
 *  Add an article id to the in-memory articleID array.
 *  Note: Need to invoke save of the array to propogate to storage
 */
function addArticleID(id){
  _PL_ArticleIDs.push(id.toString());
}

/*
 *  Remove an article id from the in-memory articleID array.
 *  Note: Need to invoke save of the array to propogate to storage
 */
function removeArticleID(id){
  var index = _PL_ArticleIDs.indexOf(id.toString());
  if (index > -1) {
    _PL_ArticleIDs.splice(index, 1);
  }
}

/*
 * Get ArticleIDs array
 */
function getArticleIDs(){
  return _PL_ArticleIDs;
}

/*
 * Get Key Prefixes Array
 */
function getKeyPrefixes(){
  return _PL_KeyPrefixes.v0;
}

/*
 * Reset
 */
function reset(callback){
  _PL_ArticleIDs = [];
  _PL_NextID = 1;

  var resetting = $.Deferred();

  clearAllStorage(function(){
    resetting = setupStorageInit();
  });

  $.when(resetting).done(callback);
}

//init
setup();
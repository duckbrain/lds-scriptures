(function() {
  //var database, navigation;

  function getI18nMessage(name, params) {
    return chrome.i18n.getMessage(name, params) || name;
  }

  database = new DatabaseModel();
  database.download = new DatabaseQuery(new ChromeMessageProvider()).download;
  navigation = new NavigationModel(database);

  navigation.loadPath(location.href);
  navigation.getI18nMessage = getI18nMessage;

  database.open().then(navigation.initialize).then(navigation.navigateLoaded);
})();

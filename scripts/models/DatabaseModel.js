if (typeof require == 'function') {
    var SettingsModel = require('./SettingsModel.js');
    var LanguageModel = require('./LanguageModel.js');
    var CatalogModel = require('./CatalogModel.js');
    var BookModel = require('./BookModel.js');
    var FolderModel = require('./FolderModel.js');
    var PathModel = require('./PathModel.js');
    var LDSContentProvider = require('./LDSContentProvider.js');
    var db = require('../dependencies/db.js');
}

function DatabaseModel() {
    this.server = null;
    this.connection = {
        server: 'duck.jonathan.lds-scriptures',
        version: 5,
        schema: {
            languages: {
                key: {
                    keyPath: 'id'
                },
                indexes: {
                    id: {
                        unique: true
                    },
                    code: {
                        unique: true
                    }
                }
            },
            settings: {
                key: {
                    keyPath: 'id'
                },
                indexes: {
                    'id': {}
                }
            },
            /**
             * Represents the root catalog for any given language
             */
            catalogs: {
                key: {
                    keyPath: 'languageId'
                }
            },
            books: {
                key: {
                    keyPath: [ 'languageId', 'id' ]
                },
                indexes: {
                    languageId: {},
                    id: {},
                    unique: {
                        key: [ 'languageId', 'id' ],
                        unique: true
                    },
                    path: {}
                }
            },
            folders: {
                key: {
                    keyPath: [ 'languageId', 'id' ]
                },
                indexes: {
                    languageId: {},
                    id: {},
                    unique: {
                        key: [ 'languageId', 'id' ],
                        unique: true
                    },
                    name: {}
                }
            }
        }
    };

    this.setting = new SettingsModel(this);
    this.language = new LanguageModel(this);
    this.catalog = new CatalogModel(this);
    this.book = new BookModel(this);
    this.folder = new FolderModel(this);
    this.path = new PathModel(this);
    this.contentProvider = new LDSContentProvider();
    this.helpers = DatabaseModel.helpers;
}

DatabaseModel.prototype = {
    open: function open() {
        var that = this;
        return db.open(this.connection).then(function(server) {
            that.server = server;
            return that;
        });
    },
    close: function close() {
        this.server.close();
        this.server = null;
    }
};

DatabaseModel.helpers = {
    existsSingle: function existsSingle(promiseAttempt) {
        // TODO: Return a promise that returns true or false
    },
    listToSingle: function listToSingle(list) {
        return list[0];
    },
    dataToIdArray: function dataToIdArray(array) {
        var newArray = [ ];
        for (var i = 0; i < array.length; i++) {
            newArray.push(array[i].id);
        }
        return newArray;
    }
}

if (typeof module != 'undefined') {
    module.exports = DatabaseModel;
}
function LanguageModel(database) {
    this.database = database;
};

LanguageModel.prototype = {

    /**
     * Downloads and installs the language list.
     * 
     * @returns Promise
     */
    download: function() {
        var that = this;

        return this.database.contentProvider.getLanguages().then(
                function(response) {
					return response.languages;
                }).then(this.addAll);
    },

    addAll: function addAll(languages) {
        var server = this.database.server;
        return Promise.all(languages.map(function(language) {
			return server.languages.update(language);
		}));
    },

    /**
     * Gets the list of languages
     * 
     * @returns Promise
     */
    getAll: function getAll() {
        return this.database.server.languages.query().all().execute();
    },

    /**
     * Gets the language with the given id
     * 
     * @returns Promise
     */
    get: function get(id) {
        return this.database.server.languages.get(id);
    },

    /**
     * Gets the language with the given language code (eg: 'en' for English)
     * 
     * @returns Promise
     */
    getByCode: function getByCode(code) {
        return this.database.server.languages.query('code').only(code)
                .execute().then(this.database.helpers.listToSingle);
    }
};

if (typeof module != 'undefined') {
    module.exports = LanguageModel;
}

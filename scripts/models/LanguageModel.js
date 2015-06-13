function LanguageModel(database) {
	var that = this;

	function init() {
		getAll().then(function (languages) {
			if (!languages.length) {
				return download();
			}
			return languages;
		});
	}

	function download() {
		return database.contentProvider.getLanguages().then(
			function (response) {
				return Promise.all(response.languages.map(database.server.languages.update));
			});
	}

	function getAll() {
		return database.server.languages.query().all().execute();
	}

	function get(id) {
		return database.server.languages.get(id);
	}

	function getByCode(code) {
		return database.server.languages.query('code').only(code)
			.execute().then(database.helpers.single);
	}

	function getByLdsCode(code) {
		return database.server.languages.query('code_three').only(code)
			.execute().then(database.helpers.single);
	}

	that.init = init;
	that.download = download;
	that.getAll = getAll;
	that.get = get;
	that.getByCode = getByCode;
	that.getByLdsCode = getByLdsCode;
};

if (typeof module != 'undefined') {
	module.exports = LanguageModel;
}

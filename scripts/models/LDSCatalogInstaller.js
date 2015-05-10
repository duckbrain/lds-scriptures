/**
 * Takes a catalog object downloaded from LDS.org and installs it into the paths
 * objectStore.
 * @param {DatabaseModel} database Database model for inter-class communication.
 */
function LDSCatalogInstaller(db, languageId) {
	var that = this;
	var helpers;
	var paths = {};
	var transaction, nodesOS;

	function install(root) {
		return new Promise(function (fulfill, reject) {
			transaction = db.transaction(['nodes'], 'readwrite');
			nodesOS = transaction.objectStore('nodes');
			helpers = new LDSInstallerHelpers(nodesOS);

			clear(function () {
				add(root.catalog, formatCatalog, null, function (item) {
					helpers.update(item, function () {
						fulfill();
					})
				})
			});

			transaction.onsuccess = fulfill;
			transaction.onerror = reject;
		});
	}

	function clear(callback) {
		var index = nodesOS.index('languageId');
		index.openCursor().onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				if (cursor.key == languageId) {
					nodesOS.delete(cursor.value.id)
				}
				cursor.continue();
			} else {
				callback();
			}
		}
	}

	function add(glItem, format, parent, callback) {
		var item = format(glItem);
		paths[item.path] = item;

		var request = nodesOS.add(item);
		request.onsuccess = function (event) {
			item.id = glItem.id = event.target.result;

			if (parent) {
				item.parent = parent;
				item.heiarchy = parent.heiarchy.concat([item]);
				parent.children.push(item);
			} else {
				item.parent = null;
				item.heiarchy = [item];
			}

			if (item.type != 'book') { // catalog or folder
				var requestCount;

				function checkDone() {
					requestCount--;
					if (requestCount == 0) {
						item.next = helpers.findSibling(+1, item);
						item.previous = helpers.findSibling(-1, item);
						if (item.type == 'folder') {
							item.path = createFolderPath(item);
						}
						callback(item);
					}
				}

				requestCount = glItem.folders.length + glItem.books.length;

				glItem.folders.forEach(function (glFolder) {
					add(glFolder, formatFolder, item, checkDone);
				});
				glItem.books.forEach(function (glBook) {
					add(glBook, formatBook, item, checkDone);
				});
			} else { //It's a book!
				item.children = [];
				callback();
			}
		};
	}

	function addOld(glItem, format, parent) {
		var item = format(glItem);
		paths[item.path] = item;

		return db.add(item).then(function (item) {
			var folderAdds, bookAdds;

			item = item[0]; // Item comes back as an array with one item

			if (parent) {
				item.parent = parent;
				item.heiarchy = parent.heiarchy.concat([item]);
				parent.children.push(item);
			} else {
				item.parent = null;
				item.heiarchy = [item];
			}

			if (item.type != 'book') { // Catalog or folder
				folderAdds = glItem.folders.map(function (glFolder) {
					return add(glFolder, formatFolder, item);
				});
				bookAdds = glItem.books.map(function (glBook) {
					return add(glBook, formatBook, item);
				});
				return Promise.all(folderAdds.concat(bookAdds)).then(function () {
					//TODO: Sort by display order
					item.next = helpers.findSibling(+1, item);
					item.previous = helpers.findSibling(-1, item);
					if (item.type == 'folder') {
						item.path = createFolderPath(item);
					}
					return item;
				});
			} else { //It's a book!
				item.children = [];
				return item;
			}
		});
	}

	function createFolderPath(item) {
		var pathElements, otherPath, path, newPath;
		path = item.path;
		if (item.children.length > 0) {
			// Try making one from the children
			pathElements = item.children[0].path.split('/');
			for (i = 1; i < item.children.length; i++) {
				otherPath = item.children[i].path.split('/');
				for (j = 0; j < pathElements.length; j++) {
					if (pathElements[j] != otherPath[j]) {
						pathElements = pathElements.slice(0, j);
					}
				}
			}
			newPath = pathElements.join('/');
		} else {
			// Try making one from the parent and name
			otherPath = item.name.replace(/\W+/g, '-').toLowerCase();
			pathElements = item.parent.path.split('/');
			pathElements.push(otherPath);
			newPath = pathElements.join('/');
			//else default to number
		}

		if (newPath && !(newPath in paths)) {
			path = newPath;
			paths[newPath] = item;
		}

		return path;
	}

	function formatBlank(item) {
		return {
			languageId: languageId,
			parent: null,
			path: item.path,
			next: null,
			previous: null,
			children: [],
			name: item.name,
			type: item.type,
			media: [],
			heiarchy: [],
			content: item.content || null,
			details: item.type == 'book' ? {
				url: item.url || null,
				css: null,
				downloadedVersion: null,
				catalogVersion: item.version || null
			} : null
		};
	}

	function formatCatalog(item) {
		return formatBlank({
			path: '/',
			name: item.name,
			type: 'catalog'
		});
	}

	function formatFolder(item) {
		//TODO: Make a path name by looking at what the children have in common or the name. Ensure that the same path name
		//is not used more than once. If the generated name matches an existing one, fall back to the id number
		var path = '/' + item.id;
		var i, j, pathElements, otherPath, newPath;

		return formatBlank({
			path: path,
			name: item.name,
			type: 'folder'
		});
	}

	function formatBook(item) {
		return formatBlank({
			path: item.gl_uri,
			name: item.name,
			type: 'book',
			content: item.description,
			url: item.url,
			version: item.datemodified
		})
	}

	that.install = install;
}

if (typeof module != 'undefined') {
	module.exports = LDSCatalogInstaller;
}

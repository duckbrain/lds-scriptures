function LDSInstallerHelpers(db) {
	var that = {};

	function findSibling(direction, item) {
		var index, siblings;

		if (item.parent) {
			siblings = item.parent.children
			index = siblings.indexOf(item);

			if (siblings[index + direction]) {
				return siblings[index + direction];
			} else {
				//TODO Traverse to find better sibling
				return null;
			}
		} else {
			return null;
		}
	}

	function update(item) {
		var children, parent, i;

		children = item.children;
		parent = item.parent;

		item.heiarchy = summary(item.heiarchy);
		item.next = summary(item.next);
		item.previous = summary(item.previous);
		item.children = summary(children);
		item.parent = summary(parent);

		for (i = 0; i < children.length; i++) {
			if (children[i].children.length == 1) {
				item.children[i].id = children[i].children[0].id;
				item.children[i].path = children[i].children[0].path;
			}
		}

		if (parent && parent.children && parent.children.length == 1) {
			item.parent.id = parent.parent.id;
			item.parent.path = parent.parent.path;
		}

		for (i = 1; i < item.heiarchy.length; i++) {
			fixName(item.heiarchy[i - 1], item.heiarchy[i]);
		}

		return Promise.all([
			db.update(item),
			children.map(update)
		]);
	}

	function fixName(parent, item) {
		var newName;
		if (!parent || !item) {
			return;
		}
		if (item.name != parent.name && item.name.indexOf(parent.name) == 0) {
			newName = item.name.substring(parent.name.length).trim();
			item.name = newName;
		}
	}

	function summary(item) {
		if (!item) {
			return null;
		} else if (Array.isArray(item)) {
			return item.map(summary);
		} else {
			return {
				id: item.id,
				name: item.name,
				path: item.path,
				type: item.type
			};
		}
	}

	that.findSibling = findSibling;
	that.update = update;

	return that;
}

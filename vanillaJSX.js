const createElement = (tag, props, ...children) => {
	if (tag == undefined) return undefined
	if (typeof tag === "function") return tag(props, ...children);
	const element = document.createElement(tag);

	Object.entries(props || {}).forEach(([name, value]) => {
		if (name == "className") {
			element.setAttribute("class", value.toString());
		} else if (typeof value == "function")
			element.addEventListener(name.toLowerCase().substr(2), value);
		else if (value === false) {
			// nothing, could cause problems in some situations, but solves the problem of tags without values, like checked
		} else element.setAttribute(name, value.toString());
	});

	children.forEach(child => {
		appendChild(element, child);
	});

	return element;
};

const appendChild = (parent, child) => {
	if (child == undefined) return
	if (Array.isArray(child))
		child.forEach(nestedChild => appendChild(parent, nestedChild));
	else
		parent.appendChild(child.nodeType ? child : document.createTextNode(child));
};

const createFragment = (props, ...children) => {
	return children;
};